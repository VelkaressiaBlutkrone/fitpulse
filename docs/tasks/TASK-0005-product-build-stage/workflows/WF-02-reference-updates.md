# WF-02: 참조 문서 정합화

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-02 |
| Parent Task | TASK-0005 |
| Parent Step | STEP-02 |
| Status | Ready |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0005-product-build-stage |
| Branch | workflow/TASK-0005-WF-02-reference-updates |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `docs/README.md`, `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md` |
| Decision References | `ADR-20260817-005`(WF-01 산출), `ADR-20260814-002` |
| Rule References | `CLAUDE.md` 절대 조건 1·5, `docs/claude/01-task-workflow.md` §13 |
| Spec | `docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md` — O-3, O-5 |

## Goal

단계 전환으로 어긋나게 된 진입점 문서가 새 결정과 일치하고, 낡은 결정이나 해소된 과제를 근거로 다음 작업이 시작될 여지를 없앤다.

## Input

- WF-01 산출물 `ADR-20260817-005`
- Spec의 "O-3. `docs/README.md` 변경", "O-5. `TASK-0004` 변경"
- `docs/README.md` — "현재 결론", "시작 위치", "다음 작업"
- `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md` — Metadata

## Scope

### Included

- `docs/README.md`의 단계 표기, 승인 상태, 다음 작업, 시작 위치 갱신
- `TASK-0004`의 Decision References에 `ADR-20260817-005` 추가
- `ADR-20260814-002` 참조처 점검과 결과 기록

### Excluded

- ADR 작성·대체 표기 — WF-01
- `CLAUDE.md` 정정 — WF-03
- `TASK-0004`의 Scope·Acceptance Criteria — 랜딩 트랙은 이번 전환의 영향을 받지 않는다
- `TASK-0001`·`TASK-0003`의 문서 — 완료된 TASK의 이력이며 고쳐 쓰지 않는다
- `docs/plans/`·`docs/design/`의 기존 문서 — 랜딩 트랙 기준이며 유효하다
- `docs/verification/` — 확인 시점의 사실 기록이다
- `wiki/` — 역사 자료
- `landing/` — 변경하지 않는다
- **`docs/HANDOFF-20260817.md` (구 O-6)** — 2026-08-17 세션 핸드오프 작업으로 옮겼다. 아래 "구 O-6이 이 Workflow를 떠난 경위" 참조

## Preconditions

- WF-01의 PR이 Task Branch에 병합되어 `ADR-20260817-005`가 존재한다
- Task Branch가 최신이며 미커밋 변경이 없다

## Constraints

- **참조처 25개를 일괄 수정하지 않는다.** 대부분이 완료된 TASK의 이력 기록이며, `docs/claude/01` §13은 이력의 임의 재작성을 금지한다. 대체 사실은 `ADR-20260814-002` 파일 자체의 머리말이 전달한다
- **`TASK-0004`의 Scope와 Acceptance Criteria를 변경하지 않는다.** Metadata의 Decision References만 추가한다
- 랜딩 관련 결론(소유자 전용, 공개 NO-GO)은 사실이 바뀌지 않았으므로 유지한다
- `landing/`을 변경하지 않는다

## 구 O-6이 이 Workflow를 떠난 경위

계획 수립 중 `ADR-20260814-002` 참조처를 실측하다 `docs/HANDOFF-20260817.md`를 발견했다. 그 문서는 `Status: ACTIVE — 다음 세션이 이 문서부터 읽는다`로 시작하면서 이미 해소된 `develop` CI 실패를 최우선 과제로 적고 있어, 그대로 두면 다음 세션이 해결된 문제를 착수한다. Spec에 없던 항목이지만 O-6으로 추가했었다.

그러나 같은 세션에서 소유자가 **"핸드오프 기재 → 다음 세션 이관"**을 지시해 새 세션 핸드오프를 작성하게 되었고, 옛 핸드오프의 상태 표기는 그 작업에 자연스럽게 포함되었다. 두 곳에서 같은 파일을 건드리면 이 Workflow가 실행될 때 이미 끝난 일을 다시 하게 되므로 여기서 제외했다.

