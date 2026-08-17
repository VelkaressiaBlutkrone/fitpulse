# TASK-0005: 제품 구축 단계 전환과 ADR 대체

## Metadata

| Field | Value |
|---|---|
| Task ID | TASK-0005 |
| Status | Ready |
| Priority | High |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Base Branch | develop |
| Task Branch | task/TASK-0005-product-build-stage |
| Merge Authority | Human-only |
| Decision References | `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md`, `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` |
| Rule References | `CLAUDE.md`, `docs/claude/01-task-workflow.md`, `docs/claude/02-git-operations.md`, `docs/claude/03-pr-review-merge.md`, `docs/claude/05-templates.md` |
| Dependencies | 없음 — 문서 변경만 수행하며 선행 TASK 없음 |
| Spec | `docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md` |

`Merge Authority`를 `Human-only`로 둔 것은 의도한 선택이다. 이 TASK는 `CLAUDE.md`(최상위 규칙 파일)와 단계 결정 ADR을 바꾼다. `docs/claude/01` §4의 기본값이 `Human-only`이고, 소유자가 TASK-0001·0003에 부여한 `Auto-after-checks`가 이 TASK로 자동 승계되지 않는다.

## Goal

`ADR-20260814-002`(랜딩 우선 사전 검증)를 새 ADR로 대체해 현재 단계를 `PREVALIDATION_LITE`에서 `PRODUCT_BUILD`로 전환하고, 그에 따라 어긋나게 되는 참조 문서와 규칙 파일을 정합화한다.

완료 시점에 다음이 성립한다.

- 제품 기능 개발의 착수를 막는 결정이 해소되어 있고, 무엇을 언제 시작할 수 있는지가 게이트로 정의되어 있다
- 랜딩 트랙의 운영 규칙이 대체된 문서가 아니라 유효한 문서에 있다
- `CLAUDE.md`의 빌드·테스트 명령이 저장소의 실제 상태와 일치한다
- 구축·운영 예산이 미정이라는 사실과 그동안의 금지 사항이 기록되어 있다

**이 TASK는 제품 코드를 작성하지 않는다.** `backend/`·`app/`·`admin/` 생성은 각각 별도 TASK이며 게이트 통과가 선행이다.

## Background

`ADR-20260814-002`는 회원 계정·인증, 건강·의료 응답 수집, 개인별 운동 추천, 결제, 앱스토어 출시를 현재 단계의 제외 범위로 두고 있다(27~33행). 제품 기능 개발이 이 목록에 정면으로 걸려 착수할 수 없다.

같은 문서 46~56행의 "정식 문서 체계 재개 조건"은 더 강한 제약이다. 위 다섯 가지 중 하나를 시작하기 전에 **"당시의 실제 공급자·계약·제품 흐름을 기준으로 운영, 개인정보, 보안, 예산과 출시 문서를 다시 작성하고 검토"** 하라고 요구한다. 즉 제외 목록만 지워서는 열리지 않는다.

2026-08-17 소유자가 네 가지를 결정했다. 각 결정에서 제시한 대안과 대가는 Spec 문서의 "소유자 결정 사항" 절에 기록되어 있다.

| 결정 | 내용 |
|---|---|
| 범위 | wiki v2 전체 범위 |
| 랜딩 | 대기자 모집으로 유지, 제품은 병렬 착수 |
| 갱신 방식 | 새 ADR로 대체 |
| 예산 | 공백으로 두고 G1 착수 전 결정 |

### 실측으로 확인한 저장소 사실

- 최상위 디렉터리는 `docs/`, `landing/`, `wiki/`뿐이다. `backend/`·`app/`·`admin/`은 **존재하지 않는다**
- `CLAUDE.md` 빌드·테스트 절(139~146행)은 `./gradlew test`·`flutter analyze`·`npm run build`를 적되 전부 "**Wiki 배포 가이드에 명시된** 검증 명령은"으로 출처를 밝히고, 146행이 "실행할 수 없는 빌드·테스트를 통과했다고 보고하지 않는다"로 못박는다. **결함이 아니다.** 다만 유일하게 존재하는 모듈 `landing/`이 이 절에 없고, 모듈별 존재 여부에 대한 사실 진술이 없다
- `wiki/README.md` 3행이 wiki를 "공개 역사 자료"로 규정하고 실행 기준이 아님을 명시한다
- 랜딩은 `develop`에 병합되었으나 소유자 전용이며 공개된 적이 없다. 기준선 지표가 없다

