# TASK-0001: 랜딩 공개 게이트 해소와 기준선 계측

## Metadata

| Field | Value |
|---|---|
| Task ID | TASK-0001 |
| Status | In Progress |
| Priority | High |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Base Branch | develop |
| Task Branch | task/TASK-0001-landing-public-gate |
| Merge Authority | Human-only |
| Decision References | `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md`, `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md` |
| Rule References | `CLAUDE.md`, `docs/claude/01-task-workflow.md`, `docs/claude/02-git-operations.md`, `docs/claude/04-validation-checklists.md`, `docs/claude/05-templates.md` |
| Dependencies | 없음 — 이 저장소의 첫 TASK |

## Goal

`landing/`의 소유자 전용 검증본을 외부 공개 가능한 상태로 만들고, 초기 100개 유효 방문에서 재현 가능한 기준선 지표를 산출한다. 완료 시점에 `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md`의 공개 전 체크 8개 항목 전부가 실제 확인 결과와 함께 판정되어 있고, 공개 GO 또는 NO-GO 결론이 근거와 함께 기록되어 있다.

이 TASK는 GO 결론을 목표로 하지 않는다. **8개 항목을 사실로 확정하고 판정을 남기는 것**이 목표이며, 확인 결과가 NO-GO를 지지하면 NO-GO로 완료한다.

## Background

`docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 104행은 현재 공개 판정을 **NO-GO**로 기록하고, 다음 세 가지가 확정될 때까지 소유자 전용 상태를 유지한다고 명시한다.

1. 이메일 확인·발송 공급자
2. D1 및 호스팅 로그의 실제 처리 국가·수탁 범위·백업 보존
3. 공개 트래픽용 Turnstile 또는 동등한 남용 방어와 비용 중단 조건

같은 문서 84~93행의 공개 전 체크 8개 항목 중 4개가 미체크 상태다.

- [ ] 실제 이메일 저장 공급자와 데이터 위치 확인
- [ ] 개인정보 안내의 공급자·목적·보유 기간·삭제 방법 일치
- [ ] 비용 상한과 유료 채널 중단 조건 확인
- (상기 3조건에 대응하는 남용 방어 수단은 체크 목록에 별도 항목이 없으나 104행이 공개 전제로 요구한다)

코드 확인 결과는 다음과 같다.

- 이메일 **발송·확인 토큰** 구현과 남용 방어 구현은 `landing/` 어디에도 존재하지 않는다.
- 다만 확인 상태를 담을 `waitlist_entries.verified_at` 컬럼(`landing/db/schema.ts` 11행), 미확인 항목 14일 삭제 조건(`landing/db/landing-storage.ts` 5·21~22행), 일일 예약 작업(`landing/worker/index.ts` 169행 `scheduled`, `wrangler.jsonc`의 `"crons": ["17 3 * * *"]`)은 **이미 구현되어 있다**. 확인 흐름의 저장·만료 기반은 갖춰져 있고 발급·발송·검증만 비어 있다.
- `landing/worker/wrangler.jsonc`의 D1 `database_id`는 `00000000-0000-4000-8000-000000000000` 플레이스홀더다.

`docs/README.md` 74~77행의 "다음 작업" 1~4가 이 TASK의 범위와 대응한다.

## Input

- `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` — 현재 단계 범위 상한과 제외 범위
- `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md` — 보증 수준과 주장 제한
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` — 공개 전 체크 목록, 수집 데이터 정의, 측정 지표
- `docs/runbooks/fitpulse-landing-data-deletion-retention.md` — 현재 삭제·보존 절차
- `landing/` 기존 구현 — Next 16 + Vite + Cloudflare Workers + D1 + Drizzle
- `landing/README.md` — 현재 데이터 테이블과 보존 기간
- `.github/workflows/landing.yml` — 필수 CI 검증 명령

## Scope

### Included

- 이메일 확인·발송 공급자와 남용 방어 수단의 사실 확인·선정, 결과의 ADR 기록
- Cloudflare D1과 호스팅의 실제 데이터 처리 국가, 수탁 범위, 로그·백업 보존 기간 확인
- 공개 트래픽 대상 남용 방어의 서버 측 검증 구현
- 이메일 확인(더블 옵트인) 흐름 구현과 기존 14일 만료 정책 연동
- `landing/app/privacy/page.tsx`와 삭제·보존 런북을 확정된 공급자 사실과 구현에 일치시키기
- 월 비용 상한, 상한 감지 수단, 유료 채널 중단 조건의 문서화와 구현
- 공개 전 체크 8개 항목 전부에 대한 GO/NO-GO 재판정과 기록
- 초기 100개 유효 방문 기준선 지표의 재현 가능한 산출

