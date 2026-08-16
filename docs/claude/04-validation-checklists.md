# 검증 체크리스트

이 문서는 테스트 결과를 작성하거나 API, DB, UI, LLM, 인프라 변경을 검증하기 전에 읽는다.

## 1. 공통 검증 순서

적용 가능한 범위에서 다음 순서로 수행한다.

1. 변경 파일과 Diff 정적 확인
2. Format 또는 Lint
3. 영향 범위 Unit Test
4. 관련 Integration Test
5. 전체 Build
6. 필요 시 전체 Test
7. API 또는 UI 수동 검증
8. 로그, DB, 네트워크 결과 확인
9. Git Diff 최종 확인
10. 검증 결과를 Workflow와 PR에 기록

실제 실행한 항목만 성공으로 기록한다.

```text
Passed
Failed — 원인
Not Run — 사유
Blocked — 선행 조건
```

## 2. 기본 코드 검증

확인 항목:

- 컴파일 또는 타입 오류 없음
- Lint / Format 규칙 준수
- 기존 테스트 회귀 없음
- 새 분기와 예외 경로 테스트
- 불필요한 로그·주석·임시 코드 없음
- 성능상 명백한 N+1, 반복 I/O, 무제한 조회 없음
- 오류 메시지와 예외 변환 일관성
- Scope 밖 파일 변경 없음

예시:

```bash
./gradlew test --tests "*ReservationServiceTest"
./gradlew test
./gradlew build
```

프로젝트가 제공하는 공식 명령을 우선한다.

## 3. API 검증

최소 확인:

- 정상 요청
- 필수값 누락
- 형식·범위 오류
- 인증 실패
- 권한 없음
- Resource 없음
- 중복 또는 충돌
- 서버 오류 처리
- 기존 Client 호환성
- Content-Type 및 인코딩
- 개인정보 노출 여부

기록할 내용:

```text
Method / Path:
Request:
Expected Status:
Actual Status:
Response:
Authentication:
Test Data:
```

## 4. 보안과 권한

확인:

- Controller뿐 아니라 Service 또는 정책 계층에서도 권한이 보장되는가
- IDOR 가능성이 없는가
- 입력값 검증과 출력값 마스킹이 있는가
- 로그에 개인정보·Token이 남지 않는가
- 관리자 기능이 일반 사용자에게 노출되지 않는가
- CSRF, CORS, Session, JWT 정책과 충돌하지 않는가
- 실패 응답이 내부 구현을 과도하게 노출하지 않는가
- Secret이 코드, 문서, 테스트 데이터에 포함되지 않는가

## 5. DB 및 Migration

확인:

- Forward Migration
- 기존 데이터 호환성
- Null / Default 처리
- Index 영향
- Lock과 장시간 실행 가능성
- 배포 순서
- 애플리케이션 구버전과의 호환 구간
- Rollback 또는 보상 Migration
- 데이터 손실 가능성
- 테스트 환경과 운영 DB 차이

이미 공유되거나 적용된 Migration은 임의 수정하지 않는다. 새 Migration으로 보완한다.

기록 예:

```text
Migration:
Backward Compatible: Yes / No
Estimated Lock:
Data Backfill:
Rollback:
Deployment Order:
```

## 6. UI · SSR · CSR

최소 확인:

- 정상 상태
- 빈 상태
- 로딩 상태
- 오류 상태
- 권한 없음
- 입력 검증 오류
- 네트워크 실패
- 중복 제출
- 반응형 화면
- 키보드 접근성
- 브라우저 Console 오류
- 주요 브라우저
- 변경 전후 Screenshot

SSR/CSR 혼합 시 추가 확인:

- Form 전송 Method와 Content-Type
- CSRF Token
- `_method` 처리
- Redirect와 Flash Message
- Fetch 오류 처리
- 재시도 시 중복 요청 여부
- 서버 렌더링 데이터와 Client 상태 불일치

## 7. LLM 또는 외부 AI API

필수 검토:

- System Instruction과 Prompt
- 입력·출력 Schema
- 출력 파싱 실패
- Timeout
- Retry와 Backoff
- Rate Limit
- 외부 API 오류
- Fallback
- 개인정보와 민감정보
- Prompt Injection
- 비용 제한
- 모델 변경 시 호환성
- 평가 데이터와 기대 결과
- 모델 미사용 가능 시 기능 동작

기록 예:

```text
Provider / Model:
Input Schema:
Output Schema:
Timeout:
Retry:
Fallback:
PII Handling:
Cost Limit:
Evaluation Set:
Failure Behavior:
```

LLM 응답을 테스트 성공의 근거로 사용할 때는 평가 입력, 기대 기준, 실제 결과를 남긴다.

## 8. 메시지 브로커와 비동기 처리

확인:

- Producer 전송 실패
- Consumer 재시도
- 중복 이벤트와 Idempotency
- 순서 보장 요구
- Dead Letter Queue
- 재처리 절차
- Transaction 경계
- Outbox 또는 보상 처리
- Schema Version
- 모니터링과 경보

## 9. 인프라와 배포

필수 검토:

- 대상 환경
- IaC 변경 범위
- 권한과 Secret
- Plan 결과
- Apply 조건
- 배포 순서
- Health Check
- Smoke Test
- Monitoring / Log
- Rollback
- 비용 영향
- 잔여 위험

운영 변경은 Plan 또는 변경 미리보기를 검토한 뒤 승인된 절차로 적용한다.

## 10. 성능

필요 시 확인:

- 기준 데이터 규모
- 변경 전후 응답 시간
- Query 수
- CPU / Memory
- Connection Pool
- Cache Hit
- 동시 요청
- Timeout
- 대량 데이터 경로
- 성능 저하 허용 기준

측정하지 않은 성능 향상을 단정하지 않는다.

## 11. 실패 처리

검증 실패 시:

1. 실패를 숨기지 않는다.
2. 재현 명령과 오류를 기록한다.
3. 현재 변경 때문인지 기존 결함인지 구분한다.
4. 현재 Workflow 완료를 차단하는지 판단한다.
5. 차단하면 상태를 `Blocked` 또는 `In Progress`로 유지한다.
6. 별도 결함이면 Issue 또는 TASK로 분리한다.
7. 테스트 삭제·완화·무시로 통과시키지 않는다.

## 12. Validation 표준 기록

```markdown
| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Unit | `./gradlew test --tests "*ReservationServiceTest"` | 전체 통과 | 12 tests passed | Passed |
| Build | `./gradlew build` | 성공 | BUILD SUCCESSFUL | Passed |
| API | `POST /reservations` 중복 요청 | 409 | 409 | Passed |
| UI | 중복 오류 메시지 | 화면 표시 | 확인 | Passed |
| DB | Migration 적용 | 성공 | 미실행 | Not Run — DB 미기동 |
```