## Input

- `docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md` — **이 TASK의 Spec.** 산출물 5개와 각각의 변경 내용이 확정되어 있다
- `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` — 대체 대상. 최소 운영 기준 39~44행이 전사 원본
- `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md` — 보증 수준과 예산 상한의 성격
- `docs/README.md` — 갱신 대상
- `CLAUDE.md` — 갱신 대상
- `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md` — 참조 추가 대상
- `wiki/FitPulse_배포가이드_v2.0_20260813.md` — 스택 근거

## Scope

### Included

- `docs/decisions/ADR-20260817-005-product-build-stage.md` 신설
- `ADR-20260814-002`의 Status를 `SUPERSEDED`로 변경하고 승계 안내·이관 표기 추가
- `docs/README.md`의 단계 표기, 승인 상태, 다음 작업, 시작 위치 갱신
- `CLAUDE.md` 빌드·테스트 절에 모듈별 존재 여부와 `landing/` 검증 명령 **보완** (기존 문장 삭제 없음)
- `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md`의 Decision References에 ADR-005 추가
- `docs/HANDOFF-20260817.md`의 상태 표기를 완료로 변경 — **Spec 확정 후 추가된 항목(O-6)**

### Excluded

- `backend/`·`app/`·`admin/` 모듈 생성과 코드 작성 — 각각 별도 TASK, 게이트 통과가 선행
- wiki v2 요구사항·ERD·API의 실행본 작성 — 각 하위 프로젝트 착수 시
- G1~G5 게이트 산출물의 실제 작성 — 각 게이트 도달 시
- 구축·운영 예산 금액 결정 — 소유자, G1 착수 전
- 랜딩 공개 판정과 기준선 계측 — `TASK-0004`
- `wiki/` 문서 수정 — 역사 자료로 유지하며 이번에 손대지 않는다
- `docs/plans/`의 실행 계획과 `docs/design/`의 설계서 2건 — 랜딩 트랙 기준이며 유효하다
- `landing/` 코드·테스트 — 변경하지 않는다

## Acceptance Criteria

- [ ] AC-01: `docs/decisions/ADR-20260817-005-product-build-stage.md`가 존재하고 Spec의 "O-1. 새 ADR의 내용"이 규정한 9개 절(결정, 범위, 스택과 저장소 구조, 구축 순서, 게이트, 랜딩 트랙, 예산, 보증 수준, 이 결정의 한계)을 모두 포함한다.
- [ ] AC-02: ADR-005가 단계 이름을 `PRODUCT_BUILD`로 명시하고, `MVP` 표현을 단계 이름으로 사용하지 않는다.
- [ ] AC-03: ADR-005의 게이트 표가 G1~G5 각각에 대해 발동 시점과 착수 전 필수 산출물을 명시하고, "문서 작성 → 소유자 검토 → 판정 기록 → 착수" 절차를 규정한다.
- [ ] AC-04: ADR-005가 wiki v2를 "범위 정의의 입력"으로 규정하고 실행 기준으로 승격하지 않는다. `wiki/README.md`는 변경되지 않는다.
- [ ] AC-05: ADR-005에 옮겨 적은 랜딩 최소 운영 기준 6개가 `ADR-20260814-002` 39~44행과 **문자열 단위로 일치**한다. `diff` 결과가 무차이다.
- [ ] AC-06: ADR-005가 구축·운영 예산을 `미정`으로 기록하고, "결정 전까지 상시 비용이 발생하는 인프라를 프로비저닝하지 않는다"를 명시한다. **금액을 적지 않는다.**
- [ ] AC-07: ADR-005가 수요 데이터 없이 단계를 전환했다는 사실과 1인 자체 검토의 한계를 본문에 기록한다.
- [ ] AC-08: `ADR-20260814-002`의 Status가 `SUPERSEDED by ADR-20260817-005`이고, 최소 운영 기준 절에 이관 표기가 있으며, **본문이 삭제되지 않았다**.
- [ ] AC-09: ADR-005가 참조하는 모든 로컬 경로가 존재한다. 깨진 참조 0건.
- [ ] AC-10: `docs/README.md`의 단계 표기가 `PRODUCT_BUILD`이고, 제품·앱 구현 상태가 "구축 단계 진입, 코드 미착수, G1 통과 선행"으로 기술되며, 결제와 건강데이터 항목이 각각 G4·G2·G3 게이트와 연결되어 있다.
- [ ] AC-11: `docs/README.md`의 "시작 위치" 표에 ADR-005 행이 있고 ADR-002 행이 대체됨으로 표기된다.
- [ ] AC-12: `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md`의 Decision References에 `ADR-20260817-005`가 있다. TASK-0004의 Scope와 AC는 변경되지 않는다.
- [ ] AC-13: `CLAUDE.md` 빌드·테스트 절이 모듈별 존재 여부와 `landing/`의 실제 검증 명령을 명시하고, `backend/`·`app/`·`admin/`이 아직 생성되지 않았음과 신설 시 갱신 규칙을 담는다. 표의 명령은 `landing/package.json`·`.github/workflows/landing.yml`에서 확인한 것과 일치하며 추측이 없다.
- [ ] AC-14: `CLAUDE.md` 빌드·테스트 절의 **기존 6개 항목이 하나도 삭제되지 않는다.** `git diff CLAUDE.md`의 삭제 행이 0건이고, 특히 141행(사전 확인)과 146행(미실행 보고 금지)이 유지된다. `CLAUDE.md`의 다른 절은 변경되지 않는다.
- [ ] AC-15: `landing/`이 변경되지 않았고 `cd landing && npm test`가 21개 통과한다.
- [ ] AC-16: `docs/HANDOFF-20260817.md`의 Status가 완료를 나타내고, 그 문서가 최우선으로 지목한 과제 3건의 현재 상태가 대조표로 기록된다. **본문은 고쳐 쓰지 않는다** — 시점 기록이므로 `docs/claude/01` §13에 따라 보존한다.