### Excluded

- A/B 테스트와 페이지 변형 실험 — 실행 계획 110행이 기준선 확보를 우선한다고 명시
- 회원 계정, 인증, Health Connect 연동 — `ADR-20260814-002` 제외 범위
- 결제, 예약금, 유료 약정 — `ADR-20260814-002` 제외 범위
- 통증·부상·수면·심박 등 건강·의료 응답 수집 — `ADR-20260814-002` 제외 범위
- 개인별 운동 루틴·중량·회복 추천 — `ADR-20260814-002` 제외 범위
- Android 앱과 백엔드 서버 구현 — `ADR-20260814-002`의 정식 문서 체계 재개 조건 미충족
- `wiki/` v2 문서 세트의 FR·ERD·API 구현 — 역사 참조 자료이며 현재 실행 기준 아님
- 랜딩 카피·시각 디자인 개편 — 별도 TASK
- `CLAUDE.md` 3·5절의 `dev` 표기를 `develop`으로 정정하는 작업 — 별도 chore TASK

## Acceptance Criteria

- [ ] AC-01: 이메일 확인·발송 공급자, 데이터 처리 국가, 수탁 범위, 로그·백업 보존 기간이 확인 출처와 확인일과 함께 `docs/decisions/`의 ADR에 기록되어 있다.
- [ ] AC-02: 남용 방어 토큰이 없거나 위조·만료된 대기자 등록 요청을 서버가 거부하고, 해당 거부를 확인하는 자동 테스트가 `npm test`에서 통과한다.
- [ ] AC-03: 확인되지 않은 이메일은 대기자 집계 질의 결과에 포함되지 않으며, 이를 확인하는 자동 테스트가 통과한다.
- [ ] AC-04: 미확인 항목 14일 만료 삭제와 일일 예약 작업이 확인 흐름 도입 후에도 회귀 없이 동작하며, 이를 확인하는 자동 테스트가 통과한다. (신규 구현이 아니라 기존 구현의 회귀 확인이다.)
- [ ] AC-05: 확인 메일 발송 성공·실패와 무관하게 등록 응답이 이메일 존재 여부와 내부 ID를 노출하지 않으며, 이를 확인하는 자동 테스트가 통과한다.
- [ ] AC-06: 확인 토큰과 이메일 주소가 URL 질의 문자열, `landing_events` 속성, Worker 로그에 기록되지 않으며, 이를 확인하는 경계 테스트가 통과한다.
- [ ] AC-07: `landing/app/privacy/page.tsx`가 명시하는 공급자, 수집 항목, 목적, 보유 기간, 삭제 방법이 `landing/db/schema.ts`의 실제 테이블과 보존 작업, `docs/runbooks/fitpulse-landing-data-deletion-retention.md`의 절차와 일치한다.
- [ ] AC-08: 삭제 요청 흐름을 실제로 실행해 대상 행이 사라지는 것을 검산한 기록이 `docs/verification/`에 남아 있다.
- [ ] AC-09: 월 비용 상한 금액, 상한 도달 감지 수단, 도달 시 유료 채널 중단 절차가 문서화되어 있고, 감지 수단의 동작을 실제로 확인한 기록이 있다.
- [ ] AC-10: 실행 계획 84~93행 공개 전 체크 8개 항목 전부가 확인 결과와 확인일과 함께 체크 또는 미체크로 판정되어 있다.
- [ ] AC-11: 공개 GO 또는 NO-GO 결론이 AC-10의 판정 결과를 근거로 `docs/decisions/`에 기록되어 있다.
- [ ] AC-12: `waitlist_submit / landing_view`와 보조 지표 5종(CTA 클릭률, 선택 설문 완료율, 인터뷰 안내 수신 선택률, 채널별 획득비용, WF-03이 추가한 확인 완료율 `waitlist_confirm / waitlist_submit`)을 산출하는 질의가 문서화되어 있고, 같은 입력에 같은 결과를 내는 것이 확인되었다.

## Dependencies

