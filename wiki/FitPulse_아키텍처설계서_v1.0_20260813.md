# 🏗️ FitPulse 아키텍처 설계서

| 항목 | 내용 |
|------|------|
| 문서 유형 | 아키텍처 설계서 (Architecture Design) |
| 버전 | v1.0 |
| 작성일 | 2026-08-13 |
| 관련 요구사항 | NFR-301~305, NFR-201~205, NFR-101~108 |

---

## 1. 아키텍처 개요 및 설계 원칙

### 1.1 개요

FitPulse는 **모바일 우선 클라이언트 + 모듈러 모놀리스 서버** 구조입니다. 네트워크 불안정 환경(헬스장)을 1급 제약으로 두고, 클라이언트에 영속 큐를 두어 **오프라인 우선(Offline-First)** 으로 동작합니다.

### 1.2 설계 원칙

| # | 원칙 | 적용 |
|---|------|------|
| AP-1 | **Offline-First** | 모든 기록 조작은 로컬 큐에 먼저 커밋, 서버 전송은 비동기 |
| AP-2 | **멱등성 우선** | 모든 쓰기 요청에 clientId(UUID) 부여, 서버 UNIQUE 제약으로 강제 |
| AP-3 | **파생값은 이벤트로 계산** | 조회 시 계산 대신 이벤트 기반 사전 계산 + 새벽 보정 (조회 성능 SLA 확보) |
| AP-4 | **AI는 구현 수단, 검증이 본질** | LLM 출력은 신뢰하지 않고 Schema→매핑→안전성 3중 검증 후에만 저장 |
| AP-5 | **외부 의존은 반드시 폴백** | AI는 3단 폴백, HC는 포그라운드 폴백, Redis 실패는 빠른 타임아웃 |
| AP-6 | **stateless 서버** | 세션은 Redis, 파일은 MinIO → 수평 확장 및 Blue-Green 가능 |
| AP-7 | **모듈 경계는 이벤트로** | 모듈 간 결합은 Spring ApplicationEvent 우선, 직접 서비스 호출 최소화 |
| AP-8 | **하위 호환 우선** | DDL·API 모두 backward-compatible 변경만 (컬럼 추가는 nullable/default) |

---

## 2. 시스템 구성도 (C4 모델)

### 2.1 Level 1 — System Context

```
        ┌──────────┐                 ┌────────────────────┐
        │  사용자   │──── 운동 기록 ──▶│                    │
        │ (일반)    │◀── 분석·추천 ────│   FitPulse 시스템   │
        └──────────┘                 │                    │
                                     └───┬────┬────┬──────┘
        ┌──────────────┐                 │    │    │
        │Health Connect│◀─ 건강 데이터 ──┘    │    │
        │ (Android OS) │                      │    │
        └──────────────┘                      │    │
        ┌──────────────┐                      │    │
        │ Google OAuth │◀── ID Token 검증 ────┘    │
        └──────────────┘                           │
        ┌──────────────────────────┐               │
        │ Claude API / OpenAI API  │◀─ 루틴 생성 ──┘
        └──────────────────────────┘
```

### 2.2 Level 2 — Container

