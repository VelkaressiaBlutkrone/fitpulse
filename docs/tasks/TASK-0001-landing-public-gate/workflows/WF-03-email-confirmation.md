# WF-03: 이메일 확인 흐름

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-03 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Review — 실제 SES 연동 Not Run |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-03-email-confirmation |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01, WF-07 |
| Affected Paths | `landing/db/schema.ts`, `landing/db/landing-storage.ts`, `landing/drizzle/`, `landing/app/api/waitlist/route.ts`, `landing/app/lib/api-handlers.ts`, `landing/app/lib/`(확인 토큰·발송 어댑터 신규), `landing/worker/index.ts`, `landing/worker/wrangler.jsonc`, `landing/tests/` |
| Decision References | `ADR-20260814-002`, WF-01 산출 ADR |
| Rule References | `CLAUDE.md` 절대 조건 2, `docs/claude/04-validation-checklists.md` |

## Goal

대기자 등록 시 확인 메일을 발송하고, 확인 링크를 통해 `waitlist_entries.verified_at`을 설정하는 흐름을 구현한다. 확인되지 않은 이메일이 대기자 집계에서 제외되도록 하고, 확인 토큰과 이메일 주소가 이벤트·로그·URL 질의 문자열로 새지 않도록 경계를 유지한다.

## Input

- WF-01 산출 ADR — 선정된 이메일 발송 공급자, 데이터 처리 국가, 수탁 범위
- `landing/db/schema.ts` — 기존 `waitlist_entries` 정의
- `landing/db/landing-storage.ts` — 기존 보존 정리 질의와 삽입 질의
- `landing/worker/index.ts` — 기존 `scheduled` 핸들러
- `landing/app/lib/session.ts` — 기존 HttpOnly 관리 세션 처리
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 96~101행 — 기존 보안·보존 경계

## 확인된 기존 구현 사실

이 Workflow를 좁히는 근거다. 추측이 아니라 코드에서 확인했다.

- `landing/db/schema.ts` 11행에 `verifiedAt: text("verified_at")` 컬럼이 **이미 존재**한다. 확인 상태를 담을 자리를 새로 만들 필요가 없다.
- `landing/db/landing-storage.ts` 5·13·21~22행에 `PENDING_RETENTION_DAYS = 14`와 `verified_at IS NULL AND created_at < ?` 삭제 조건이 **이미 구현**되어 있다. 미확인 항목 14일 만료 삭제를 새로 만들 필요가 없다.
- `landing/worker/index.ts` 169행에 `scheduled` 핸들러가 **이미 존재**하고, `landing/worker/wrangler.jsonc`에 `"crons": ["17 3 * * *"]`가 선언되어 있다. 일일 예약 작업을 새로 만들 필요가 없다.
- `landing/db/schema.ts` 13·18행의 `management_token_hash`와 그 고유 인덱스가 **이미 존재**한다. 확인 토큰도 같은 "해시만 저장" 패턴을 따른다.

따라서 이 Workflow의 실제 신규 범위는 **확인 토큰 발급·발송·검증과 `verified_at` 설정**이며, 만료 삭제와 예약 작업은 회귀 확인 대상이다.

## Scope

### Included

- 확인 토큰 생성과 해시 저장 (원문은 저장하지 않음)
- 확인 토큰 만료 시각 관리
- 선정된 공급자를 통한 확인 메일 발송 어댑터
- 확인 링크 처리 경로와 `verified_at` 설정
- 확인 완료·실패·만료·재사용 응답 규약
- 대기자 집계 질의에서 미확인 항목 제외
- 확인 메일 재발송 요청의 남용 방지
- 위 항목의 실패 테스트 선작성과 최소 구현
- 기존 14일 만료 삭제와 일일 예약 작업의 회귀 확인

### Excluded

- 남용 방어 토큰 검증 — WF-02
- 개인정보 안내 문구 갱신 — WF-04
- 발송 비용 상한과 중단 조건 — WF-05
- 기존 365일 보존 정책 변경 — 현행 유지
- 회원 계정과 로그인 — `ADR-20260814-002` 제외 범위

## Preconditions

- WF-01의 PR이 Task Branch에 병합되어 `ADR-20260817-003`이 `ACCEPTED`다. 발송 공급자는 **Amazon SES, 리전 `ap-northeast-2`(서울)**로 확정되었다.
- WF-07이 완료되어 프로덕션 D1이 존재하고 마이그레이션이 적용되어 있다.
- **AWS 프로덕션 액세스가 승인되어 있다.** SES 샌드박스는 송신자와 수신자 주소를 모두 사전 검증해야 발송되므로, 임의 주소인 대기자 이메일에는 쓸 수 없다. 승인 전에는 이 Workflow의 실제 발송 검증을 완료할 수 없다.
- 로컬 자동 테스트는 발송 어댑터를 대체 구현으로 주입해 실행한다. 실제 SES 호출 없이 어댑터 경계에서 검증한다.
- 실제 발송 자격증명(AWS 액세스 키 또는 SMTP 자격증명)은 Cloudflare Secret으로 주입하며 저장소에 커밋하지 않는다.