## Dependencies

- 선행 TASK: 없음
- 선행 결정: 2026-08-17 소유자 결정 4건 (Spec의 "소유자 결정 사항" 절)
- 외부 의존: 없음. 이 TASK는 저장소 밖 자원을 필요로 하지 않는다
- 환경: Node.js 22.13.0 이상 (`landing/` 회귀 확인용)

## Risks

- **수요 근거 없는 단계 전환.** 랜딩이 공개되지 않아 기준선이 없다. 이 TASK는 그 사실을 ADR 본문에 기록하는 것으로 대응하며, 위험 자체를 해소하지 않는다. 해소는 소유자의 판단 영역이다.
- **예산 공백.** 상한이 미정인 채로 단계가 열린다. ADR에 "결정 전까지 상시 비용 인프라 미프로비저닝"을 넣어 통제하나, 그 문장을 지키는 것은 후속 TASK의 책임이다.
- **전사 오류.** 최소 운영 기준 6개를 옮겨 적는 과정에서 문구가 변형되면 랜딩 규칙이 조용히 바뀐다. AC-05가 `diff` 무차이를 요구해 막는다.
- **대체 표기 누락.** `ADR-20260814-002`를 참조하는 문서가 대체 사실을 모르면 낡은 결정을 근거로 판단하게 된다. WF-02에서 참조처를 점검한다.
- **최상위 규칙 파일 변경.** `CLAUDE.md` 수정은 이후 모든 작업의 판단 기준을 바꾼다. WF-03으로 분리해 독립 검토가 가능하게 했다.
- **게이트 우회 유인.** 구현 중 편의상 게이트를 건너뛸 유인이 생긴다. ADR이 판정의 TASK/HISTORY 기록을 의무화해 흔적을 남긴다. 강제 수단은 아니다.
- **문서만 바꾸는 TASK의 착시.** 이 TASK가 끝나도 제품은 한 줄도 만들어지지 않는다. Goal에 명시했다.

## Rollback Strategy

- 코드: 코드 변경이 없다. `landing/`을 포함해 실행 가능한 산출물을 건드리지 않는다
- 문서: 각 Workflow는 독립 PR로 Task Branch에 병합한다. 특정 Workflow만 되돌릴 때는 해당 병합 커밋을 `git revert -m 1`로 되돌린다
- Task 전체: Task PR의 병합 커밋을 `git revert -m 1`로 되돌리면 `ADR-20260814-002`가 다시 유효 결정이 되고 `PREVALIDATION_LITE`로 돌아간다
- 데이터베이스: 해당 없음 — 스키마·마이그레이션 변경 없음
- 설정: 해당 없음 — 빌드·배포 설정 파일을 변경하지 않음. `CLAUDE.md`는 규칙 문서이며 실행 설정이 아니다