```
┌───────────────────────────────── 모바일 단말 ──────────────────────────────┐
│ Flutter 3.47 앱                                                            │
│  ├── Presentation (GoRouter + Riverpod AsyncNotifier)                      │
│  ├── OperationQueueEngine ──▶ drift(SQLite) : pending_operations           │
│  ├── HealthConnectService  ──▶ Health Connect (Change Token, BG Observer)  │
│  ├── TokenManager          ──▶ flutter_secure_storage (Keystore)           │
│  └── Dio + AuthInterceptor ──▶ REST/HTTPS                                  │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │ HTTPS (JSON, Bearer Token)
┌──────────────────────────────────▼─────────────────────────────────────────┐
│ Spring Boot 4.1 API (Java 21, Virtual Threads)                             │
│  ├── presentation : REST Controller (SpringDoc 3)                          │
│  ├── application  : UseCase, Transaction 경계                              │
│  ├── domain       : Entity, 도메인 규칙 (1RM, 볼륨, 안전성 검증)            │
│  ├── infrastructure: JPA Repository, Redis, MinIO, LLM Client              │
│  ├── 내부 이벤트   : Spring ApplicationEvent                                │
│  ├── 회복탄력성    : Resilience4j (AI Circuit Breaker)                      │
│  ├── 스케줄러      : 파생값 보정, 계정 삭제 배치, 건강 데이터 집계           │
│  └── 관측         : Actuator (/health, /info, /prometheus)                  │
└───┬──────────┬──────────┬──────────────┬──────────────────┬────────────────┘
    │          │          │              │                  │
┌───▼───┐ ┌────▼───┐ ┌────▼────┐ ┌───────▼────────┐ ┌───────▼────────┐
│MySQL  │ │Redis   │ │MinIO    │ │Claude API      │ │Prometheus      │
│8.4    │ │7.4     │ │(S3 호환)│ │(→OpenAI 폴백)  │ │+ Grafana       │
│주 DB  │ │세션·캐시│ │이미지   │ │AI 루틴         │ │모니터링        │
└───────┘ └────────┘ └─────────┘ └────────────────┘ └────────────────┘
```

### 2.3 Level 3 — Component (모듈러 모놀리스)

```
com.fitpulse
├── user/            사용자·인증·기기·동의
├── exercise/        운동 라이브러리
├── routine/         루틴·버전·스케줄
├── workout/         세션·운동·세트·타이머
├── health/          건강 데이터·동기화·대시보드
├── recommendation/  AI 루틴 (LLM은 구현 수단)
├── analytics/       1RM·볼륨·빈도·스트릭
└── shared/          공통 (이벤트, 예외, 유틸, 보안)

각 모듈 내부 계층:
  presentation/  ← Controller, Request/Response DTO
  application/   ← UseCase(Service), 트랜잭션 경계, 이벤트 발행
  domain/        ← Entity, VO, 도메인 서비스, 도메인 이벤트
  infrastructure/← JpaRepository 구현, 외부 API 클라이언트
```

**모듈 의존 규칙**

```
presentation → application → domain
                    ↓
              infrastructure (domain 인터페이스 구현)

모듈 간:
  workout ──[WorkoutCompleted 이벤트]──▶ analytics
  health  ──[HealthDataSynced 이벤트]──▶ health(daily_summaries)
  recommendation ──[읽기]──▶ exercise (인터페이스 경유)
  ※ 다른 모듈의 Entity/Repository 직접 참조 금지
```

### 2.4 Level 4 — 핵심 코드 구조

상세 클래스·시퀀스 설계는 `FitPulse_상세설계서_v1.0` 참조.

---

## 3. 기술 스택 정의

### 3.1 Backend

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| Spring Boot | 4.1.0 | 메인 프레임워크 | 생태계 성숙도, Actuator/Security 통합 |
| Java | 21 LTS | 언어 | Virtual Threads로 I/O 바운드 처리 효율 |
| Spring Data JPA / Hibernate 7 | Boot 관리 | ORM | 도메인 중심 모델링 |
| Spring Security + OAuth2 Client | Boot 관리 | 인증/인가 | PKCE·ID Token 검증 표준 지원 |
| SpringDoc | 3.x | Swagger | **Boot 4에서 필수 버전** |
| Gradle (Wrapper) | 8.14+ | 빌드 | Kotlin DSL |
| MySQL | 8.4 | 주 DB | CTE·윈도우 함수, 운영 친숙도 |
| Redis | 7.4 | Refresh Token·캐시·랭킹 | TTL 기반 세션, stateless 확보 |
| MinIO | latest | 이미지 저장 | S3 호환, 자체 호스팅 가능 |
| Flyway | Boot 관리 | DB 마이그레이션 | 버전 관리 + Blue-Green 대비 |
| Resilience4j | - | Circuit Breaker | AI 장애 격리 |
| Claude API | claude-sonnet | AI 루틴 | 구조화 출력 품질 |

### 3.2 Mobile

