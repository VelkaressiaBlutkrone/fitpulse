# TASK-0004: 랜딩 공개 판정과 배포 의존 검증 해소

## Metadata

| Field | Value |
|---|---|
| Task ID | TASK-0004 |
| Status | Draft |
| Priority | Medium |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Base Branch | develop |
| Task Branch | task/TASK-0004-landing-public-release-decision |
| Merge Authority | Human-only |
| Decision References | `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md`, `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md`, `docs/decisions/ADR-20260817-003-landing-public-providers.md` |
| Rule References | `CLAUDE.md`, `docs/claude/01-task-workflow.md`, `docs/claude/02-git-operations.md`, `docs/claude/04-validation-checklists.md`, `docs/claude/05-templates.md` |
| Dependencies | **TASK-0001** — 공개 게이트 구현이 `develop`에 병합되어 있어야 한다 |

## Goal

랜딩을 실제로 공개할 수 있는지 판정하고, 배포가 존재해야만 수행할 수 있어 TASK-0001에서 미실행으로 남은 검증을 해소한다.

완료 시점에 다음이 성립한다.

- 월 비용 상한과 상한 도달 시 중단 절차가 문서화되어 있고 감지 수단의 동작이 확인되었다
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 84~93행의 공개 전 체크 8개 항목 전부가 확인 결과·확인일과 함께 판정되어 있다
- 공개 GO 또는 NO-GO 결론이 그 판정을 근거로 ADR에 기록되어 있다
- 초기 100개 유효 방문 기준선 지표를 재현 가능한 질의로 산출할 수 있다

**이 TASK는 GO를 목표로 하지 않는다.** 확인 결과가 NO-GO를 지지하면 NO-GO로 완료한다. GO를 목표로 삼아 확인을 생략하면 `CLAUDE.md` 절대 조건 5를 위반한다.

## Background

### 이 TASK가 생긴 경위

TASK-0001은 랜딩 공개 게이트 해소를 목표로 WF-01~WF-09를 진행했다. 이 중 **WF-05(비용 상한·중단 조건)와 WF-06(공개 판정·기준선 계측)은 배포된 사이트가 있어야만 진행할 수 있어** 2026-08-17 소유자 지시로 보류되었고 `Blocked` 상태로 남았다.

`docs/claude/01-task-workflow.md` §9는 "필수 Workflow가 모두 `Done`이어야 TASK를 `Review` 또는 `Done`으로 변경할 수 있다"고 규정한다. 따라서 `Blocked` 상태의 2개가 TASK-0001의 마감을 막았고, Task PR이 열리지 않아 **TASK-0001 안의 모든 변경이 `develop`에 도달하지 못했다.**

그 결과가 통합 브랜치 CI 차단이다. WF-08이 복구한 `landing/package-lock.json`이 Task Branch에만 있어, `develop`에서 분기한 모든 PR이 `npm ci` 단계에서 실패했다.

```text
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
```

TASK-0001 WF-10에서 두 Workflow를 이 TASK로 분리해 결합을 끊었다. 상세 경위는 `docs/tasks/TASK-0001-landing-public-gate/HISTORY.md`와 `workflows/WF-10-scope-split-and-closeout.md`에 있다.

### 이관은 취소가 아니다

WF-05·WF-06은 TASK-0001에서 `Cancelled — TASK-0004로 대체`로 표시되었으나 **작업 자체가 폐기된 것이 아니다.** 공개 판정 전에 모두 해소해야 하며, 그때까지 랜딩은 소유자 전용 상태를 유지한다.

### 선행 조건 — 소유자만 할 수 있는 작업

이 TASK는 저장소 밖 작업에 의존한다. 절차는 `docs/runbooks/fitpulse-landing-secrets-and-keys.md`에 있다.

