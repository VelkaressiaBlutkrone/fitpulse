# WF-06: 공개 판정과 기준선 계측

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-06 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-03 |
| Status | Draft |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-06-public-decision-baseline |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-02, WF-03, WF-04, WF-05 |
| Affected Paths | `docs/decisions/ADR-20260817-004-landing-public-release-decision.md`(신규), `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md`, `docs/verification/`(신규), `docs/README.md` |
| Decision References | `ADR-20260814-002`, `ADR-20260814-001`, WF-01 산출 ADR |
| Rule References | `CLAUDE.md` 절대 조건 5, `ADR-20260814-002` 최소 운영 기준, `docs/README.md` 산출물 위치 규칙 |

## Goal

실행 계획 84~93행의 공개 전 체크 8개 항목 전부를 실제 확인 결과와 확인일과 함께 판정하고, 그 판정을 근거로 공개 GO 또는 NO-GO 결론을 ADR에 기록한다. 초기 100개 유효 방문 기준선 지표를 재현 가능한 질의로 산출할 수 있게 한다.

이 Workflow는 GO를 목표로 하지 않는다. 확인 결과가 NO-GO를 지지하면 NO-GO로 완료한다.

## Input

- WF-01 산출 ADR — 공급자와 데이터 처리 사실
- WF-02 병합 결과 — 남용 방어 서버 검증
- WF-03 병합 결과 — 이메일 확인 흐름과 `waitlist_submit` 의미 결정
- WF-04 병합 결과 — 정합화된 개인정보 안내와 삭제 검산 기록
- WF-05 병합 결과 — 비용 상한 런북과 감지 수단 확인 기록
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 84~93행 체크 목록, 95~104행 기존 판정, 106~110행 측정 정의
- `landing/db/schema.ts`의 `landing_events` 구조

## Scope

### Included

- 공개 전 체크 8개 항목 각각의 재판정과 근거·확인일 기록
- 공개 GO/NO-GO ADR 작성
- 실행 계획 95~104행의 기존 판정 기록 갱신
- 주 지표 `waitlist_submit / landing_view` 산출 질의 문서화
- 보조 지표 산출 질의 문서화: CTA 클릭률, 선택 설문 완료율, 인터뷰 안내 수신 선택률, 채널별 획득비용
- WF-03이 추가한 확인 완료율 `waitlist_confirm / waitlist_submit` 질의 추가
- 질의 재현성 확인 — 같은 입력에 같은 결과
- `docs/README.md`의 "현재 결론"과 "다음 작업" 갱신

### Excluded

- 실제 공개 실행 — 판정이 GO여도 실행은 소유자의 별도 결정
- 유료 채널 집행 — 별도 결정
- A/B 테스트와 페이지 변형 — 실행 계획 110행이 기준선 확보를 우선
- 100개 유효 방문 데이터의 실제 수집 — 공개 이후 별도 TASK
- 임계값 기반 Go/No-Go 수치 설정 — 실행 계획 110행이 기준선 확인 전 금지

## Preconditions

- WF-02, WF-03, WF-04, WF-05의 PR이 Task Branch에 모두 병합되었다.
- Task Branch에서 `npm test`, `npm run lint`, `npm audit --omit=dev --audit-level=high`가 통과한다.

## Constraints

- 확인하지 않은 항목을 체크 완료로 표시하지 않는다(`CLAUDE.md` 절대 조건 5).
- 미확인 항목은 `미확인 — 사유`로 남기고, 그 상태에서 GO를 결론으로 쓰지 않는다.
- 랜딩 반응을 제품 적합성·결제 의사·법적 적합성으로 과장하지 않는다.
- 검증 보증 수준을 창업자 자체 검토로 유지하고, 독립 검증 완료를 주장하지 않는다(`ADR-20260814-001`).
- 5명 미만 소수 셀과 참가자별 원문을 문서에 남기지 않는다.
- 기준선 데이터가 없는 상태에서 임계값을 성공 기준처럼 쓰지 않는다.
- 지표 정의를 바꿀 경우 변경 전후 정의를 함께 남겨 기존 기록과의 비교 가능성을 보존한다.

## 판정 대상 8개 항목

`docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 84~93행 기준이다.

| # | 항목 | 2026-08-14 상태 | 판정 근거 Workflow |
|---|---|---|---|
| 1 | 실제 도메인과 호스팅 경로 확정 | 체크됨 (소유자 전용 검증 URL) | WF-01 — 공개 시 경로가 바뀌면 재확인 |
| 2 | 실제 이메일 저장 공급자와 데이터 위치 확인 | 미체크 | WF-01 |
| 3 | 실제 분석 공급자와 수집 속성 확인 | 체크됨 (Cloudflare D1 1차 이벤트) | WF-01, WF-03 — `waitlist_confirm` 추가분 반영 |
| 4 | 개인정보 안내의 공급자·목적·보유 기간·삭제 방법 일치 | 미체크 | WF-04 |
| 5 | 테스트 이메일 등록·중복 처리·삭제 확인 | 체크됨 | WF-03, WF-04 — 확인 흐름 추가 후 재확인 |
| 6 | 모바일 실기기 또는 동등 브라우저 뷰포트 확인 | 체크됨 | WF-02, WF-03 — 방어 위젯·확인 화면 추가 후 재확인 |
| 7 | 분석 이벤트에서 개인식별자 미수집 확인 | 체크됨 | WF-02, WF-03 — 토큰·이메일 경계 재확인 |
| 8 | 비용 상한과 유료 채널 중단 조건 확인 | 미체크 | WF-05 |

2026-08-14에 체크된 5개 항목도 WF-02·WF-03이 새 요청 경로와 화면을 추가하므로 **재확인 대상**이다. 이전 체크 상태를 근거로 자동 승계하지 않는다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없이 질의만 작성 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 판정과 질의 문서화이며 애플리케이션 코드 변경이 없음. 검증은 질의 재현 실행으로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

## Expected Output

- `docs/decisions/ADR-20260817-004-landing-public-release-decision.md`
  - 8개 항목별 판정: 확인됨 / 미확인 — 사유, 각각 확인 방법과 확인일
  - GO 또는 NO-GO 결론과 근거
  - NO-GO인 경우 남은 조건과 다음 판정 시점
  - 보증 수준 명시: 창업자 자체 검토, 독립 검증 아님
- `docs/verification/fitpulse-landing-baseline-queries-YYYYMMDD.md`
  - 지표별 산출 질의 (`landing_events` 기준)
  - 유효 방문의 정의와 제외 조건
  - 재현성 확인 결과 (같은 입력 2회 실행 결과 일치 여부)
  - 채널별 획득비용 산출에 필요한 입력과 그 출처
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` — 체크 목록과 판정 기록 갱신, 측정 정의에 `waitlist_confirm` 반영
- `docs/README.md` — "현재 결론"과 "다음 작업" 갱신
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 전체 통과 | 미실행 | Not Run |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 0 | 미실행 | Not Run |
| Manual | 8개 항목 각각에 확인 방법과 확인일이 기록되었는지 대조 | 누락 0건 | 미실행 | Not Run |
| Manual | 미확인 항목이 있는데 GO 결론이 아닌지 확인 | 모순 0건 | 미실행 | Not Run |
| Manual | 기준선 질의를 로컬 D1 표본 데이터에 2회 실행 | 두 결과 일치 | 미실행 | Not Run |
| Manual | 375×812·768×1024·1280×720에서 등록·확인·설문·삭제 전 흐름 재확인 | 기능·가로 넘침·키보드 순서 이상 없음 | 미실행 | Not Run |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |
| Document | 산출 문서에 5명 미만 소수 셀·참가자 원문 미포함 확인 | 0건 | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — N/A, 애플리케이션 코드 변경 없음. 질의 재현 실행으로 대체하고 결과를 기록함
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토
- [ ] 문서와 HISTORY 갱신
- [ ] CI — `docs/`만 변경하면 Landing CI가 트리거되지 않는다. 그 경우 `N/A — 경로 미해당`으로 기록하고, Task PR 단계에서 Task Branch 전체에 대해 CI 통과를 확인한다
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신
- [ ] 8개 항목 전부가 판정되었고, 판정과 결론이 모순되지 않음

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성 |