| 기술 | 버전 | 용도 |
|------|------|------|
| Flutter | 3.47 stable | 크로스플랫폼 |
| Riverpod | 2.x | 상태 관리 (AsyncNotifier) |
| GoRouter | latest | 선언형 라우팅 |
| Dio + Retrofit | latest | HTTP + 인터셉터 |
| health | 13.x | Health Connect / HealthKit |
| drift (SQLite) | latest | Operation Queue + 로컬 캐시 |
| fl_chart | latest | 차트 |
| flutter_secure_storage | latest | 토큰 보안 저장 |
| google_sign_in | latest | Google OAuth2 |

### 3.3 Web (V1.1)

React 19, TypeScript 5, shadcn/ui + Tailwind, Recharts

### 3.4 인프라

Docker Compose, GitHub Actions, Prometheus + Grafana

---

## 4. 컴포넌트 간 인터페이스 정의

### 4.1 외부 인터페이스

| # | 소비자 | 제공자 | 프로토콜 | 인터페이스 | 실패 처리 |
|---|--------|--------|----------|------------|-----------|
| I-1 | Flutter | API 서버 | HTTPS/JSON | REST `/api/v1/**`, Bearer Token | 로컬 큐 적재 후 재시도 |
| I-2 | Flutter | Health Connect | Android SDK | getChangesToken / getChanges | TOKEN_EXPIRED → fullResync |
| I-3 | Flutter | Google | OAuth2 PKCE | Authorization Code | 사용자 취소 → 로그인 화면 유지 |
| I-4 | API 서버 | Google Token EP | HTTPS | code + verifier → ID Token | 검증 실패 → 401 |
| I-5 | API 서버 | Claude API | HTTPS | Messages API (JSON 출력) | CB OPEN → OpenAI |
| I-6 | API 서버 | OpenAI API | HTTPS | Chat Completions | 실패 → 템플릿 루틴 |
| I-7 | API 서버 | MinIO | S3 API | presigned URL | 업로드 실패 → 사진 없이 저장 |
| I-8 | Prometheus | API 서버 | HTTP | `/actuator/prometheus` scrape | - |

### 4.2 내부 이벤트 인터페이스

| 이벤트 | 발행 모듈 | 구독 모듈 | 처리 내용 | 동기/비동기 |
|--------|-----------|-----------|-----------|-------------|
| `WorkoutCompleted` | workout | analytics, workout | 볼륨·1RM·스트릭 갱신, computed_* 필드 계산 | 트랜잭션 커밋 후 비동기 |
| `SetModified` | workout | workout | 세션 파생값 재계산 | 커밋 후 비동기 |
| `HealthDataSynced` | health | health | daily_health_summaries 갱신 | 커밋 후 비동기 |
| `AiJobCompleted` | recommendation | recommendation | 루틴 검증·저장, 비용 집계 | 비동기 |

> 이벤트는 `@TransactionalEventListener(phase = AFTER_COMMIT)`로 처리하며, 실패 시 재처리 대비로 새벽 보정 Scheduler가 `computed_at` 노후 건을 재계산합니다.

### 4.3 API 규약

| 항목 | 규약 |
|------|------|
| 페이지네이션 | cursor 기반 `?cursor=xxx&limit=20` |
| 오류 형식 | `{ "code": "WORKOUT_NOT_FOUND", "message": "...", "details": {...} }` |
| 멱등성 | `X-Client-Id` 헤더 또는 `body.clientId` (UUID) |
| 인증 | `Authorization: Bearer {accessToken}` |
| 소유권 | 모든 리소스 조회/변경 시 user_id 검사 |
| 버전 충돌 | ETag / If-Match |
| 추적 | `X-Correlation-Id` (없으면 서버 생성, 로그 MDC 주입) |
| Rate Limit | AI 사용자당 10회/일 |
| API 버전 | URI 기반 `/api/v1/`, 중단 시 6개월 병행 + Sunset 헤더 |

---

## 5. 보안 설계

### 5.1 인증·인가 흐름