- 선행 TASK: 없음
- 외부 의존: Cloudflare 계정의 D1·Workers 실제 바인딩 정보, 선정될 이메일 발송 공급자의 계약·데이터 처리 정보
- 환경: Node.js 22.13.0 이상, Wrangler 4.123.0
- 미확정 입력: 이메일 발송 공급자와 남용 방어 수단은 WF-01의 산출물이며, WF-02·WF-03·WF-05의 Precondition이다.

## Risks

- 기능 위험: 더블 옵트인 도입으로 기존 `waitlist_submit` 이벤트의 의미가 "등록 제출"에서 "확인 완료"로 바뀔 수 있다. 지표 정의를 바꾸면 기존 검증 기록과 비교 불가능해진다. WF-03에서 이벤트 의미를 명시적으로 결정하고 문서에 남긴다.
- 보안 위험: 확인 토큰이 URL에 노출되므로 Referer 헤더, 브라우저 이력, Worker 로그를 통한 유출 경로가 생긴다. AC-06으로 경계를 강제한다.
- 보안 위험: 남용 방어 도입 시 토큰 검증을 클라이언트에만 두면 우회 가능하다. 서버 측 검증만 인정한다(AC-02).
- 데이터 위험: `landing/worker/wrangler.jsonc`의 D1 `database_id`가 플레이스홀더다. 실제 값 확정 전에는 프로덕션 데이터 위치를 주장할 수 없다.
- 개인정보 위험: 이메일 발송 공급자는 이메일 주소의 수탁자가 된다. 처리 국가와 보존 기간을 확인하지 않고 공개하면 개인정보 안내가 사실과 어긋난다. WF-01 조사 결과 유력 후보인 Resend는 발송 리전과 무관하게 계정 데이터·로그를 미국에 저장하므로, 채택 시 국외 이전 고지가 필수다.
- 개인정보 위험: D1 Time Travel이 Workers Free 플랜 7일, Paid 플랜 30일의 복원 가능 기간을 만든다. 직접 삭제를 실행해도 그 기간 동안은 삭제 이전 시점으로 복원할 수 있으므로, 안내 문구의 "삭제"와 실제 소멸 시점이 어긋난다. WF-01 조사에서 드러난 사실이며 WF-04 Scope에 반영했다.
- 비용 위험: 공개 트래픽이 들어오면 Workers·D1·이메일 발송에 종량 비용이 발생한다. 500,000원 상한(`ADR-20260814-001`) 안에서 중단 조건이 없으면 예산 초과 위험이 있다.
- 문서 위험: 이 TASK의 결과가 NO-GO여도 완료로 처리한다. GO를 목표로 삼아 확인을 생략하면 `CLAUDE.md` 절대 조건 5를 위반한다.
- 미확인 항목: Cloudflare Workers 로그와 D1 백업의 실제 보존 기간·리전은 아직 확인하지 않았다. WF-01에서 확인한다.

## Rollback Strategy

- 코드: 각 Workflow는 독립 PR로 Task Branch에 병합한다. 특정 Workflow만 되돌릴 때는 해당 병합 커밋을 `git revert -m 1`로 되돌린다.
- 데이터베이스: WF-03이 유일하게 D1 마이그레이션을 동반한다. 확인 상태 컬럼과 토큰 테이블은 추가만 하고 기존 컬럼을 삭제·변경하지 않는다. 되돌릴 때는 역방향 마이그레이션을 새 파일로 추가하며, 이미 적용된 마이그레이션 파일을 수정하지 않는다.
- 설정: `landing/worker/wrangler.jsonc`와 Cloudflare 대시보드 설정 변경은 변경 전 값을 WF 문서 Change History에 기록한 뒤 적용한다.
- 공개 상태: 공개 후 문제 발생 시 접근 제한을 소유자 전용으로 되돌리는 것이 1차 대응이며, 코드 롤백보다 우선한다.

## Step / Workflow Index

| Step | Workflow | Description | Status | Branch | PR | Dependency |
|---|---|---|---|---|---|---|
| STEP-01 | WF-01 | 공급자·데이터 처리 사실 확인과 선정 | In Progress | workflow/TASK-0001-WF-01-provider-selection | - | 없음 |
| STEP-02 | WF-02 | 공개 트래픽 남용 방어 서버 검증 | Draft | workflow/TASK-0001-WF-02-abuse-defense | - | WF-01 |
| STEP-02 | WF-03 | 이메일 확인 흐름 | Draft | workflow/TASK-0001-WF-03-email-confirmation | - | WF-01 |
| STEP-02 | WF-05 | 비용 상한·중단 조건과 운영 계측 | Draft | workflow/TASK-0001-WF-05-cost-cap-observability | - | WF-01 |
| STEP-03 | WF-04 | 개인정보 안내·삭제 런북 정합화 | Draft | workflow/TASK-0001-WF-04-privacy-runbook-alignment | - | WF-02, WF-03 |
| STEP-03 | WF-06 | 공개 판정과 기준선 계측 | Draft | workflow/TASK-0001-WF-06-public-decision-baseline | - | WF-02, WF-03, WF-04, WF-05 |

