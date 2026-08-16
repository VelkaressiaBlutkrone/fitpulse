# WF-05: 비용 상한·중단 조건과 운영 계측

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-05 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Draft |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-05-cost-cap-observability |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `landing/worker/wrangler.jsonc`, `docs/runbooks/fitpulse-landing-cost-cap-and-stop.md`(신규), `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` |
| Decision References | `ADR-20260814-001` 예산 상한 500,000원, `ADR-20260814-002`, WF-01 산출 ADR |
| Rule References | `docs/README.md` "Git에 저장하지 않는 정보", `docs/claude/04-validation-checklists.md` |

## Goal

랜딩 공개로 발생하는 종량 비용의 월 상한을 정하고, 상한 도달을 감지하는 수단을 마련하며, 도달 시 유료 채널을 중단하는 절차를 문서화한다. 실행 계획 84~93행의 "비용 상한과 유료 채널 중단 조건 확인" 항목을 판정 가능한 상태로 만든다.

## Input

- `ADR-20260814-001` — 전체 검증 예산 상한 500,000원
- WF-01 산출 ADR — 선정된 이메일 발송·남용 방어 공급자의 요금 구조
- `landing/worker/wrangler.jsonc` — 현재 observability 설정 (`logs.head_sampling_rate` 0.1, `traces.head_sampling_rate` 0.01)
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 84~93행 — 공개 전 체크 목록
- Cloudflare Workers·D1 요금 문서

## Scope

### Included

- 비용 발생 요소 목록화: Workers 요청, D1 읽기·쓰기·저장, 이메일 발송 건수, 남용 방어 검증 건수, 유료 채널 집행비
- 월 비용 상한 금액 결정과 근거 (500,000원 전체 상한 내 배분)
- 상한 도달 감지 수단 결정과 설정 (Cloudflare 알림, 공급자 알림, 수동 점검 주기 중 실제 동작하는 것)
- 감지 수단의 동작 실제 확인
- 상한 도달 시 유료 채널 중단과 서비스 축소 절차 문서화
- 무료 한도 초과 시점 추정과 그 근거
- 실행 계획의 해당 체크 항목 갱신 근거 제공

### Excluded

- 공급자 선정 — WF-01
- 방어·확인 구현 — WF-02, WF-03
- 개인정보 안내 갱신 — WF-04
- 공개 판정 — WF-06
- 실제 유료 채널 집행 — 공개 이후 별도 결정
- 결제 수단 등록과 청구 정보 — 저장소 밖 소유자 작업

## Preconditions

- WF-01의 PR이 Task Branch에 병합되어 공급자와 요금 구조가 확정되었다.
- Cloudflare 계정의 청구·알림 설정에 접근할 수 있다.

## Constraints

- 결제·계좌·세금 식별자, 실제 청구 금액 명세를 저장소에 남기지 않는다. 상한 금액과 배분 비율만 기록한다.
- 확인하지 않은 공급자 알림 동작을 완료로 주장하지 않는다. 알림을 실제로 발생시키거나 설정 화면을 확인한 근거를 남긴다.
- 전체 상한 500,000원을 넘는 배분을 하지 않는다.
- 감지 수단이 없는 항목은 "감지 불가 — 수동 점검 주기 N일"로 명시한다. 감지되는 것처럼 쓰지 않는다.
- 중단 절차는 실제로 실행 가능한 조작만 적는다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 변경하지 않음 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 설정과 운영 절차 변경이며 자동 테스트 대상 코드 경로가 없음. 검증은 설정 확인과 알림 동작 확인으로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

## Expected Output

- `docs/runbooks/fitpulse-landing-cost-cap-and-stop.md` — 다음을 포함한다.
  - 비용 발생 요소별 무료 한도와 초과 단가 (출처 URL, 확인일)
  - 월 상한 금액과 요소별 배분
  - 요소별 감지 수단과 감지 불가 항목의 수동 점검 주기
  - 상한 도달 시 중단 절차: 유료 채널 중단 → 신규 등록 차단 → 소유자 전용 복귀 순서와 각 조작 방법
  - 감지 수단 동작 확인 기록 (확인 방법, 확인일)
- `landing/worker/wrangler.jsonc` — observability 설정을 비용·관측 균형에 맞게 조정한 경우 그 변경과 변경 전 값 기록
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` — 비용 상한 체크 항목 갱신 (판정은 WF-06에서 종합)
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Manual | 요소별 단가·무료 한도에 출처 URL과 확인일이 있는지 대조 | 누락 0건 | 미실행 | Not Run |
| Manual | 요소별 배분 합계 계산 | 500,000원 이내 | 미실행 | Not Run |
| Manual | 상한 감지 알림 설정 화면 확인 또는 테스트 알림 수신 | 설정 확인됨 또는 알림 수신됨 | 미실행 | Not Run |
| Manual | 중단 절차의 각 조작을 실제 화면에서 경로 확인 | 모든 조작 경로 존재 | 미실행 | Not Run |
| Test | `cd landing && npm test` | 회귀 없음 (설정 변경 시) | 미실행 | Not Run |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |
| Document | 문서에 결제·계좌·세금 식별자 미포함 확인 | 0건 | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료 — 런북 작성됨
- [ ] 관련 테스트 작성 및 실행 — N/A, 자동 테스트 대상 코드 경로 없음. 설정·알림 확인으로 대체하고 결과를 기록함
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토 — 저장 금지 정보 미포함 확인
- [ ] 문서와 HISTORY 갱신
- [ ] CI — `landing/worker/wrangler.jsonc`를 변경하면 Landing CI가 트리거되므로 통과를 확인한다. `docs/`만 변경하면 `N/A — 경로 미해당`으로 기록한다
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신
- [ ] 감지 불가 항목이 감지 가능한 것처럼 기록되지 않았음

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성 |