```
[Google PKCE]
Flutter                          Server                    Google
  │ ① verifier 생성                │                          │
  │ ② challenge=SHA256(verifier)   │                          │
  │───────── 인증 요청 (challenge) ─────────────────────────▶ │
  │◀──────── Authorization Code ────────────────────────────  │
  │ ③ {code, verifier, deviceInfo} │                          │
  │───────────────────────────────▶│ ④ code+verifier 교환 ───▶│
  │                                │◀──────── ID Token ───────│
  │                                │ ⑤ iss/aud/exp/email_verified 검증
  │                                │ ⑥ sub로 계정 조회·생성
  │◀── Access(15m) + Refresh ──────│
```

### 5.2 토큰 정책

| 토큰 | 수명 | 저장 위치 | 폐기 조건 |
|------|------|-----------|-----------|
| Access Token | 15분 | 앱 메모리 (영속 저장 금지) | 만료 |
| Refresh Token | 장기 | flutter_secure_storage / 서버는 `token_hash`만 | 회전 시 즉시, 재사용 감지 시 family 전체, 세션 상한 초과 시 |

### 5.3 보안 통제 요약

| 위협 | 통제 |
|------|------|
| Refresh Token 탈취 | Rotational + family 전체 폐기 (재사용 감지) |
| 기기 분실 | 기기 목록에서 개별 세션 폐기 + 5대 상한 |
| 토큰 평문 노출 | Keystore/Keychain 강제, SharedPreferences 금지 |
| 타 사용자 리소스 접근 | 모든 조회에 user_id 조건 결합 (IDOR 방지) |
| 개인정보 LLM 유출 | 이름·이메일 미전송, 비식별 요약만 |
| 비밀 값 유출 | 환경 변수 주입, `.env`는 커밋 제외 |
| 중복/재전송 공격 | clientId 멱등성 + UNIQUE 제약 |

---

## 6. 확장성·가용성 설계

### 6.1 확장성

| 계층 | 현재(MVP) | 확장 경로 |
|------|-----------|-----------|
| API | 단일 컨테이너 | stateless이므로 N개 복제 + Nginx upstream |
| 세션 | Redis 단일 | Redis Sentinel/Cluster |
| DB | MySQL 단일 | Read Replica 분리(분석 조회) → 샤딩은 불필요 예상 |
| 파일 | MinIO 단일 | MinIO 분산 모드 또는 S3 전환 |
| AI | 동기 폴백 | 큐(예: Redis Stream) 기반 워커 분리 |

### 6.2 가용성

| 항목 | 설계 |
|------|------|
| Health Endpoint | readiness(db, redis) / liveness(ping) 분리 |
| Docker healthcheck | 10s 간격, 5회 재시도, start_period 30s |
| AI 장애 | Circuit Breaker + 3단 폴백 → 기능 중단 없음 |
| DB 장애 | readiness 실패 → 트래픽 차단, 앱은 오프라인 모드 유지 |
| 네트워크 장애 | Operation Queue로 사용자 작업 무손실 |

### 6.3 성능 설계

| 기법 | 적용 |
|------|------|
| 사전 계산 | 파생값(볼륨·칼로리) 이벤트 계산 → 조회 시 집계 없음 |
| 일별 집계 테이블 | `daily_health_summaries` → 대시보드 단일 조회 |
| 복합 인덱스 | 조회 패턴 기반 (ERD 문서 4장) |
| 배치 처리 | 건강 동기화 500건 / Op 배치 전송 |
| 커넥션 풀 | HikariCP min-idle 2, max 10 |
| Cold Start | Flyway baseline-on-migrate(dev), defer-datasource-initialization=false |

---

## 7. 배포 아키텍처

```
[MVP]
  단일 호스트 (Docker Compose)
  api / mysql / redis / minio / prometheus / grafana

[프로덕션 확장 - Blue-Green]
  Nginx (upstream 전환)
     ├── Blue  : api:8080
     └── Green : api:8080 (신규)
  공유: MySQL / Redis / MinIO

전환 순서:
 ① Green 기동 + Flyway 마이그레이션
 ② Green /actuator/health/readiness 확인
 ③ Nginx upstream Green 전환
 ④ Blue 드레인 (진행 중 요청 완료 대기)
 ⑤ Blue 종료
```

