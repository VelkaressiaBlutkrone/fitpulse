# WF-01: 공급자·데이터 처리 사실 확인과 선정

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-01 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-01 |
| Status | Draft |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-01-provider-selection |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | 없음 |
| Affected Paths | `docs/decisions/ADR-20260817-003-landing-public-providers.md` (신규) |
| Decision References | `ADR-20260814-002`, `ADR-20260814-001` |
| Rule References | `CLAUDE.md` 절대 조건 1, `docs/README.md` "Git에 저장하지 않는 정보" |

## Goal

이메일 확인·발송 공급자와 공개 트래픽 남용 방어 수단을 선정하고, 이메일·설문·이벤트 데이터의 실제 처리 국가, 수탁 범위, 로그·백업 보존 기간을 출처와 확인일과 함께 ADR에 기록한다. 후속 Workflow가 추측 없이 구현할 수 있는 확정 입력을 만든다.

## Input

- TASK-0001 STEP-01
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 104행 — NO-GO 3조건
- `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md` — 예산 상한 500,000원
- `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` — 제외 범위와 최소 운영 기준
- `landing/worker/wrangler.jsonc` — 현재 D1 바인딩과 observability 설정
- `landing/db/schema.ts` — 현재 저장 테이블
- Cloudflare D1·Workers 공식 문서, 이메일 발송 공급자 공식 문서

## Scope

### Included

- 이메일 발송 공급자 후보 비교와 선정
- 남용 방어 수단 후보 비교와 선정
- Cloudflare D1 데이터 위치, Workers 로그 보존 기간, D1 백업 보존 기간 확인
- 선정 공급자의 데이터 처리 국가와 수탁 범위 확인
- 실제 D1 `database_id` 확인
- 선정 결과와 근거의 ADR 작성

### Excluded

- 코드 변경 — WF-02, WF-03, WF-05에서 처리
- 개인정보 안내 문구 갱신 — WF-04에서 처리
- 계약 체결, 결제 수단 등록, API 키 발급 — 저장소 밖 소유자 작업
- 비용 상한 감지 구현 — WF-05에서 처리

## Preconditions

- Task Branch `task/TASK-0001-landing-public-gate`가 존재한다.
- Cloudflare 계정에 접근할 수 있다.

## Constraints

- 확인하지 못한 사실을 확정 사실로 기록하지 않는다. 미확인 항목은 `미확인 — 사유`로 남긴다.
- 공급자 공식 문서 또는 대시보드 실제 값만 근거로 인정한다. 블로그·2차 자료를 단독 근거로 쓰지 않는다.
- 예산 상한 500,000원을 넘는 요금제를 선정하지 않는다.
- 계약서 원문, 서명, 결제·계좌 식별자, 실제 API 키, 저장소 실경로를 문서에 남기지 않는다.
- 남용 방어 수단은 서버 측 검증이 가능한 것만 후보로 인정한다.
- `ADR-20260814-002` 제외 범위(계정·결제·건강데이터·개인화)를 전제로 하는 공급자 기능을 선정 근거로 쓰지 않는다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | - | - |
| 03 | ERD / 데이터 | No | N/A — 이 Workflow는 스키마를 변경하지 않음 | - | - |
| 04 | API Contract | No | N/A — 외부 공급자 API 선정만 하고 연동은 WF-03 | - | - |
| 05 | DTO | No | N/A — 코드 변경 없음 | - | - |
| 06 | Domain | No | N/A — 코드 변경 없음 | - | - |
| 07 | Service | No | N/A — 코드 변경 없음 | - | - |
| 08 | Controller | No | N/A — 코드 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 코드 변경 없음 | - | - |
| 10 | Test | No | N/A — 코드 변경이 없어 자동 테스트 대상이 없음. 검증은 문서 대조로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

## Expected Output

- `docs/decisions/ADR-20260817-003-landing-public-providers.md` — 다음을 포함한다.
  - 이메일 발송 공급자 후보 비교표: 데이터 처리 리전, 무료·유료 한도, 수탁 계약 가능 여부, 월 예상 비용
  - 남용 방어 수단 후보 비교표: 서버 측 검증 가능 여부, 비용, 개인정보 전송 범위
  - 선정 결과와 근거, 배제한 대안과 배제 이유
  - Cloudflare D1 데이터 위치, Workers 로그 보존 기간, D1 백업 보존 기간 (출처 URL, 확인일)
  - 선정 공급자의 데이터 처리 국가와 수탁 범위 (출처 URL, 확인일)
  - 미확인 항목 목록과 사유
- TASK-0001 Step / Workflow Index 갱신
- HISTORY.md 갱신

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |
| Manual | ADR의 각 사실 항목에 출처 URL과 확인일이 있는지 항목별 대조 | 누락 0건 | 미실행 | Not Run |
| Manual | 실행 계획 104행의 3조건 각각이 ADR에서 확정 또는 미확인으로 판정되었는지 대조 | 3건 모두 판정됨 | 미실행 | Not Run |
| Manual | ADR에 계약·서명·결제 식별자·API 키가 포함되지 않았는지 확인 | 0건 | 미실행 | Not Run |
| Manual | 선정 요금제 월 비용 합계가 예산 상한 500,000원 이내인지 계산 | 이내 | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료 — ADR 작성됨
- [ ] 관련 테스트 작성 및 실행 — N/A, 코드 변경 없음. 문서 대조 검증으로 대체하고 결과를 기록함
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토 — 저장 금지 정보 미포함 확인
- [ ] 문서와 HISTORY 갱신
- [ ] CI — N/A. `.github/workflows/landing.yml`은 `landing/**`과 자기 자신 경로에만 반응한다. 이 Workflow는 `docs/`만 변경하므로 Landing CI가 트리거되지 않는다. 트리거되지 않은 것을 통과로 기록하지 않는다
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성 |