## Step / Workflow Index

| Step | Workflow | Description | Status | Branch | PR | Dependency |
|---|---|---|---|---|---|---|
| STEP-01 | WF-01 | ADR-005 신설과 ADR-002 대체 표기 | Ready | workflow/TASK-0005-WF-01-adr-supersede | - | 없음 |
| STEP-02 | WF-02 | 참조 문서 정합화 (README, TASK-0004, 핸드오프) | Ready | workflow/TASK-0005-WF-02-reference-updates | - | WF-01 |
| STEP-02 | WF-03 | `CLAUDE.md` 빌드·테스트 절 보완 | Ready | workflow/TASK-0005-WF-03-claude-md-build-section | - | WF-01 |

WF-01과 WF-02·WF-03을 나눈 기준은 `docs/claude/01` §7의 "하나의 PR에서 리뷰 목적이 불명확해짐"이다. WF-01은 결정의 내용을, WF-02는 참조 정합성을, WF-03은 규칙 파일의 사실성을 각각 검토 대상으로 한다.

WF-02와 WF-03을 합치지 않은 이유는 리뷰 관점이 다르기 때문이다. `CLAUDE.md`는 이후 모든 작업의 판단 기준이므로, ADR 변경을 승인하면서 규칙 파일 변경은 거부할 수 있어야 한다.

WF-02와 WF-03은 서로 독립이며 병렬 진행할 수 있다. 둘 다 WF-01 병합 이후에 Branch를 만든다.

## Steps

### STEP-01

| Field | Content |
|---|---|
| Step Name | 단계 결정 대체 |
| Goal | `PRODUCT_BUILD` 단계와 게이트 체계를 정의한 ADR-005가 존재하고, `ADR-20260814-002`가 대체됨을 명시하되 본문은 이력으로 보존된다. |
| Input | Spec의 "O-1. 새 ADR의 내용"과 "O-2. `ADR-20260814-002` 변경", `ADR-20260814-002` 전문, `ADR-20260814-001`의 보증 수준·예산 성격 |
| Scope | 포함: ADR-005 작성, ADR-002 Status·승계 안내·이관 표기. 제외: 참조 문서 갱신(WF-02), `CLAUDE.md`(WF-03), 게이트 산출물 실제 작성 |
| Instructions | 1. Spec의 O-1이 규정한 9개 절 구조로 ADR-005를 작성한다. 2. 랜딩 최소 운영 기준 6개를 `ADR-20260814-002` 39~44행에서 **복사**해 넣는다. 손으로 다시 타이핑하지 않는다. 3. `diff`로 전사 일치를 확인한다. 4. ADR-005가 참조하는 모든 로컬 경로의 존재를 확인한다. 5. ADR-002의 Status를 변경하고 승계 안내와 이관 표기를 추가한다. 본문은 삭제하지 않는다. 6. `git diff --check`와 `landing/` 미변경을 확인한다. |
| Output Format | `docs/decisions/ADR-20260817-005-product-build-stage.md` 신규 1개, `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` 수정 |
| Constraints | 예산 금액을 적지 않는다(`CLAUDE.md` 절대 조건 1). 단계 이름에 `MVP`를 쓰지 않는다. `wiki/README.md`를 변경하지 않는다. ADR-002 본문을 삭제하지 않는다. 확인하지 않은 사실을 확정으로 적지 않는다. 004 번호를 사용하지 않는다 — `TASK-0004` WF-02가 예약했다. |
| Done When | AC-01~AC-09가 충족되고, 전사 `diff`가 무차이이며, 깨진 참조가 0건이고, 검증 결과가 기록되었다. |
| Duration | Medium |
| RULE Reference | `CLAUDE.md` 절대 조건 1·5, `docs/claude/05-templates.md`, `docs/README.md` 산출물 위치 규칙 |

### STEP-02