WF-02·WF-03·WF-05는 서로 의존하지 않으므로 병렬 실행할 수 있다.

## Steps

### STEP-01

| Field | Content |
|---|---|
| Step Name | 공급자와 데이터 처리 사실 확정 |
| Goal | 이메일 확인·발송 공급자와 남용 방어 수단이 선정되고, 이메일·이벤트 데이터의 실제 처리 국가·수탁 범위·로그·백업 보존 기간이 출처와 함께 문서에 기록된다. |
| Input | `ADR-20260814-002` 범위 상한, `ADR-20260814-001` 예산 상한 500,000원, 실행 계획 104행의 NO-GO 3조건, 현재 `landing/worker/wrangler.jsonc` 설정 |
| Scope | 포함: 공급자 후보 비교, 데이터 처리 사실 확인, ADR 작성, D1 `database_id` 실제 값 확인. 제외: 구현 코드 변경, 계약 체결, 결제 수단 등록 |
| Instructions | 1. 이메일 발송 공급자 후보를 데이터 처리 리전·무료 한도·수탁 계약 가능 여부 기준으로 비교한다. 2. 남용 방어 수단 후보를 서버 측 검증 가능 여부와 비용 기준으로 비교한다. 3. Cloudflare D1 리전, Workers 로그 보존 기간, D1 백업 보존 기간을 공급자 공식 문서에서 확인하고 확인일과 URL을 기록한다. 4. 실제 D1 `database_id`를 확인한다. 5. 선정 결과와 근거를 ADR로 작성한다. |
| Output Format | `docs/decisions/ADR-20260817-003-landing-public-providers.md` 1개. 비교표, 선정 근거, 확인 출처와 확인일, 배제한 대안을 포함한다. |
| Constraints | 확인하지 못한 사실을 확정 사실로 기록하지 않는다. 미확인 항목은 `미확인 — 사유`로 남긴다. 예산 상한 500,000원을 넘는 유료 요금제를 선정하지 않는다. 계약 서명, 결제 정보, 실제 API 키를 저장소에 남기지 않는다. |
| Done When | ADR이 작성되고, 실행 계획 104행의 3조건 각각에 대해 확정 또는 미확인 상태가 출처와 함께 기록되었다. |
| Duration | Medium |
| RULE Reference | `CLAUDE.md` 절대 조건 1(추측 금지), `docs/README.md` "Git에 저장하지 않는 정보", `docs/claude/04-validation-checklists.md` |

### STEP-02

| Field | Content |
|---|---|
| Step Name | 공개 전제 구현 |
| Goal | 남용 방어 서버 검증, 이메일 확인 흐름, 비용 상한 감지가 구현되고 자동 테스트로 검증된다. |
| Input | STEP-01의 ADR, 기존 `landing/app/lib/api-handlers.ts`·`landing/db/`·`landing/worker/` 구현, `landing/tests/rendered-html.test.mjs` |
| Scope | 포함: WF-02, WF-03, WF-05의 구현과 테스트. 제외: 개인정보 안내 문구 갱신(WF-04), 공개 판정(WF-06) |
| Instructions | 1. 각 Workflow를 Task Branch에서 분기한 별도 Branch에서 진행한다. 2. 각 Workflow는 실패하는 테스트를 먼저 작성한다. 3. 최소 구현으로 통과시킨다. 4. Workflow별 PR을 Task Branch를 Base로 생성한다. 5. WF-02·WF-03·WF-05는 병렬 진행 가능하나 각 PR은 독립적으로 검증한다. |
| Output Format | 변경된 소스 파일, 추가된 테스트, D1 마이그레이션 파일(WF-03만), 갱신된 Workflow 문서와 HISTORY |
| Constraints | 클라이언트 측 검증만으로 방어를 주장하지 않는다. 기존 이벤트 허용 목록 경계를 무너뜨리지 않는다. 이미 적용된 마이그레이션 파일을 수정하지 않는다. 실제 API 키와 시크릿을 저장소에 커밋하지 않는다. |
| Done When | WF-02·WF-03·WF-05가 모두 Done이고, `landing/`에서 `npm test`, `npm run lint`, `npm audit --omit=dev --audit-level=high`가 통과한다. |
| Duration | Large |
| RULE Reference | `CLAUDE.md` 절대 조건 2(Test-First), `docs/claude/04-validation-checklists.md`, `docs/claude/02-git-operations.md` |

