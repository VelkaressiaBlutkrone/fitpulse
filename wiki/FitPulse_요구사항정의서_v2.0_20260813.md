# 📑 FitPulse 요구사항 정의서

| 항목 | 내용 |
|------|------|
| 문서 유형 | 요구사항 정의서 (Requirements Definition) |
| 버전 | v2.0 |
| 작성일 | 2026-08-13 |
| 기준 | FitPulse 계획서 v5.0 |

**변경 이력**

| 버전 | 일자 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-08-13 | 최초 작성 (MVP 범위 확정) |
| v2.0 | 2026-08-13 | CR-013 커뮤니티 요구사항 복원(FR-308~314), CR-014 관리자 요구사항 신설(FR-901~948), NFR 보강(NFR-109~114, NFR-406, NFR-507~509) |

**우선순위 표기**: `M`=Must Have, `S`=Should Have, `N`=Nice to Have

---

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 인증 (FR-0xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-001 | 이메일 회원가입 | 이메일 중복 불가, 비밀번호 8자 이상 + 영문/숫자/특수문자 중 2종 이상, BCrypt 해시 저장 | M |
| FR-002 | 이메일 로그인 | 성공 시 Access Token(15분) + Refresh Token 발급 | M |
| FR-003 | Google 소셜 로그인 (PKCE) | code_verifier 43~128자, code_challenge=BASE64URL(SHA256(verifier)) | M |
| FR-004 | ID Token 검증 | `iss=accounts.google.com`, `aud`=자사 client_id, `exp>now`, `email_verified=true` 모두 충족 시에만 로그인 | M |
| FR-005 | Rotational Refresh Token | 갱신 시 기존 토큰 즉시 폐기, 동일 family_id 유지 | M |
| FR-006 | 토큰 재사용 감지 | 이미 사용된 Refresh Token 재제출 시 동일 family 전체 폐기 | M |
| FR-007 | 기기 세션 관리 | user_id당 refresh_sessions 최대 5개, 6번째 로그인 시 가장 오래된 세션 자동 폐기 | M |
| FR-008 | 기기 목록 조회·개별 폐기 | "내 기기 관리" 화면에서 세션 확인 및 개별 로그아웃 | M |
| FR-009 | 로그아웃 | 현재 기기 refresh_session 폐기 | M |
| FR-010 | 토큰 보안 저장 | Refresh Token은 flutter_secure_storage(Keystore/Keychain), Access Token은 메모리 유지. SharedPreferences 저장 금지 | M |

### 1.2 사용자·동의 (FR-1xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-101 | 프로필 조회·수정 | 닉네임, 아바타, 성별, 출생연도, 키 | M |
| FR-102 | 운동 목표 설정 | goal_type, 목표 체중, 주간 운동 일수, 경험 수준, 보유 장비, 부상 메모 | M |
| FR-103 | 동의 5종 분리 관리 | TERMS(필수), PRIVACY(필수), HEALTH_DATA(선택), AI_PROCESSING(선택), MARKETING(선택) | M |
| FR-104 | 동의 철회 | 철회 시 `revoked_at` 기록 + 해당 기능 즉시 비활성화 | M |
| FR-105 | 계정 삭제 (30일 유예) | 요청 시 `withdrawal_at` 기록, 30일 후 완전 삭제, 유예 중 재로그인 시 복구 | M |
| FR-106 | 데이터 내보내기 | 사용자 데이터 JSON 형식 다운로드 (PIPA 대응) | M |

### 1.3 운동 라이브러리 (FR-2xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-201 | 운동 목록 조회 | cursor 페이지네이션 (limit 기본 20) | M |
| FR-202 | 운동 검색 | 이름(한/영) 부분 일치, 부위·장비·난이도 필터 | M |
| FR-203 | 카테고리 조회 | order_num 기준 정렬 | M |
| FR-204 | 운동 상세 조회 | 주동근/협응근, 설명, 이미지, 영상 | M |
| FR-205 | 커스텀 운동 등록 | `is_custom=true`, `created_by`=본인, 본인에게만 노출 | M |
| FR-206 | 초기 데이터 시딩 | 100종 이상 기본 운동 시딩 (ExerciseDataSeeder) | M |

### 1.4 루틴 (FR-3xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-301 | 루틴 생성 | type: SYSTEM / USER / AI_GENERATED | M |
| FR-302 | 루틴 버전 관리 | 수정 시 새 `routine_versions` 생성, 이전 버전 보존, `current_version` 갱신 | M |
| FR-303 | 루틴 일자 구성 | routine_days (sequence_no, 휴식일 지정 가능) | M |
| FR-304 | 루틴 운동 구성 | 목표 세트/반복 범위("8-12")/휴식 시간/메모 | M |
| FR-305 | 주간 스케줄 배정 | day_of_week 1~7, 시작·종료일 | M |
| FR-306 | 루틴 복사 | 공개 루틴을 내 루틴으로 복사 | S |
| FR-307 | 루틴으로 세션 시작 | 선택 루틴 버전을 세션에 스냅샷 | M |

### 1.4-1 루틴 공유·커뮤니티 (FR-30x) ★ CR-013 복원

> 원 계획서 11장 "루틴: CRUD routines, POST start, GET public, POST like/copy" 및 기술 스택 "Redis: Refresh Token·캐시·랭킹" 항목을 근거로 복원한 요구사항입니다. v1.0에서 누락되었습니다.

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-308 | 루틴 공개 전환 | 소유자가 루틴을 공개/비공개로 전환. 공개 시 `is_public=true`, `published_at` 기록. 공개는 심사 대기(PENDING) 후 노출 | M |
| FR-309 | 공개 루틴 목록 | `GET /routines/public` — 인기순/최신순/목표별/난이도별 정렬·필터, cursor 페이지네이션 | M |
| FR-310 | 루틴 좋아요 | `POST /routines/{id}/like` 토글. 사용자당 루틴 1회, 중복 요청 멱등 | M |
| FR-311 | 좋아요 수 집계 | `like_count` 비정규화 컬럼 + Redis 카운터, 이벤트로 동기화 | M |
| FR-312 | 루틴 인기 랭킹 | Redis Sorted Set 기반 주간/전체 랭킹. 점수 = 좋아요×3 + 복사×5 + 조회×1, 매시 정각 스냅샷 저장 | S |
| FR-313 | 어뷰징 방지 | 동일 IP·기기에서 단시간 반복 좋아요 차단, 자기 루틴 좋아요 불가, 이상 패턴은 관리자 검토 큐로 전달 | M |
| FR-314 | 루틴 신고 | 사용자가 공개 루틴을 신고(부적절/위험/스팸/저작권). 신고 누적 5건 시 자동 블라인드 후 관리자 심사 | M |

### 1.4-2 신고·제재 (사용자 측) (FR-31x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-315 | 신고 접수 | 대상(루틴/커스텀 운동/사용자), 사유 코드, 상세 설명 | M |
| FR-316 | 신고 결과 통지 | 처리 완료 시 신고자에게 결과 통지(수용/기각) | S |
| FR-317 | 제재 통지·이의제기 | 제재 시 사유·기간을 통지하고 1회 이의제기 가능 | S |

### 1.5 운동 기록 (FR-4xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-401 | 세션 시작 | clientId(UUID) 필수, `UNIQUE(user_id, client_id)` 멱등 | M |
| FR-402 | 세션 종목 추가 | order_num 순서 유지 | M |
| FR-403 | 세트 기록 | weight_kg≥0, reps≥0, duration_sec≥0, rpe 1~10, set_type(NORMAL/WARMUP/DROP/FAILURE) | M |
| FR-404 | 세트 수정·삭제 | 수정 시 SetModified 이벤트 발행 | M |
| FR-405 | 세션 완료 | WorkoutCompleted 이벤트 → computed_duration_min / total_volume / total_calories 계산 | M |
| FR-406 | 파생값 재계산 | 세트 변경 시 재계산, 매일 새벽 보정 Scheduler로 `computed_at` 노후 건 재계산 | M |
| FR-407 | 휴식 타이머 | 세트별 rest_seconds 카운트다운, 백그라운드에서도 동작 | M |
| FR-408 | 세션 이력 조회 | cursor 페이지네이션, 상태/기간 필터 | M |
| FR-409 | 진행 중 세션 복구 | 앱 재실행 시 IN_PROGRESS 세션 자동 복구 | M |
| FR-410 | 세션 메모·기분·사진 | mood(GREAT~BAD), photo_url(MinIO) | S |

### 1.6 오프라인 동기화 (FR-5xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-501 | Operation Queue 영속화 | drift `pending_operations`에 op_type/endpoint/method/payload/depends_on 저장 | M |
| FR-502 | 낙관적 UI 갱신 | 큐 적재와 동시에 UI 즉시 반영(Optimistic Update) | M |
| FR-503 | 의존성 체인 처리 | depends_on 선행 Op 성공 후에만 전송 | M |
| FR-504 | Server ID 매핑 | payload의 `$ref:client_id`를 서버 응답 ID로 치환 후 전송 | M |
| FR-505 | 배치 전송 | 동일 세션 Op를 `/workout-sessions/batch` 1회 요청으로 묶어 전송 | M |
| FR-506 | 상태 머신 | PENDING → SYNCING → SYNCED / CONFLICT / FAILED 전이 | M |
| FR-507 | 재시도 정책 | 네트워크 오류 지수 백오프(1→2→4→8s, 최대 5회), 4xx 즉시 FAILED, 5xx 3회 후 FAILED | M |
| FR-508 | 충돌 해결 | Conflict Matrix 8종에 따라 자동 처리 또는 사용자 선택 UI 노출 | M |
| FR-509 | 큐 상한 관리 | 최대 1000건, 초과 시 오래된 SYNCED 삭제. PENDING 500건 초과 시 경고 배너 | M |
| FR-510 | 로컬 DB 용량 관리 | drift 파일 50MB 초과 시 SYNCED 건 정리 | S |
| FR-511 | 자동 동기화 트리거 | 온라인 복구(connectivity 스트림) 감지 시 큐 자동 처리 | M |

### 1.7 분석 (FR-6xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-601 | 1RM 추이 | 운동별 추정 1RM 시계열 (Epley 공식, reps≤12 구간만 유효) | M |
| FR-602 | 볼륨 추이 | 기간별 총 볼륨 Σ(weight×reps) | M |
| FR-603 | 부위별 빈도 | primary_muscle 기준 집계 | M |
| FR-604 | 캘린더(잔디) | 일자별 운동 여부·강도 히트맵 | M |
| FR-605 | 스트릭 | 연속 운동일/주 계산, 현재·최장 스트릭 | M |

### 1.8 건강 데이터 (FR-7xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-701 | 권한 요청 UX | 사용 목적 3종 설명 + "나중에 하기" 옵션 + 해제 방법 안내 | M |
| FR-702 | 권한 거부 처리 | 동기화 비활성 + "수동 입력으로 기록 가능" 안내 | M |
| FR-703 | Change Token 동기화 | `getChangesToken` → `getChanges(token)` → upserted/deleted/nextToken 처리 | M |
| FR-704 | 동기화 트리거 4종 | 포그라운드 진입 / BG Observer(Android 14+) / 수동 새로고침 / 토큰 만료 | M |
| FR-705 | 토큰 만료 처리 | TOKEN_EXPIRED 감지 → 90일 fullResync + 새 토큰 발급 + 서버에 `fullResync=true` 전달 | M |
| FR-706 | 자사 데이터 제외 | sourceApp이 FitPulse인 레코드는 동기화 대상에서 제외(루프 방지) | M |
| FR-707 | 페이징 처리 | `hasMore=true`인 동안 500건 단위 반복 조회 | M |
| FR-708 | 서버 동기화 API | 500건 단위 배치, 트랜잭션 = 배치 단위, 부분 실패 시 성공분 커밋 + 실패 목록 응답 | M |
| FR-709 | 중복 방지 | `UNIQUE(user_id, source_platform, source_record_id)` 기준 upsert | M |
| FR-710 | 삭제 반영 | deletedRecordIds → `deleted_at` soft delete | M |
| FR-711 | 데이터 타입 7종 | STEPS, HEART_RATE, SLEEP, ACTIVE_CALORIES, WEIGHT, BODY_FAT, DISTANCE | M |
| FR-712 | 일별 집계 | HealthDataSynced 이벤트 → `daily_health_summaries` 갱신 | M |
| FR-713 | 건강 대시보드 | 걸음수/심박/수면/칼로리 요약 및 추이 | M |
| FR-714 | 체성분 수동 입력 | 체중·체지방률·근육량·BMI, source=MANUAL | M |
| FR-715 | 연동 해제 | HEALTH_DATA 동의 철회 시 동기화 중단 + 기존 데이터 삭제 여부 사용자 선택 | M |
| FR-716 | 미지원 기기 폴백 | Android 13 이하는 포그라운드 진입 시에만 동기화 | M |

### 1.9 AI 루틴 추천 (FR-8xx)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-801 | 비동기 Job 생성 | `POST /ai/routine-jobs` → 202 Accepted + jobId | M |
| FR-802 | Job 상태 폴링 | `GET /ai/routine-jobs/{id}` → status, result | M |
| FR-803 | 입력 비식별화 | 이름·이메일 미전송, 신체·이력 요약만 전송 | M |
| FR-804 | 규칙 기반 범위 계산 | 경험 수준별 주간 볼륨 상한, 금기 운동 목록 산출 | M |
| FR-805 | Fallback 체인 | ① Claude → ② OpenAI → ③ 사전 정의 템플릿 루틴, 실제 provider를 `ai_model_runs.provider`에 기록 | M |
| FR-806 | Circuit Breaker | Resilience4j로 AI 호출 차단·복구 | M |
| FR-807 | JSON Schema 검증 | 필수 필드 존재, 세트·반복 1~20 범위 | M |
| FR-808 | 3단계 exercise 매핑 | ① 정확 매칭(name_en) → ② Fuzzy(유사도>0.8) → ③ 제거. 실패율>30% 시 폐기 후 1회 재생성 | M |
| FR-809 | 매핑 학습 | `ai_exercise_mappings`에 매핑 결과 축적 후 재사용 | S |
| FR-810 | 안전성 검증 | injury_notes 금기 교차 검사, 초보자 고급 운동 배제, 볼륨 상한 검사 → safety_flags 기록 | M |
| FR-811 | 사용자 확인·수정 | 제안 루틴 수정 후 accept 또는 reject | M |
| FR-812 | 수정 내역 추적 | `ai_routine_modifications`에 EXERCISE_REPLACED/SET_CHANGED/REMOVED/ADDED 기록 | S |
| FR-813 | 프롬프트 버전 관리 | 새 version INSERT → 테스트 → is_active 전환, 롤백 가능(배포 불필요) | M |
| FR-814 | 비용 추적 | run별 estimated_cost_usd 합산 → `ai_jobs.total_estimated_cost_usd`, 일 $10 초과 시 알림 | M |
| FR-815 | Rate Limit | 사용자당 AI 요청 10회/일 | M |
| FR-816 | 안전 표현 규칙 | 진단성 표현 금지("정상" 등), 모든 AI 텍스트에 "참고용 피트니스 인사이트" 고지 | M |

---


### 1.10 관리자 — 계정·권한 (FR-90x) ★ CR-014 신설

> 원 계획서 후속 백로그의 "React 관리자"와 ERD `users.role = USER/ADMIN`을 근거로, 관리자 영역을 정식 요구사항으로 확대 정의합니다. **관리자 백엔드(권한·감사·운영 API)는 MVP 범위**, **React 관리자 웹 UI는 원 계획대로 V1.1**입니다.

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-901 | 관리자 계정 분리 | 일반 사용자와 별도 `admins` 테이블로 관리. 일반 회원 계정으로 관리자 로그인 불가 | M |
| FR-902 | 관리자 초대 가입 | SUPER_ADMIN이 이메일 초대 → 초대 토큰(72시간 유효)으로 비밀번호 설정 후 활성화. 자가 가입 불가 | M |
| FR-903 | 역할 기반 접근 제어(RBAC) | SUPER_ADMIN / ADMIN / OPERATOR / SUPPORT / VIEWER 5종 역할, 권한(permission) 단위 부여 | M |
| FR-904 | 권한 매트릭스 강제 | 모든 관리자 API는 필요한 permission 코드를 선언하고 미보유 시 403 | M |
| FR-905 | 2단계 인증(TOTP) | 관리자 로그인 시 TOTP 필수. 최초 로그인 시 QR 등록, 백업 코드 10개 발급 | M |
| FR-906 | IP 허용 목록 | 선택적으로 관리자 계정별 허용 CIDR 지정, 미허용 IP 접근 차단 | S |
| FR-907 | 관리자 세션 정책 | Access 30분 / Idle 30분 자동 만료 / 절대 만료 8시간, 동시 세션 2개 제한 | M |
| FR-908 | 관리자 계정 잠금 | 로그인 5회 실패 시 30분 잠금, SUPER_ADMIN이 즉시 해제 가능 | M |
| FR-909 | 관리자 계정 비활성화 | 퇴사·역할 종료 시 즉시 비활성화 + 전 세션 폐기 (삭제가 아닌 비활성) | M |
| FR-910 | 비밀번호 정책 | 12자 이상, 90일 주기 변경 권고, 최근 3개 재사용 금지 | S |

### 1.11 관리자 — 감사 로그 (FR-91x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-911 | 전 행위 감사 기록 | 모든 관리자 쓰기 작업을 `admin_audit_logs`에 기록 (누가·언제·무엇을·이전값·이후값·IP·UA) | M |
| FR-912 | 감사 로그 불변성 | 수정·삭제 API 미제공. DB 사용자 권한도 INSERT/SELECT만 부여 | M |
| FR-913 | 감사 로그 조회 | 관리자별·대상별·기간별 검색, CSV 내보내기 | M |
| FR-914 | 민감 조회 기록 | 회원 개인정보 상세 조회·데이터 내보내기 등 **읽기 행위도** 감사 대상 | M |
| FR-915 | 감사 로그 보관 | 3년 보관 (개인정보 처리 이력 요구) | M |
| FR-916 | 이상 행위 알림 | 단시간 대량 조회, 심야 접속, 권한 변경 발생 시 Slack 알림 | S |

### 1.12 관리자 — 회원 관리 (FR-92x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-921 | 회원 검색 | 이메일·닉네임·ID·가입일·상태·가입경로 조건 검색 | M |
| FR-922 | 회원 상세 조회 | 프로필, 목표, 가입일, 최근 접속, 기기 목록, 동의 이력, 운동 통계 요약 | M |
| FR-923 | 개인정보 마스킹 | 목록에서는 이메일·이름 마스킹(`ab***@ex***.com`), 상세 조회 시 사유 입력 후 해제 | M |
| FR-924 | 회원 상태 변경 | 정상 / 이용정지(기간 지정) / 영구정지. 사유 필수, 사용자에게 통지 | M |
| FR-925 | 강제 로그아웃 | 특정 회원의 전체 세션 또는 특정 기기 세션 폐기 | M |
| FR-926 | 탈퇴 처리 지원 | 유예 중 계정 조회, 고객 요청 시 즉시 삭제 처리(SUPER_ADMIN 권한) | M |
| FR-927 | 데이터 내보내기 대행 | 본인 확인된 요청에 한해 회원 데이터 JSON 생성 (감사 기록 필수) | S |
| FR-928 | 회원 활동 이력 | 최근 세션·동기화·AI 요청 이력 조회 (지원 업무용) | S |
| FR-929 | 회원 데이터 직접 수정 금지 | 관리자는 회원의 운동 기록·건강 데이터를 **수정할 수 없음** (조회만 가능) | M |

### 1.13 관리자 — 콘텐츠 관리 (FR-93x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-931 | 운동 라이브러리 CRUD | 기본 운동 등록·수정·보관(ARCHIVED). 물리 삭제 금지(기록 참조 무결성) | M |
| FR-932 | 카테고리 관리 | 카테고리 추가·수정·정렬 순서 변경 | M |
| FR-933 | 운동 일괄 등록 | CSV 업로드 → 검증 리포트(성공/실패 행) → 확정 반영 | S |
| FR-934 | 커스텀 운동 심사 | 사용자 커스텀 운동을 공용 승격 요청 시 승인/반려(사유 필수) | S |
| FR-935 | 운동 이미지·영상 관리 | MinIO 업로드, 용량·형식 검증(이미지 5MB, 영상 50MB) | S |
| FR-936 | 시스템 루틴 관리 | `type=SYSTEM` 루틴 생성·수정·공개. AI 폴백 템플릿 루틴의 원본 | M |
| FR-937 | 공개 루틴 심사 | 사용자 공개 요청 루틴 승인/반려, 블라인드 처리 | M |
| FR-938 | 공지사항 관리 | 작성·예약 게시·게시 중단, 대상(전체/특정 플랫폼/특정 버전) 지정 | M |
| FR-939 | 점검 모드 | 점검 배너 노출 및 쓰기 API 차단 모드 토글 (사유·예상 종료 시각 표시) | M |

### 1.14 관리자 — 신고·제재 (FR-94x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-941 | 신고 큐 | 미처리 신고 목록, 유형·누적 건수·긴급도 정렬 | M |
| FR-942 | 신고 처리 | 수용/기각 판정 + 처리 메모, 동일 대상 중복 신고 병합 | M |
| FR-943 | 제재 집행 | 콘텐츠 블라인드 / 공개 권한 정지 / 계정 이용정지 / 영구정지, 기간 지정 | M |
| FR-944 | 제재 이력 | 회원별 누적 제재 이력 조회, 반복 위반 자동 가중 제안 | S |
| FR-945 | 이의제기 처리 | 사용자 이의제기 접수 → 재심 → 유지/해제 | S |

### 1.15 관리자 — AI 운영 (FR-95x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-951 | 프롬프트 템플릿 관리 | 신규 버전 작성, 활성화, **배포 없이 이전 버전 롤백** | M |
| FR-952 | 프롬프트 시험 실행 | 활성화 전 샘플 입력으로 dry-run 후 결과·검증 통과 여부 확인 | S |
| FR-953 | AI Job 모니터링 | 상태별 건수, 실패 사유 분포, provider별 비율, 평균 지연 | M |
| FR-954 | 운동 매핑 검수 | `ai_exercise_mappings` 미검증 항목 검토 → `verified=true` 승인 또는 수정·삭제 | M |
| FR-955 | AI 비용 관리 | 일/월 비용 추이, 사용자별 상위 사용량, 임계치 설정 | M |
| FR-956 | Rate Limit 조정 | 전역/개별 사용자 AI 일일 한도를 재배포 없이 변경 | S |
| FR-957 | AI 긴급 차단 | AI 기능 전면 비활성화 스위치(장애·비용 폭증 시), 활성 시 템플릿 루틴만 제공 | M |
| FR-958 | 수정 패턴 분석 | `ai_routine_modifications` 집계로 자주 교체되는 운동 순위 제공 | S |

### 1.16 관리자 — 통계·운영 도구 (FR-96x)

| ID | 요구사항 | 상세 | 우선순위 |
|----|----------|------|----------|
| FR-961 | 운영 대시보드 | DAU/MAU, 신규 가입, 세션 완료 수, 리텐션(D1/D7/D30) | M |
| FR-962 | 기능 지표 | 건강 동기화 성공률, 오프라인 큐 적체, AI 성공률·비용 | M |
| FR-963 | 통계 내보내기 | 조회 결과 CSV 다운로드 (개인식별정보 제외) | S |
| FR-964 | 배치 수동 실행 | 파생값 보정·건강 집계·계정 삭제 배치를 수동 트리거 | S |
| FR-965 | 캐시 무효화 | 운동 라이브러리·랭킹 캐시 수동 갱신 | S |
| FR-966 | 시스템 설정 관리 | `system_settings` 키-값 런타임 설정 변경(점검 모드, 한도, 기능 플래그) | M |
| FR-967 | 위험 작업 2인 승인 | 영구정지·즉시 삭제·전체 세션 폐기 등은 요청 후 다른 관리자 승인 필요 | S |
| FR-968 | 관리자 웹 UI (V1.1) | React 19 + TypeScript 5 + shadcn/ui + Tailwind + Recharts 기반 콘솔 | (V1.1) |

---

## 2. 비기능 요구사항 (Non-Functional Requirements)

### 2.1 성능 (NFR-0xx)

| ID | 요구사항 | 목표치 | 측정 |
|----|----------|--------|------|
| NFR-001 | 세트 기록 API 응답 | P95 < 200ms (동시 50) | 부하 테스트 / Prometheus |
| NFR-002 | 세션 목록 조회 | P95 < 300ms (동시 100) | 동일 |
| NFR-003 | 건강 동기화(500건) | P95 < 3초 (동시 20) | 동일 |
| NFR-004 | 건강 대시보드 | P95 < 500ms (동시 100) | 동일 |
| NFR-005 | AI 루틴 요청 접수 | P95 < 500ms (동시 10) | 동일 |
| NFR-006 | AI 루틴 생성 완료 | < 30초 | Job latency |
| NFR-007 | 분석(1RM·볼륨) | P95 < 500ms (동시 50) | 동일 |
| NFR-008 | 운동 검색 | P95 < 300ms (동시 100) | 동일 |
| NFR-009 | 서버 Cold Start | < 30초 내 readiness 통과 | Docker start_period |
| NFR-010 | 앱 세트 입력 반응 | 낙관적 갱신으로 체감 지연 0 (네트워크 무관) | 실기기 |
| NFR-011 | 공개 루틴 목록·랭킹 조회 | P95 < 400ms (동시 100) | 부하 테스트 |
| NFR-012 | 관리자 회원 검색 | P95 < 1초 (100만 행 기준) | 부하 테스트 |
| NFR-013 | 관리자 감사 로그 검색 | P95 < 2초 (1천만 행, 기간 필터 필수) | 부하 테스트 |

### 2.2 보안 (NFR-1xx)

| ID | 요구사항 |
|----|----------|
| NFR-101 | 전 API는 Bearer Access Token 인증 (인증/공개 엔드포인트 제외) |
| NFR-102 | 모든 리소스 접근 시 소유권(user_id) 검사 필수 |
| NFR-103 | Refresh Token은 해시(token_hash)로만 저장, 평문 미저장 |
| NFR-104 | 클라이언트 토큰은 OS 보안 저장소(Keystore/Keychain) 사용 |
| NFR-105 | 비밀번호는 BCrypt(cost≥10) 해시 저장 |
| NFR-106 | 비밀 값(DB 비밀번호, API Key)은 환경 변수로 주입, 저장소 커밋 금지 |
| NFR-107 | AI 전송 데이터에서 개인식별정보 제거, 프롬프트 원문 미저장(비식별 요약+해시) |
| NFR-108 | 전송 구간 HTTPS 강제 (운영) |
| NFR-109 | 관리자 API는 `/api/v1/admin/**` 별도 경로 + 별도 인증 체계, 일반 사용자 토큰으로 접근 불가 |
| NFR-110 | 관리자 콘솔은 내부망 또는 IP 허용 목록에서만 접근 (운영 환경) |
| NFR-111 | 관리자 2FA(TOTP) 필수, 미등록 시 기능 API 접근 차단 |
| NFR-112 | 관리자 쓰기·민감 조회 100% 감사 로그 기록, 로그 무결성 보장(수정·삭제 불가) |
| NFR-113 | 회원 개인정보는 목록 기본 마스킹, 해제 시 사유 입력 및 기록 |
| NFR-114 | 관리자는 회원 운동·건강 데이터를 수정할 수 없음 (조회 전용) |

### 2.3 가용성·신뢰성 (NFR-2xx)

| ID | 요구사항 |
|----|----------|
| NFR-201 | AI 외부 서비스 장애 시에도 루틴 추천 기능은 템플릿으로 100% 응답 |
| NFR-202 | 오프라인 상태에서 운동 기록의 모든 조작 가능, 유실 0건 |
| NFR-203 | 동일 요청 재전송 시 중복 저장 0건 (멱등성) |
| NFR-204 | Actuator readiness(db, redis) / liveness(ping) 제공 |
| NFR-205 | 컨테이너 healthcheck 실패 시 자동 재시작 |

### 2.4 확장성·유지보수성 (NFR-3xx)

| ID | 요구사항 |
|----|----------|
| NFR-301 | 모듈러 모놀리스 구조(8개 모듈), 모듈 간 직접 참조 대신 이벤트/인터페이스 사용 |
| NFR-302 | 서버 stateless (세션은 Redis, 파일은 MinIO) → 수평 확장 가능 |
| NFR-303 | Flyway backward-compatible DDL만 사용 (Blue-Green 대비) |
| NFR-304 | API 버전은 URI 기반 `/api/v1/`, 중단 시 6개월 병행 + Sunset 헤더 |
| NFR-305 | 프롬프트는 DB 기반 버전 관리로 배포 없이 변경·롤백 |

### 2.5 사용성 (NFR-4xx)

| ID | 요구사항 |
|----|----------|
| NFR-401 | 모든 비동기 상태는 loading / data / error 3상태 UI 제공 (Error Boundary) |
| NFR-402 | 오류 메시지는 사용자 언어로 변환(`toUserMessage()`), 스택 노출 금지 |
| NFR-403 | 빈 상태(EmptyState)와 권한 거부 상태에 다음 행동 안내 포함 |
| NFR-404 | 운동 중 주요 조작(세트 완료)은 1탭 이내 |
| NFR-405 | 관리자 콘솔의 파괴적 작업(정지·삭제)은 확인 다이얼로그 + 사유 입력 필수 |
| NFR-406 | 관리자 목록 화면은 100건 기준 1초 이내 렌더 (서버 페이지네이션) |

### 2.6 규정 준수 (NFR-5xx)

| ID | 요구사항 |
|----|----------|
| NFR-501 | 개인정보 최소 수집 (혈압·혈당 등 미요청) |
| NFR-502 | 계정 삭제 30일 유예 후 완전 삭제 (Play/App Store 가이드) |
| NFR-503 | 데이터 내보내기 JSON 제공 (PIPA) |
| NFR-504 | 건강 데이터의 광고·중개 목적 사용 금지 |
| NFR-505 | 원본 건강 데이터(분 단위) 90일 보관 후 일별 집계로 대체, AI 기록 1년 |
| NFR-506 | 의료 진단 오인 방지 문구 상시 노출 |
| NFR-507 | 관리자 감사 로그 3년 보관 (개인정보 처리 이력) |
| NFR-508 | 관리자의 개인정보 취급은 최소 권한 원칙 준수, 역할별 접근 범위 문서화 |
| NFR-509 | 공개 루틴은 심사 통과 후 노출, 신고 누적 시 자동 블라인드 (플랫폼 책임 대응) |

### 2.7 테스트·품질 (NFR-6xx)

| ID | 요구사항 |
|----|----------|
| NFR-601 | Testcontainers(MySQL 8.4, Redis 7.4) 기반 통합 테스트 |
| NFR-602 | AI는 Mock LLM으로 검증 파이프라인 테스트 |
| NFR-603 | 주차별 인수 조건 100% 충족 후 다음 주차 진입 |

---

## 3. 제약 조건 및 가정 사항

### 3.1 제약 조건

| ID | 구분 | 내용 |
|----|------|------|
| C-01 | 기술 | 기술 스택 2026-08 시점 버전 고정 (Spring Boot 4.1.0 / Java 21 / Flutter 3.47) |
| C-02 | 기술 | Spring Boot 4 환경에서는 SpringDoc 3.x 필수 |
| C-03 | 플랫폼 | Health Connect Background Observer는 Android 14+ 에서만 동작 |
| C-04 | 플랫폼 | Change Token 유효기간 약 30일, HC 앱 데이터 삭제 시 무효화 |
| C-05 | 플랫폼 | iOS HealthKit은 MVP 제외 (V1.1) |
| C-06 | 자원 | 개발 인력 2명, 기간 14주 고정 |
| C-07 | 비용 | 일일 AI 비용 $10 상한 |
| C-08 | 인프라 | MVP는 단일 인스턴스 Docker Compose 배포 |

### 3.2 가정 사항

| ID | 가정 | 미충족 시 영향 |
|----|------|----------------|
| A-01 | 테스트용 Android 14+ 실기기를 W8 이전에 확보 | HC BG Observer 검증 불가 → 일정 지연 |
| A-02 | Google Cloud OAuth Client 발급 완료 (W2 이전) | 소셜 로그인 개발 블로킹 |
| A-03 | Claude / OpenAI API 키 발급 및 결제 수단 등록 | AI 개발 블로킹 |
| A-04 | 기본 운동 100종 데이터(이름/부위/장비)를 W3 이전 확보 | 시딩 지연 |
| A-05 | 사용자 대다수가 Android 사용자 | iOS 우선순위 재검토 필요 |

---

## 4. 요구사항 추적 매트릭스 (RTM)

| 요구사항 ID | 관련 테이블 | API 엔드포인트 | 구현 주차 | 테스트 케이스 |
|-------------|-------------|----------------|-----------|----------------|
| FR-001~002 | users | POST /auth/signup, /auth/login | W2 | TC-AUTH-001~003 |
| FR-003~004 | user_auth_accounts | POST /auth/social/google | W2 | TC-AUTH-004~006 |
| FR-005~006 | refresh_sessions | POST /auth/refresh | W2 | TC-AUTH-007~008 |
| FR-007~009 | refresh_sessions, user_devices | GET/DELETE /users/me/devices, POST /auth/logout | W2 | TC-AUTH-009~011 |
| FR-010 | - (클라이언트) | - | W2 | TC-AUTH-012 |
| FR-101~102 | user_profiles, fitness_goals | GET /users/me, PUT /users/me/goals | W2 | TC-USER-001~003 |
| FR-103~104 | user_consents | GET/PUT /users/me/consents | W2 | TC-USER-004~005 |
| FR-105~106 | users | DELETE /auth/account, GET /users/me/data-export | W2 | TC-USER-006~007 |
| FR-201~206 | exercises, exercise_categories | GET /exercises, /exercises/search, /exercise-categories, POST /exercises/custom | W3 | TC-EXER-001~006 |
| FR-301~307 | routines, routine_versions, routine_days, routine_exercises, routine_schedules | CRUD /routines, POST /routines/{id}/copy | W4 | TC-ROUT-001~007 |
| FR-401~410 | workout_sessions, workout_exercises, workout_sets | POST /workout-sessions 외 | W5 | TC-WKT-001~012 |
| FR-501~511 | pending_operations(local) | POST /workout-sessions/batch | W6 | TC-SYNC-001~012 |
| FR-601~605 | workout_sets(집계) | GET /analytics/* | W7 | TC-ANL-001~005 |
| FR-701~707, 716 | health_sync_cursors | - (클라이언트) | W8 | TC-HC-001~008 |
| FR-708~713 | health_observations, health_sync_jobs, daily_health_summaries | POST /health/sync, GET /health/dashboard | W9 | TC-HLT-001~008 |
| FR-714~715 | body_metrics, user_consents | POST /health/body-metrics | W12 | TC-HLT-009~010 |
| FR-801~810, 815~816 | ai_jobs, ai_model_runs, ai_exercise_mappings | POST/GET /ai/routine-jobs | W10 | TC-AI-001~012 |
| FR-811~814 | ai_routine_modifications, prompt_templates | POST /ai/routine-jobs/{id}/accept·reject | W12 | TC-AI-013~016 |
| FR-308~314 | routines(is_public), routine_likes, routine_stats, reports | GET /routines/public, POST /routines/{id}/like, GET /routines/ranking | A1 | TC-COMM-001~012 |
| FR-315~317 | reports, moderation_actions | POST /reports, GET /users/me/sanctions | A1 | TC-COMM-013~016 |
| FR-901~910 | admins, admin_roles, admin_permissions, admin_sessions, admin_mfa | POST /admin/auth/login, /admin/accounts | A2 | TC-ADM-001~014 |
| FR-911~916 | admin_audit_logs | GET /admin/audit-logs | A2 | TC-ADM-015~020 |
| FR-921~929 | users, refresh_sessions | GET/PATCH /admin/users | A3 | TC-ADM-021~030 |
| FR-931~939 | exercises, routines, announcements, system_settings | /admin/exercises, /admin/announcements | A3 | TC-ADM-031~040 |
| FR-941~945 | reports, moderation_actions | /admin/reports, /admin/sanctions | A3 | TC-ADM-041~047 |
| FR-951~958 | prompt_templates, ai_jobs, ai_exercise_mappings | /admin/ai/** | A4 | TC-ADM-048~056 |
| FR-961~967 | admin_audit_logs, system_settings | /admin/stats, /admin/ops | A4 | TC-ADM-057~063 |
| FR-968 | - | (React 콘솔, V1.1) | V1.1 | TC-ADM-064~070 |
| NFR-001~013 | - | 전체 | W13 / A4 | TC-PERF-001~013 |
| NFR-101~114 | - | 전체 | W13 / A2 | TC-SEC-001~015 |
| NFR-201~205 | - | 전체 | W13 | TC-REL-001~005 |

---

## 5. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자(PO) | | | |

> 본 문서 승인 이후의 요구사항 변경은 **변경 요청서(CR)** 절차를 통해서만 반영합니다.