| Field | Content |
|---|---|
| Step Name | 참조와 규칙 정합화 |
| Goal | 단계 전환으로 어긋나게 된 문서가 새 결정과 저장소의 실제 상태에 일치하고, 낡은 결정을 근거로 판단할 여지가 없어진다. |
| Input | STEP-01의 ADR-005, Spec의 "O-3", "O-4", "O-5", `docs/README.md` 현재 내용, `CLAUDE.md` 빌드·테스트 절, `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md` |
| Scope | 포함: `docs/README.md` 갱신(WF-02), TASK-0004 참조 추가(WF-02), `CLAUDE.md` 빌드·테스트 절 정정(WF-03). 제외: `docs/plans/`·`docs/design/` 기존 문서, `wiki/`, TASK-0004의 Scope·AC |
| Instructions | 1. WF-01 병합 후 Task Branch를 최신화하고 각 Workflow Branch를 만든다. 2. WF-02에서 `docs/README.md`의 단계·승인 상태·다음 작업·시작 위치를 갱신한다. 3. WF-02에서 `ADR-20260814-002`를 참조하는 모든 문서를 검색해 대체 사실을 알 수 있는지 점검하고 결과를 기록한다. 4. WF-02에서 TASK-0004의 Decision References에 ADR-005를 추가한다. 5. WF-03에서 `CLAUDE.md` 빌드·테스트 절을 저장소의 실제 모듈 상태로 정정하고 기존 단서 문장을 유지한다. 6. 각 Workflow에서 `git diff --check`와 `landing/` 미변경을 확인한다. |
| Output Format | 수정된 `docs/README.md`, `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md`, `CLAUDE.md`. 참조처 점검 결과는 각 Workflow 문서의 Validation에 기록 |
| Constraints | TASK-0004의 Scope와 Acceptance Criteria를 변경하지 않는다. `CLAUDE.md`의 기존 단서 문장을 삭제하지 않는다. 존재하지 않는 모듈의 명령을 실행 가능한 것처럼 남기지 않는다. 랜딩 관련 결론(소유자 전용, 공개 NO-GO)은 사실이 바뀌지 않았으므로 유지한다. |
| Done When | AC-10~AC-15가 충족되고, `ADR-20260814-002` 참조처 점검 결과가 기록되었으며, `landing/` 회귀 확인이 통과했다. |
| Duration | Small |
| RULE Reference | `CLAUDE.md` 절대 조건 1·5, `CLAUDE.md` Document placement, `docs/claude/01-task-workflow.md` §7 |

## Integration Validation

| Type | Command or Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |
| Document | ADR-005 참조 로컬 경로 존재 확인 | 깨진 참조 0건 | 미실행 | Not Run |
| Document | 최소 운영 기준 6개 전사 `diff` | 무차이 | 미실행 | Not Run |
| Document | `grep -rn "ADR-20260814-002" docs/` 로 참조처 점검 | 대체 사실을 알 수 없는 참조 0건 | 미실행 | Not Run |
| Regression | `cd landing && npm test` | 21개 통과 | 미실행 | Not Run |
| Regression | `git diff --stat origin/develop...HEAD -- landing/` | 변경 0건 | 미실행 | Not Run |
| CI | `.github/workflows/landing.yml` | Landing CI 통과 또는 미트리거 | 미실행 | Not Run |

`landing/`을 변경하지 않으므로 Landing CI는 `pull_request` 경로 필터에 걸리지 않아 트리거되지 않을 수 있다. 그 경우 `N/A — 경로 미해당`으로 기록한다. `npm test`를 실행하는 이유는 이 TASK가 `landing/`을 건드리지 않았음을 증명하기 위해서다.

## Definition of Done

- [ ] 모든 필수 Workflow(WF-01, WF-02, WF-03)가 Done이다.
- [ ] 모든 Acceptance Criteria(AC-01~AC-15)가 검증되었다.
- [ ] 통합 및 회귀 테스트를 통과했다.
- [ ] 보안, 권한, 예외 처리를 검토했다. — 코드 변경이 없으므로 저장 금지 정보 미포함 확인으로 갈음한다.
- [ ] DB 호환성과 Rollback을 검토했다. — DB 변경 없음. Rollback은 `git revert -m 1`.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] Task PR 필수 CI가 통과했거나 `N/A — 경로 미해당`으로 기록되었다.
- [ ] 필수 리뷰가 완료되었다.
- [ ] 해결되지 않은 리뷰 의견이 없다.
- [ ] 미완료 작업이 별도 TASK로 분리되었다. — `backend/`·`app/`·`admin/` 생성과 게이트 산출물.
- [ ] 예산 금액이 문서에 임의로 기입되지 않았다.