**이 Workflow를 실행하기 전에 확인할 것**

```bash
head -5 docs/HANDOFF-20260817.md
```

Status가 이미 완료·대체를 나타내면 그대로 진행한다. 여전히 `ACTIVE`이면 핸드오프 작업이 병합되지 않은 것이므로, 이 Workflow의 Scope에 되돌리고 TASK와 AC를 먼저 갱신한다.

## 실행 절차

### 1단계 — Branch 생성

```bash
git fetch origin --prune
git switch task/TASK-0005-product-build-stage
git pull --ff-only origin task/TASK-0005-product-build-stage
git log -1 --oneline    # WF-01 병합 커밋이 보여야 한다
ls docs/decisions/ADR-20260817-005-product-build-stage.md
git switch -c workflow/TASK-0005-WF-02-reference-updates
```

기대: ADR-005 파일이 존재한다. 없으면 WF-01이 아직 병합되지 않은 것이므로 중단한다.

### 2단계 — `docs/README.md` 갱신

"현재 결론" 절에서 다음을 수정한다.

| 현재 | 변경 후 |
|---|---|
| `현재 단계: **PREVALIDATION_LITE — 랜딩과 비민감 수요 데이터 수집 우선**` | `현재 단계: **PRODUCT_BUILD — 제품 구축. 랜딩은 대기자 모집으로 병행**` |
| `제품·앱 구현: **아직 진행하지 않음**` | `제품·앱 구현: **구축 단계 진입. 코드 미착수이며 G1 통과가 선행 조건**` |
| `결제·예약금 수집: **승인되지 않음**` | `결제·예약금 수집: **G4 통과 전까지 승인되지 않음**` |
| `건강·의료·웨어러블 데이터 수집과 개인화 추천: **승인되지 않음**` | `건강·의료·웨어러블 데이터 수집과 개인화 추천: **G2·G3 통과 전까지 승인되지 않음**` |

랜딩 관련 두 행(소유자 전용 검증본, 공개 NO-GO)은 **유지한다.** 사실이 바뀌지 않았다.

"시작 위치" 표에 행을 추가하고 기존 행을 수정한다.

```markdown
| [제품 구축 단계 결정](./decisions/ADR-20260817-005-product-build-stage.md) | Decision | 현재 단계, 구축 순서, 게이트 G1~G5 | 승인됨; 현재 최우선 기준 |
```

기존 `ADR-20260814-002` 행의 "현재 상태" 열을 `승인됨; 현재 최우선 기준`에서 `ADR-20260817-005로 대체됨; 이력 참조`로 바꾼다.

"다음 작업" 목록을 구축 순서와 게이트에 맞게 재작성한다. 기존 5개 항목 중 랜딩 관련(1~4)은 `TASK-0004`로 넘어갔음을 명시하고, 제품 구축 순서 1~5를 추가한다.

### 3단계 — `TASK-0004` 참조 추가

`docs/tasks/TASK-0004-landing-public-release-decision/TASK.md`의 Metadata에서 Decision References 행에 `ADR-20260817-005`를 추가한다.

```bash
grep -n "Decision References" docs/tasks/TASK-0004-landing-public-release-decision/TASK.md
```

Scope·Acceptance Criteria·Step/Workflow Index는 건드리지 않는다.

```bash
git diff docs/tasks/TASK-0004-landing-public-release-decision/TASK.md
```

기대: Metadata 1행만 변경.

### 4단계 — 참조처 점검

```bash
grep -rln "ADR-20260814-002" --include="*.md" . | grep -v "^./wiki/" | wc -l
head -8 docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md
```

확인할 것: 참조를 따라 `ADR-20260814-002`를 열었을 때 **머리말 8행 안에서 대체 사실을 알 수 있는가.** WF-01이 넣은 승계 안내가 그 역할을 한다.

일괄 수정하지 않는 판단과 점검 결과를 아래 Validation 표에 기록한다.

### 5단계 — 검증

```bash
git diff --check; echo "CHECK_EXIT:$?"
git diff --stat -- landing/    # 비어 있어야 한다
git diff --stat -- docs/tasks/TASK-0004-landing-public-release-decision/
cd landing && npm test 2>&1 | tail -8; cd ..
```