| 작업 | 없으면 |
|---|---|
| **Worker 시크릿 주입 경로 확인** | fail-closed 설계상 **모든 등록이 503으로 거부**된다. `wrangler secret put`을 쓸 수 없으며, `chatgpt.com/sites` → More actions → Settings에 환경변수 항목이 있는지 확인되지 않았다 |
| AWS SES 프로덕션 액세스 승인 | 샌드박스는 수신자 사전 검증을 요구해 대기자에게 확인 메일을 보낼 수 없다 |
| Turnstile 운영 키 발급 | 위젯이 렌더링되지 않는다. 공개 도메인 확정이 선행이다 |
| GitHub 시크릿 등록 (`LANDING_BASE_URL`, `MAINTENANCE_TOKEN`) | 외부 정리 스케줄러(삭제 경로 3)가 동작하지 않는다 |
| Sites 플랜 사용량 한도 확인 | 한도 소진 시 등록과 **삭제 요청이 함께 막힐 수 있다.** 수치가 제품 내부에만 표시된다 |
| OpenAI 문서 원문 대조 3건 | 공개 판정 근거가 2차 자료에 머문다 |

## Input

- `docs/tasks/TASK-0001-landing-public-gate/` — 구현 결과, 판단 경위, 미실행 검증 목록
- `docs/decisions/ADR-20260817-003-landing-public-providers.md` — 공급자 선정과 철회한 결정 2건
- `docs/verification/fitpulse-landing-platform-data-handling-20260817.md` — 플랫폼 데이터 처리 사실 8건과 미확인 항목
- `docs/verification/fitpulse-landing-deletion-verification-20260817.md` — 삭제·보존 검산 11개 항목
- `docs/runbooks/fitpulse-landing-secrets-and-keys.md` — 키·시크릿 등록 절차와 미확인 항목
- `docs/runbooks/fitpulse-landing-data-deletion-retention.md` — 삭제 경로 3개와 30일 잔존
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` — 공개 전 체크 8개 항목(84~93행), 기존 판정(95~104행), 측정 정의(106~110행)
- `landing/db/schema.ts` — `landing_events` 구조와 보존 상수
- `ADR-20260814-001` — 검증 예산 상한 500,000원
- `ADR-20260814-002` — 현재 단계 제외 범위

## Scope

### Included

- 비용 발생 요소 목록화와 월 상한 금액 결정, 500,000원 전체 상한 내 배분
- 상한 도달 감지 수단 결정·설정과 **실제 동작 확인**
- 상한 도달 시 유료 채널 중단과 서비스 축소 절차 문서화
- Sites 플랜 사용량 한도 확인과 소진 시 동작 확인 — 특히 **삭제 요청 처리도 막히는지**
- 공개 전 체크 8개 항목 각각의 재판정과 근거·확인일 기록
- 공개 GO/NO-GO ADR 작성
- 주 지표 `waitlist_submit / landing_view`와 보조 지표 6종의 산출 질의 문서화 및 재현성 확인
- TASK-0001에서 `Not Run`으로 남은 배포 의존 검증의 해소
  - 실제 SES 연동·발송 검증 (WF-03)
  - 배포본에서의 개인정보 안내 검산 (WF-04)
  - 배포본에서의 삭제·보존 동작 확인, 플랫폼 cron 실행 여부 관찰 (WF-09)
  - OpenAI 문서 원문 대조 3건 (WF-01·WF-07)
  - 실기기 또는 375×812·768×1024·1280×720 뷰포트 QA
- 실행 계획 문서와 `docs/README.md`의 "현재 결론"·"다음 작업" 갱신

### Excluded

- 랜딩 공개 게이트의 구현 — TASK-0001에서 완료
- 랜딩 카피·시각 디자인 — TASK-0003
- 실제 공개 실행 — 판정이 GO여도 실행은 소유자의 별도 결정
- 유료 채널 실제 집행 — 공개 이후 별도 결정
- 100개 유효 방문 데이터의 실제 수집 — 공개 이후 별도 TASK
- A/B 테스트와 페이지 변형 실험 — 실행 계획 110행이 기준선 확보를 우선
- 임계값 기반 Go/No-Go 수치 설정 — 실행 계획 110행이 기준선 확인 전 금지
- MVP 제품 기능(앱·계정·건강데이터·개인화) — `ADR-20260814-002` 제외 범위이며 갱신이 선행
- 결제 수단 등록과 청구 정보 — 저장소 밖 소유자 작업

## Acceptance Criteria

이관 출처를 병기한다. 괄호 안이 TASK-0001에서의 원래 번호다.

- [ ] AC-01 (TASK-0001 AC-09): 월 비용 상한 금액, 상한 도달 감지 수단, 도달 시 유료 채널 중단 절차가 문서화되어 있고, 감지 수단의 동작을 실제로 확인한 기록이 있다.
- [ ] AC-02 (TASK-0001 AC-10): 실행 계획 84~93행 공개 전 체크 8개 항목 전부가 확인 결과와 확인일과 함께 체크 또는 미체크로 판정되어 있다.
- [ ] AC-03 (TASK-0001 AC-11): 공개 GO 또는 NO-GO 결론이 AC-02의 판정 결과를 근거로 `docs/decisions/`에 기록되어 있다.
- [ ] AC-04 (TASK-0001 AC-12): `waitlist_submit / landing_view`와 보조 지표 5종(CTA 클릭률, 선택 설문 완료율, 인터뷰 안내 수신 선택률, 채널별 획득비용, 확인 완료율 `waitlist_confirm / waitlist_submit`)을 산출하는 질의가 문서화되어 있고, 같은 입력에 같은 결과를 내는 것이 확인되었다.
- [ ] AC-05 (TASK-0001 AC-15): AWS 프로덕션 액세스 승인 상태가 기록되어 있고, 승인 전에는 대기자 발송이 불가능하다는 사실이 공개 판정에 반영되어 있다.
- [ ] AC-06: Sites 플랜 사용량 한도의 실제 수치, 소진 시 사이트·D1 쓰기 동작, 감지 가능 여부가 기록되어 있다. 감지 수단이 없으면 `감지 불가 — 수동 점검 주기 N일`로 명시되어 있다.
- [ ] AC-07: Worker 시크릿 주입 경로가 확인되어 기록되어 있거나, 확인 불가 사실과 그로 인해 등록이 503으로 거부된다는 결과가 공개 판정에 반영되어 있다.
- [ ] AC-08: 배포본에서 확인 메일 발송이 실제로 성공하는 것을 검증한 기록이 있다. 또는 미검증 사유가 `Not Run — 사유`로 남아 있고 공개 판정에 반영되어 있다.
- [ ] AC-09: 배포본에서 삭제 요청 실행 후 대상 행이 사라지는 것과, 삭제 경로 3개 중 실제로 동작하는 경로가 무엇인지 확인한 기록이 `docs/verification/`에 있다.
- [ ] AC-10: 배포본의 개인정보 안내가 명시하는 공급자·수집 항목·목적·보유 기간·삭제 방법이 실제 구현·플랫폼 사실과 일치하는지 검산한 기록이 있다.
- [ ] AC-11: `help.openai.com`·`openai.com/policies` 원문 대조 3건이 해소되어 있거나, 여전히 접근 불가라는 사실과 그 영향이 공개 판정에 명시되어 있다.
- [ ] AC-12: 실기기 또는 375×812·768×1024·1280×720 뷰포트에서 등록·확인·설문·삭제 전 흐름을 실행한 결과가 기록되어 있다.

## Dependencies

- **선행 TASK: TASK-0001** — 공개 게이트 구현이 `develop`에 병합되어 있어야 한다
- 외부 승인: AWS SES 프로덕션 액세스
- 외부 확인: ChatGPT Sites의 Worker 시크릿 주입 경로, 플랜 사용량 한도
- 배포: 공개 가능한 사이트가 존재해야 이 TASK의 대부분을 진행할 수 있다
- 환경: Node.js 22.13.0 이상, Wrangler 4.123.0

## Risks

- **진행 불가 위험 (최상위)**: Worker 시크릿 주입 경로가 존재하지 않으면 fail-closed 설계상 모든 등록이 503으로 거부된다. 이 경우 공개 자체가 불가능하며, 설계 변경이냐 플랫폼 변경이냐의 결정이 필요해진다. 이 TASK의 첫 확인 항목이어야 한다.
- 근거 위험: 레지던시·cron·비용 사실이 **2차 자료가 인용한 OpenAI 문서 문구**에 근거한다. `help.openai.com`과 `openai.com/policies`가 HTTP 403을 반환해 원문을 대조하지 못했다. 공개 판정의 근거 강도가 여기에 묶여 있다.
- 의무 이행 위험: 배포 플랫폼이 예약 작업을 지원하지 않을 수 있다. 삭제 경로 3개 중 실제로 동작하는 것이 무엇인지 배포 후에만 확인할 수 있으며, 셋 다 동작하지 않으면 개인정보 안내가 약속한 보존 기간과 실제가 어긋난다.
- 가용성 위험: Sites 플랜 한도 소진 시 **삭제 요청 처리까지 막힐 수 있다.** 등록만 막히는 것과 달리 이것은 개인정보 처리 의무 불이행이 된다.
- 판정 위험: 미확인 항목이 남은 상태에서 GO를 결론으로 쓰면 `CLAUDE.md` 절대 조건 5를 위반한다. NO-GO도 정상 완료다.
- 측정 위험: 지표 정의를 바꾸면 기존 검증 기록과 비교 불가능해진다. TASK-0001 WF-03이 `waitlist_submit`의 의미를 유지하고 `waitlist_confirm`을 신설한 결정을 그대로 승계한다.
- 문서 신뢰성 위험: 실행 계획 88행이 "Cloudflare D1의 1차 이벤트"로 체크되어 있으나 그 확인이 원격 D1에서 이뤄졌는지 로컬 D1에서만 이뤄졌는지 기록으로 판별할 수 없다. 재판정 대상이다.
- 과장 위험: 랜딩 반응을 제품 적합성·결제 의사·법적 적합성으로 과장하지 않는다(`ADR-20260814-002` 최소 운영 기준). 보증 수준은 창업자 자체 검토이며 독립 검증이 아니다(`ADR-20260814-001`).

## Rollback Strategy

- 코드: 이 TASK는 원칙적으로 문서와 설정 중심이다. `landing/worker/wrangler.jsonc` 등 설정을 변경하면 변경 전 값을 Workflow 문서 Change History에 기록한 뒤 적용하고, 되돌릴 때 그 값을 복원한다.
- 데이터베이스: 스키마 변경을 계획하지 않는다. 필요해지면 추가만 하는 신규 마이그레이션으로 처리하고 이미 적용된 파일을 수정하지 않는다.
- 공개 상태: 공개 후 문제 발생 시 **접근 제한을 소유자 전용으로 되돌리는 것이 1차 대응**이며 코드 롤백보다 우선한다.
- 판정: GO 판정 후 새 사실이 드러나면 판정을 철회하고 사유를 ADR에 남긴다. 철회 이력을 지우지 않는다.

## Step / Workflow Index

| Step | Workflow | Description | Status | Branch | PR | Dependency |
|---|---|---|---|---|---|---|
| STEP-01 | WF-01 | 비용 상한·중단 조건과 플랜 한도 확인 | Draft | workflow/TASK-0004-WF-01-cost-cap-observability | - | TASK-0001 병합 |
| STEP-02 | WF-02 | 공개 판정과 기준선 계측 | Draft | workflow/TASK-0004-WF-02-public-decision-baseline | - | WF-01 |

두 Workflow는 각각 TASK-0001의 WF-05·WF-06을 승계한다. **원래 번호를 재사용하지 않는다** — `docs/claude/01-task-workflow.md` §1이 폐기된 Workflow 번호의 재사용을 금지하므로, TASK-0004 안에서 새 번호를 부여했다.

배포 의존 검증(실제 SES 발송, 배포본 검산, 원문 대조, 실기기 QA)은 WF-02의 판정 입력이므로 WF-02에 포함한다. 진행 중 분량이 커지면 `docs/claude/01` §10에 따라 WF-03 이후로 분리한다.

## Steps

### STEP-01

| Field | Content |
|---|---|
| Step Name | 비용 상한과 중단 조건 확정 |
| Goal | 월 비용 상한 금액과 배분, 상한 도달 감지 수단, 도달 시 중단 절차가 문서화되고 감지 수단의 동작이 실제로 확인된다. Sites 플랜 한도의 실제 수치와 소진 시 동작이 기록된다. |
| Input | `ADR-20260814-001` 예산 상한 500,000원, `ADR-20260817-003`의 공급자 요금 구조, `docs/verification/fitpulse-landing-platform-data-handling-20260817.md` 항목 8의 비용 구조, `landing/worker/wrangler.jsonc`의 observability 설정 |
| Scope | 포함: 비용 요소 목록화, 상한 결정, 감지 수단 설정·확인, 중단 절차 문서화, Sites 플랜 한도 확인. 제외: 실제 유료 채널 집행, 결제 수단 등록, 공개 판정(WF-02) |
| Instructions | 1. Sites 플랜 사용량 한도를 제품 내부에서 확인하고 수치를 기록한다. 2. 한도 소진 시 사이트와 D1 쓰기가 어떻게 되는지, **삭제 요청 처리도 막히는지** 확인한다. 3. 비용 요소별 무료 한도와 초과 단가를 출처 URL·확인일과 함께 정리한다. 4. 월 상한 금액과 요소별 배분을 정한다. 5. 감지 수단을 설정하고 실제로 동작시켜 확인한다. 6. 중단 절차의 각 조작 경로를 실제 화면에서 확인한다. 7. 런북을 작성한다. |
| Output Format | `docs/runbooks/fitpulse-landing-cost-cap-and-stop.md` 신규. 비용 요소별 한도·단가(출처·확인일), 월 상한과 배분, 감지 수단과 감지 불가 항목의 수동 점검 주기, 중단 절차 3단계(유료 채널 중단 → 신규 등록 차단 → 소유자 전용 복귀)와 각 조작 방법, 감지 수단 동작 확인 기록 |
| Constraints | 결제·계좌·세금 식별자와 실제 청구 명세를 저장소에 남기지 않는다. 상한 금액과 배분 비율만 기록한다. 전체 상한 500,000원을 넘는 배분을 하지 않는다. 확인하지 않은 알림 동작을 완료로 주장하지 않는다. 감지 수단이 없는 항목은 `감지 불가 — 수동 점검 주기 N일`로 명시한다. 중단 절차에는 실제로 실행 가능한 조작만 적는다. |
| Done When | 런북이 작성되고, 감지 수단의 동작 확인 기록이 있으며, Sites 플랜 한도와 소진 시 동작(특히 삭제 요청 가능 여부)이 기록되었다. 미확인 항목은 사유와 함께 남아 있다. |
| Duration | Medium |
| RULE Reference | `CLAUDE.md` 절대 조건 1·5, `docs/README.md` "Git에 저장하지 않는 정보", `docs/claude/04-validation-checklists.md` |

### STEP-02

| Field | Content |
|---|---|
| Step Name | 배포 의존 검증 해소와 공개 판정 |
| Goal | TASK-0001에서 `Not Run`으로 남은 배포 의존 검증이 해소되고, 공개 전 체크 8개 항목이 전부 판정되며, GO/NO-GO 결론과 기준선 산출 질의가 기록된다. |
| Input | STEP-01의 런북, TASK-0001의 구현 결과와 미실행 검증 목록, 실행 계획 84~93행 체크 목록과 95~104행 기존 판정, 106~110행 측정 정의, `landing/db/schema.ts`의 `landing_events` 구조 |
| Scope | 포함: 실제 SES 발송 검증, 배포본 안내·삭제·보존 검산, 원문 대조 3건, 실기기 QA, 8개 항목 판정, GO/NO-GO ADR, 기준선 질의 문서화와 재현성 확인. 제외: 실제 공개 실행, 유료 채널 집행, 100개 방문 데이터 수집, 임계값 설정 |
| Instructions | 1. Worker 시크릿 주입 경로를 먼저 확인한다 — 불가하면 이후 검증 대부분이 성립하지 않으므로 즉시 보고하고 판정에 반영한다. 2. 배포본에서 등록 → 확인 메일 → 확인 완료 → 삭제 흐름을 실행하고 각 결과를 기록한다. 3. 삭제 경로 3개 중 실제 동작하는 것을 확인한다. 4. 원문 대조 3건을 재시도하고 결과를 기록한다. 5. 실기기 또는 지정 뷰포트에서 전 흐름을 확인한다. 6. 8개 항목을 각각 판정한다 — 2026-08-14의 체크는 승계하지 않는다. 7. 판정을 근거로 GO/NO-GO ADR을 작성한다. 8. 기준선 질의를 문서화하고 같은 입력에 2회 실행해 재현성을 확인한다. |
| Output Format | `docs/decisions/ADR-20260817-004-landing-public-release-decision.md`(8개 항목별 판정·확인 방법·확인일, GO/NO-GO 결론과 근거, NO-GO면 남은 조건과 다음 판정 시점, 보증 수준 명시), `docs/verification/fitpulse-landing-baseline-queries-YYYYMMDD.md`(지표별 질의, 유효 방문 정의와 제외 조건, 재현성 확인 결과), `docs/verification/`의 배포본 검산 기록, 갱신된 실행 계획과 `docs/README.md` |
| Constraints | 확인하지 않은 항목을 체크 완료로 표시하지 않는다. 미확인 항목이 남은 상태에서 GO를 결론으로 쓰지 않는다. 2026-08-14에 체크된 5개 항목도 재확인 대상이며 자동 승계하지 않는다. 랜딩 반응을 제품 적합성·결제 의사·법적 적합성으로 과장하지 않는다. 보증 수준을 창업자 자체 검토로 유지하고 독립 검증 완료를 주장하지 않는다. 5명 미만 소수 셀과 참가자별 원문을 문서에 남기지 않는다. 기준선 데이터가 없는 상태에서 임계값을 성공 기준처럼 쓰지 않는다. 지표 정의를 바꾸면 변경 전후 정의를 함께 남긴다. |
| Done When | 8개 항목이 전부 판정되고, GO/NO-GO ADR이 작성되고, 기준선 질의의 재현성이 확인되었다. 배포 의존 검증의 결과 또는 `Not Run — 사유`가 전부 기록되었다. |
| Duration | Large |
| RULE Reference | `CLAUDE.md` 절대 조건 5, `ADR-20260814-002` 최소 운영 기준, `ADR-20260814-001` 보증 수준, `docs/README.md` 산출물 위치 규칙, `docs/claude/04-validation-checklists.md` |

## Integration Validation

| Type | Command or Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 전체 통과 | 미실행 | Not Run — TASK 착수 전 |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run — TASK 착수 전 |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 취약점 0 | 미실행 | Not Run — TASK 착수 전 |
| CI | `.github/workflows/landing.yml` | Landing CI 통과 | 미실행 | Not Run — TASK 착수 전 |
| Manual | 배포본에서 등록·확인·설문·삭제 전 흐름 실행 | 각 단계 동작 확인 | 미실행 | Not Run — 배포 필요 |
| Manual | 배포본 삭제 요청 후 대상 행 부재 검산 | 대상 행 0건 | 미실행 | Not Run — 배포 필요 |
| Manual | 375×812·768×1024·1280×720 뷰포트 확인 | 기능·가로 넘침·키보드 순서 이상 없음 | 미실행 | Not Run — 배포 필요 |
| Manual | 기준선 질의 2회 실행 | 두 결과 일치 | 미실행 | Not Run — 데이터 필요 |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run — TASK 착수 전 |

## Definition of Done

- [ ] 모든 필수 Workflow(WF-01, WF-02)가 Done이다.
- [ ] 모든 Acceptance Criteria(AC-01~AC-12)가 검증되었다.
- [ ] 통합 및 회귀 테스트를 통과했다.
- [ ] 보안, 권한, 예외 처리를 검토했다.
- [ ] DB 호환성과 Rollback을 검토했다.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] Task PR 필수 CI가 통과했다.
- [ ] 필수 리뷰가 완료되었다.
- [ ] 해결되지 않은 리뷰 의견이 없다.
- [ ] 공개 판정이 GO든 NO-GO든 근거와 함께 기록되었다.
- [ ] 해소하지 못한 배포 의존 검증이 `Not Run — 사유`로 남아 있고 판정에 반영되었다.