**Blue-Green 전제 조건**

- Flyway: backward-compatible DDL만 (컬럼 추가는 nullable/default, 삭제는 2-phase)
- API: 새 필드 추가만, 기존 필드 즉시 삭제 금지
- 세션: Redis 기반 (서버 stateless)
- 파일: MinIO (서버 로컬 파일 없음)
- 설정: 환경 변수 기반 프로필 분리

---

## 8. 아키텍처 결정 기록 (ADR)

### 8.1 ADR 템플릿

```markdown
# ADR-{번호}: {제목}
## 상태: 제안됨 / 수락됨 / 대체됨
## 컨텍스트: 어떤 문제/결정이 필요한가
## 결정: 무엇을 선택했는가
## 대안: 검토한 다른 옵션들
## 결과: 이 결정의 장단점
## 날짜: YYYY-MM-DD
```

### 8.2 ADR 목록 및 요약

| ADR | 제목 | 결정 | 핵심 근거 |
|-----|------|------|-----------|
| ADR-001 | Health Connect vs Google Fit vs 직접 센서 | **Health Connect** | Android 생태계 표준 전환, Change Token으로 증분 동기화 지원 |
| ADR-002 | Operation Queue vs 단순 임시저장 | **Operation Queue** | 의존성·순서·멱등성이 필요한 다단계 기록에는 임시저장으로 부족 |
| ADR-003 | AI Fallback 전략 | **Claude → OpenAI → 템플릿** | 단일 벤더 장애 시에도 기능 가용성 100% 유지 |
| ADR-004 | Rotational Refresh vs Sliding Session | **Rotational Refresh + family** | 토큰 도난 탐지 가능, 모바일 장기 세션에 적합 |
| ADR-005 | 파생값 이벤트 계산 vs 조회 시 계산 | **이벤트 계산 + 새벽 보정** | 조회 SLA(P95<300ms) 충족, 정합성은 보정 배치로 보완 |
| ADR-006 | 모듈러 모놀리스 vs MSA | **모듈러 모놀리스** | 2인 팀 규모에서 MSA 운영 비용 과다, 모듈 경계는 유지해 향후 분리 가능 |

**ADR-003 상세 예시**

```markdown
# ADR-003: AI Fallback 전략 (Claude → OpenAI → 템플릿)
## 상태: 수락됨
## 컨텍스트
AI 루틴 추천은 핵심 차별화 기능이나 외부 API에 전적으로 의존한다.
벤더 장애·레이트리밋·타임아웃 시 기능이 완전히 중단되면 사용자 신뢰를 잃는다.
## 결정
3단 폴백 체인을 구성한다.
① Claude API (primary)
② 실패 시 OpenAI API (fallback) — Resilience4j Circuit Breaker OPEN 또는 타임아웃/5xx
③ 모두 실패 시 경험 수준·목표에 매칭되는 사전 정의 템플릿 루틴 반환
실제 사용 provider는 ai_model_runs.provider에 기록하고, 폴백 발생 시 Grafana 알림.
## 대안
- 단일 벤더 + 재시도만: 장애 시 가용성 0
- 자체 모델 호스팅: 2인 팀 운영 비용·품질 리스크 과다
- 캐시된 과거 루틴 재사용: 개인화 정확도 저하, 신규 사용자 대응 불가
## 결과
(+) AI 장애 시에도 사용자에게 항상 루틴 제공 (가용성 100%)
(+) provider별 품질·비용 비교 데이터 축적
(−) 프롬프트를 2개 벤더 형식으로 유지해야 함
(−) 템플릿 루틴은 개인화 수준이 낮음 → 안내 문구로 기대치 관리
## 날짜: 2026-08-13
```

---

## 9. 검토 및 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자(테크리드) | | | |
| 검토자(모바일) | | | |
| 승인자(PO) | | | |