### STEP-03

| Field | Content |
|---|---|
| Step Name | 고지 정합화와 공개 판정 |
| Goal | 개인정보 안내와 런북이 실제 구현·공급자와 일치하고, 공개 GO/NO-GO 판정과 기준선 계측 방법이 기록된다. |
| Input | STEP-01의 ADR, STEP-02의 구현 결과, 실행 계획 84~93행 체크 목록, 실행 계획 106~110행 측정 정의 |
| Scope | 포함: `landing/app/privacy/page.tsx` 갱신, 런북 갱신, 삭제 흐름 실행 검산, 공개 판정 ADR, 기준선 산출 질의. 제외: 실제 공개 실행, 채널 집행, A/B 테스트 |
| Instructions | 1. WF-04에서 안내 문구를 실제 테이블·보존 작업·공급자와 대조해 갱신한다. 2. 삭제 흐름을 실제 실행해 결과를 검산하고 `docs/verification/`에 기록한다. 3. WF-06에서 8개 체크 항목을 각각 판정한다. 4. 판정 결과를 근거로 GO/NO-GO ADR을 작성한다. 5. 기준선 지표 산출 질의를 문서화하고 재현성을 확인한다. |
| Output Format | 갱신된 `landing/app/privacy/page.tsx`와 런북, `docs/verification/` 검산 기록, `docs/decisions/`의 공개 판정 ADR, 기준선 산출 질의 문서 |
| Constraints | 확인하지 않은 항목을 체크 완료로 표시하지 않는다. 랜딩 반응을 제품 적합성·결제 의사·법적 적합성으로 과장하지 않는다(`ADR-20260814-002` 최소 운영 기준). 5명 미만 소수 셀을 문서에 남기지 않는다. |
| Done When | 8개 체크 항목이 전부 판정되고, GO/NO-GO ADR이 작성되고, 기준선 질의의 재현성이 확인되었다. |
| Duration | Medium |
| RULE Reference | `ADR-20260814-002` 최소 운영 기준, `docs/README.md` 산출물 위치 규칙, `docs/claude/04-validation-checklists.md` |

## Integration Validation

| Type | Command or Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 전체 통과 | 미실행 | Not Run |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 취약점 0 | 미실행 | Not Run |
| Build | `cd landing && npm run build` | 성공 (`npm test`에 포함) | 미실행 | Not Run |
| CI | `.github/workflows/landing.yml` | Landing CI 통과 | 미실행 | Not Run |
| Manual | 실기기 또는 375×812·768×1024·1280×720 뷰포트에서 등록·확인·설문·삭제 전 흐름 실행 | 기능·가로 넘침·키보드 순서 이상 없음 | 미실행 | Not Run |
| Manual | 삭제 요청 실행 후 D1 대상 행 부재 검산 | 대상 행 0건 | 미실행 | Not Run |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |

`.github/workflows/landing.yml`은 현재 `pull_request` 전체와 `push`의 `main`에만 반응한다. `develop` push에는 반응하지 않으므로, Task PR과 Workflow PR에서는 CI가 동작하지만 `develop` 병합 후 push 검증은 별도로 확인해야 한다.

## Definition of Done

- [ ] 모든 필수 Workflow(WF-01~WF-06)가 Done이다.
- [ ] 모든 Acceptance Criteria(AC-01~AC-12)가 검증되었다.
- [ ] 통합 및 회귀 테스트를 통과했다.
- [ ] 보안, 권한, 예외 처리를 검토했다.
- [ ] DB 호환성과 Rollback을 검토했다.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] Task PR 필수 CI가 통과했다.
- [ ] 필수 리뷰가 완료되었다.
- [ ] 해결되지 않은 리뷰 의견이 없다.
- [ ] 공개 판정이 GO든 NO-GO든 근거와 함께 기록되었다.