기대: `CHECK_EXIT:0`, `landing/` 변경 0건, TASK-0004는 `TASK.md` 1파일만 변경, `tests 21 / pass 21 / fail 0`.

### 6단계 — Commit, Push, PR

```bash
git add docs/README.md docs/tasks/TASK-0004-landing-public-release-decision/TASK.md
git diff --cached --name-status
git diff --cached --check
```

기대: 2개 파일만 stage.

Commit 메시지에 `Task: TASK-0005`, `Workflow: WF-02`를 포함하고, **참조처 25개를 일괄 수정하지 않은 판단과 그 근거를 본문에 적는다.**

```bash
git push -u origin workflow/TASK-0005-WF-02-reference-updates
gh pr create --base task/TASK-0005-product-build-stage \
  --head workflow/TASK-0005-WF-02-reference-updates \
  --title "docs: [TASK-0005/WF-02] align entry-point documents with the product build stage" \
  --body-file /tmp/wf02-pr-body.md
gh pr view
gh pr checks
```

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Ready | Spec O-3·O-5에서 확정 | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 변경하지 않음 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 문서 참조 정합화이며 신규 코드 경로가 없음. 검증은 참조처 점검과 `landing/` 회귀로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | Ready | - | - |

## Expected Output

- `docs/README.md` — 단계 표기, 승인 상태 4행, 시작 위치 표, 다음 작업 갱신
- `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md` — Decision References 1행 추가
- 갱신된 이 문서와 `HISTORY.md`

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Manual | `docs/README.md` 단계 표기가 `PRODUCT_BUILD`인지 확인 | 일치 | 미실행 | Not Run |
| Manual | 승인 상태 4행이 게이트와 연결되었는지 확인 | 4행 모두 | 미실행 | Not Run |
| Manual | 시작 위치 표에 ADR-005 행 존재, ADR-002 행이 대체됨 표기 | 2건 모두 | 미실행 | Not Run |
| Manual | 랜딩 관련 결론 2행이 유지되었는지 확인 | 유지 | 미실행 | Not Run |
| Manual | `TASK-0004` 변경이 Metadata 1행에 한정되는지 확인 | Scope·AC 변경 0건 | 미실행 | Not Run |
| Manual | ADR-002 머리말 8행 안에서 대체 사실 확인 가능 여부 | 확인 가능 | 미실행 | Not Run |
| Document | `git diff --check` | 경고 0건 | 미실행 | Not Run |
| Regression | `git diff --stat -- landing/` | 변경 0건 | 미실행 | Not Run |
| Regression | `cd landing && npm test` | 21개 통과 | 미실행 | Not Run |
| CI | Landing CI `verify` | 통과 또는 미트리거 | 미실행 | Not Run |

## Done When

- [ ] AC-10~AC-12, AC-15가 충족되었다
- [ ] 참조처 25개를 일괄 수정하지 않았고, 그 판단 근거가 기록되었다
- [ ] `TASK-0004`의 Scope와 AC가 변경되지 않았다
- [ ] `landing/`이 변경되지 않았고 `npm test` 21개가 통과했다
- [ ] 검증 명령과 결과를 실제 출력으로 기록했다
- [ ] 보안·권한·예외 처리 검토 — N/A, 코드 변경 없음
- [ ] 문서와 HISTORY를 갱신했다
- [ ] CI 결과를 기록했다
- [ ] 해결되지 않은 리뷰 의견이 없다
- [ ] Parent TASK Workflow Index를 갱신했다
- [ ] 구 O-6(핸드오프 상태 표기)이 이미 처리되었음을 착수 전에 확인했다

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Ready | - | - | Workflow 생성. 참조처 실측 중 발견한 핸드오프 문서를 O-6으로 추가 |
| 2026-08-17 | Ready | - | - | 소유자의 "핸드오프 기재 → 다음 세션 이관" 지시로 O-6을 세션 핸드오프 작업으로 이관. 이 Workflow의 Scope에서 제외 |