## Constraints

- 확인 토큰 원문을 데이터베이스에 저장하지 않는다. 해시만 저장한다.
- 확인 토큰과 이메일 주소를 `landing_events.properties_json`에 넣지 않는다.
- 확인 토큰과 이메일 주소를 Worker 로그에 남기지 않는다. `landing/worker/wrangler.jsonc`의 observability 로그 샘플링이 켜져 있으므로 로그 인자에 직접 넣지 않는다.
- 등록 응답이 이메일 존재 여부와 내부 ID를 노출하지 않는다. 발송 실패 시에도 같은 응답 형태를 유지한다.
- 확인 링크 재사용과 만료를 구분해 처리하되, 응답으로 이메일 존재 여부를 추론할 수 없게 한다.
- 이미 적용된 마이그레이션 파일(`landing/drizzle/0000_*.sql`, `0001_*.sql`)을 수정하지 않는다. 변경은 새 마이그레이션 파일로만 추가한다.
- 기존 컬럼을 삭제하거나 타입을 바꾸지 않는다. 추가만 한다.
- `waitlist_submit` 이벤트의 의미 변경 여부를 이 Workflow에서 명시적으로 결정하고 문서에 기록한다. 결정 없이 구현하지 않는다.

## waitlist_submit 이벤트 의미 결정

`docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 61행은 `waitlist_submit`을 "유효 대기자 등록"으로 정의하고, 98행은 서버가 실제 저장 결과를 기준으로 한 번만 기록한다고 명시한다. 더블 옵트인 도입 시 "저장"과 "확인 완료"가 갈라진다.

이 Workflow는 다음을 결정하고 구현한다.

- `waitlist_submit`은 **저장 성공 시점**을 계속 의미한다. 기존 기록과의 비교 가능성을 유지하기 위해 정의를 바꾸지 않는다.
- 확인 완료는 **새 이벤트 `waitlist_confirm`**으로 기록한다. 허용 속성은 `page_version`, `channel_code`로 한정한다.
- 주 지표 `waitlist_submit / landing_view`의 정의는 유지하고, 확인 완료율 `waitlist_confirm / waitlist_submit`을 보조 지표로 추가한다. 실행 계획의 측정 정의 갱신은 WF-06에서 처리한다.

이 결정을 뒤집으려면 TASK-0001의 Scope와 Acceptance Criteria를 먼저 갱신한다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Done | `waitlist_submit` 의미 유지 결정, 로컬 완결 범위 확정 | - |
| 02 | 보안 모델 | Yes | Done | 해시만 저장, 토큰 1회 소비, 리다이렉트에 토큰 미포함, 실패 사유 미구분 | - |
| 03 | ERD / 데이터 | Yes | Done | `0003` 마이그레이션 — `ADD COLUMN` 2개, 인덱스 1개 | - |
| 04 | API Contract | Yes | Done | `GET /api/waitlist/confirm`, `GET /api/waitlist/summary` | - |
| 05 | DTO | Yes | Done | `ConfirmationEmail`, `EmailConfig`, `SendResult` | - |
| 06 | Domain | Yes | Done | 확인 상태 전이와 만료 판정 | - |
| 07 | Service | Yes | Done | `confirmWaitlistByToken`, `countVerifiedWaitlist`, `sendConfirmationEmail` | - |
| 08 | Controller | Yes | Done | `handleWaitlistConfirm`, `handleWaitlistSummary`, Worker 라우팅 | - |
| 09 | View / Client | Yes | Done | `app/confirm/page.tsx`, 폼 성공 문구 갱신 | - |
| 10 | Test | Yes | Done | 신규 5개 포함 20개 통과 | - |
| 11 | 문서 / HISTORY | Yes | Done | 이 문서와 HISTORY | - |

## Expected Output

- 스키마·마이그레이션
  - `landing/db/schema.ts` — 확인 토큰 해시와 만료 시각 저장 자리 추가 (`waitlist_entries` 컬럼 추가 또는 별도 테이블)
  - `landing/drizzle/0002_*.sql` — 신규 마이그레이션 파일 (`npm run db:generate`로 생성)
- 변경 파일
  - `landing/db/landing-storage.ts` — 토큰 저장·조회·소비, 미확인 제외 집계 질의
  - `landing/app/lib/` — 확인 토큰 생성·해시 모듈, 이메일 발송 어댑터. **SES 종속 코드(SigV4 서명 또는 SMTP)를 이 경계 안에만 둔다.** Workers 런타임에서 AWS SDK 없이 `fetch`로 SigV4를 서명하거나 SMTP를 쓸지는 이 Workflow에서 결정하고 근거를 기록한다
  - `landing/app/api/waitlist/route.ts`, `landing/app/lib/api-handlers.ts` — 등록 시 발송, 확인 경로 처리
  - `landing/worker/wrangler.jsonc` — 발송 공급자 시크릿 참조 선언
- 추가 테스트 (`landing/tests/`)
  - 유효 토큰으로 확인 시 `verified_at`이 설정됨
  - 만료 토큰 거부
  - 재사용 토큰 거부
  - 위조 토큰 거부
  - 미확인 항목이 대기자 집계 질의 결과에서 제외됨
  - 발송 실패 시에도 등록 응답이 이메일 존재 여부·내부 ID를 노출하지 않음
  - 확인 토큰과 이메일이 `landing_events` 저장 행에 없음
  - `waitlist_confirm` 이벤트가 확인 성공당 한 번만 기록됨
  - 회귀: 미확인 14일 경과 항목이 예약 작업으로 삭제됨
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 신규·기존 테스트 전체 통과 | **20개 전부 통과** (기존 15 + 신규 5) | Passed |
| Lint | `cd landing && npm run lint` | 오류 0 | 오류 0 | Passed |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 0 | `found 0 vulnerabilities` | Passed |
| Build | `cd landing && npm run db:generate` | 새 마이그레이션 파일 생성, 기존 파일 변경 0 | `0003_omniscient_la_nuit.sql` 생성. `ADD COLUMN` 2개와 인덱스 1개만 추가 | Passed |
| Test | 등록 → 확인 링크 → 재클릭 | 확인 1회 성공, 재클릭은 무효 처리 | 통과 | Passed |
| Test | 위조·누락 토큰 거부 | 무효 처리로 리다이렉트 | 통과 | Passed |
| Test | 확인 후 토큰 해시가 지워짐 | `confirmation_token_hash IS NULL` | 통과 | Passed |
| Test | 리다이렉트 주소에 토큰 미포함 | `token=` 없음 | 통과 | Passed |
| Test | 발송 실패 시에도 등록 성공·정보 미노출 | 202, 발송 관련 문구 없음 | 통과 | Passed |
| Test | 미확인 항목이 집계에서 제외됨 | 확인분만 계수 | 통과 | Passed |
| Test | 집계 응답에 이메일·내부 ID 미포함 | 0건 | 통과 | Passed |
| Test | `waitlist_confirm` 이벤트가 확인당 1회 | 1건 | 통과 | Passed |
| Test | `landing_events`에 토큰 문자열 부재 | 0건 | 통과 | Passed |
| Security | `git diff`에서 API 키·시크릿 문자열 검색 | 0건 | 0건 | Passed |
| Manual | **실제 Amazon SES 연동과 발송 검증** | 실제 메일 수신 | 미실행 | **Not Run — AWS 프로덕션 액세스 승인 대기** |
| Manual | 375×812 뷰포트에서 확인 페이지 표시 확인 | 가로 넘침 없음 | 미실행 | **Not Run — 실기기 QA 보류** |

### 구현 범위와 남은 것

소유자 지시로 배포를 보류했으므로 **로컬에서 완결되는 범위까지** 구현했다.

| 구현함 | 남음 |
|---|---|
| 확인 토큰 발급·해시 저장·만료(14일) | 실제 SES SigV4 서명 또는 SMTP 연동 |
| 확인 링크 처리와 `verified_at` 설정 | 실제 메일 수신 확인 |
| 재사용·만료·위조 토큰 거부 | 실기기 뷰포트 QA |
| 발송 어댑터 경계(`app/lib/email.ts`) | |
| 확인 결과 페이지(`app/confirm/page.tsx`) | |
| 확인분만 세는 집계(`/api/waitlist/summary`) | |

발송 어댑터는 HTTP 엔드포인트로 위임하는 형태이며, `EMAIL_SEND_URL`을 주입하지 않으면 발송을 건너뛰고 등록은 성공한다. AWS 승인 후 이 경계 안만 SES 구현으로 교체하면 된다.

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — 실패 테스트 선작성 후 통과 확인
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신
- [ ] `waitlist_submit` 의미 결정이 문서에 기록되고 구현과 일치함

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성 |
| 2026-08-17 | Review | - | - | 로컬 완결 범위 구현. 확인 토큰 발급·검증, 확인 페이지, 발송 어댑터 경계, 확인분 집계. `npm test` 20개 통과. 실제 SES 연동은 AWS 승인 대기로 Not Run |
