# WF-10: 배포 의존 범위 분리와 TASK-0001 마감

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-10 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-03 |
| Status | In Progress |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-10-scope-split-and-closeout |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01, WF-02, WF-03, WF-04, WF-07, WF-08, WF-09 (모두 Done) |
| Affected Paths | `docs/tasks/TASK-0001-landing-public-gate/`, `docs/tasks/TASK-0004-landing-public-release-decision/`(신규) |
| Decision References | `ADR-20260814-001`, `ADR-20260814-002`, `ADR-20260817-003` |
| Rule References | `docs/claude/01-task-workflow.md` §9·§11·§12, `docs/claude/02-git-operations.md` §6, `docs/claude/03-pr-review-merge.md` §10·§14 |

## Goal

배포가 있어야만 진행할 수 있는 WF-05·WF-06을 TASK-0001에서 분리해 후속 TASK-0004로 옮기고, 남은 필수 Workflow가 모두 Done인 TASK-0001을 통합 검증과 함께 마감 가능한 상태로 만든다.

완료 시점에 TASK-0001은 `Review` 상태이고, Task PR을 `develop`에 올릴 수 있으며, 분리된 작업은 TASK-0004 문서로 추적 가능하다.

## Background — 이 Workflow가 필요한 이유

`develop`의 `landing/package-lock.json`은 `npm ci`가 요구하는 `@emnapi` 항목 3개 중 1개만 가지고 있다. 실측 결과다.

```text
git show origin/develop:landing/package-lock.json | grep -c '"node_modules/@emnapi'
→ 1

git show origin/task/TASK-0001-landing-public-gate:landing/package-lock.json | grep -c '"node_modules/@emnapi'
→ 3
```

그 결과 `develop`에서 분기한 모든 Branch의 PR이 `npm ci` 단계에서 실패한다. PR #11(TASK-0003)의 Landing CI 실패 로그가 같은 원인을 가리킨다.

```text
npm error code EUSAGE
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
```

lock 복구(WF-08, PR #3)는 이미 완료되었으나 **Task Branch에만 있고 `develop`에 없다.** TASK-0001이 `Done`이 되지 못해 Task PR이 열리지 않았기 때문이며, `Done`을 막고 있는 것이 `Blocked` 상태인 WF-05·WF-06이다.

즉 배포 의존 작업 2개가 통합 브랜치의 CI를 막고 있다. 이 Workflow는 그 결합을 끊는다.

## Input

- `docs/tasks/TASK-0001-landing-public-gate/TASK.md` — Scope, Acceptance Criteria, Workflow Index
- `docs/tasks/TASK-0001-landing-public-gate/workflows/WF-05-cost-cap-observability.md` — 이관 대상
- `docs/tasks/TASK-0001-landing-public-gate/workflows/WF-06-public-decision-baseline.md` — 이관 대상
- `docs/tasks/TASK-0001-landing-public-gate/HISTORY.md` — 판단 경위
- `docs/claude/01-task-workflow.md` §11 — Scope 변경과 분리 기준
- 실측: `develop`·Task Branch의 lock 파일 `@emnapi` 항목 수, PR #11 CI 실패 로그

## Scope

### Included

- WF-05·WF-06을 `Cancelled — TASK-0004로 대체`로 전환하고 각 문서에 이관 경위 기록
- 후속 TASK-0004 문서 세트 신설: `TASK.md`, `HISTORY.md`, `workflows/WF-01`, `workflows/WF-02`
- TASK-0001의 Included / Excluded Scope 갱신 — 배포 의존 범위를 Excluded로 이동
- TASK-0001의 Acceptance Criteria 갱신 — 배포가 있어야 검증 가능한 항목을 TASK-0004로 이관
- TASK-0001의 Step / Workflow Index와 STEP-02·STEP-03의 `Done When` 갱신
- TASK-0001의 Integration Validation 표를 **실제 실행 결과**로 채우기
- TASK-0001 Status를 `In Progress` → `Review`로 전환
- 이관 경위와 판단 근거를 TASK-0001 HISTORY에 기록

### Excluded

- 비용 상한 결정·감지 수단 확인·중단 절차 작성 — TASK-0004 WF-01
- 공개 GO/NO-GO 판정과 기준선 질의 — TASK-0004 WF-02
- `landing/` 애플리케이션 코드·테스트·마이그레이션 변경 — 이 Workflow는 문서만 변경한다
- Task PR 생성과 `develop` 병합 — Workflow 병합 이후 TASK 단계에서 수행
- PR #11(TASK-0003) 최신화와 충돌 해결 — TASK-0003의 범위
- `ADR-20260814-002` 갱신 — MVP 착수 선행 조건이며 별도 TASK

## Preconditions

- WF-01·WF-02·WF-03·WF-04·WF-07·WF-08·WF-09의 PR이 Task Branch에 모두 병합되어 있다. (PR #1·#2·#3·#4·#6·#8·#9 Merged 확인)
- 소유자가 "TASK-0001 병합 경로"를 선택했다. (2026-08-17)
- Task Branch가 최신이며 미커밋 변경이 없다.

## Constraints

- **Workflow 번호를 재사용하지 않는다.** WF-05·WF-06은 `Cancelled`로 남기고, 이관된 작업은 TASK-0004에서 새 번호를 받는다. (`docs/claude/01` §1·§9)
- 이관은 **취소가 아니다.** 공개 판정 전에 모두 해소해야 한다는 사실을 두 TASK 문서 모두에 남긴다.
- 실행하지 않은 검증을 `Passed`로 기록하지 않는다. 미실행은 `Not Run — 사유`로 남긴다. (`CLAUDE.md` 절대 조건 5)
- 이관 대상 Acceptance Criteria를 TASK-0001에서 조용히 삭제하지 않는다. 이관처를 명시한다.
- Task Branch에 직접 수정하지 않는다. 모든 변경은 이 Workflow Branch에서 수행하고 PR로 병합한다. (`docs/claude/03` §14)
- `landing/` 코드를 변경하지 않는다. 변경하면 Landing CI 트리거 조건과 리뷰 목적이 흐려진다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Done | 소유자 결정(2026-08-17) + lock·CI 실측 | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 변경하지 않음 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 문서 변경이며 신규 코드 경로가 없음. 대신 Task Branch 전체에 대해 CI와 동일한 검증 4종을 실행하고 결과를 TASK Integration Validation에 기록 | - | - |
| 11 | 문서 / HISTORY | Yes | In Progress | - | - |

## Expected Output

- `docs/tasks/TASK-0001-landing-public-gate/workflows/WF-05-cost-cap-observability.md` — `Cancelled — TASK-0004 WF-01로 대체`
- `docs/tasks/TASK-0001-landing-public-gate/workflows/WF-06-public-decision-baseline.md` — `Cancelled — TASK-0004 WF-02로 대체`
- `docs/tasks/TASK-0001-landing-public-gate/workflows/WF-10-scope-split-and-closeout.md` — 이 문서
- `docs/tasks/TASK-0001-landing-public-gate/TASK.md` — Scope·AC·Index·Steps·Integration Validation·Status 갱신
- `docs/tasks/TASK-0001-landing-public-gate/HISTORY.md` — 분리 경위와 검증 결과
- `docs/tasks/TASK-0004-landing-public-release-decision/TASK.md`
- `docs/tasks/TASK-0004-landing-public-release-decision/HISTORY.md`
- `docs/tasks/TASK-0004-landing-public-release-decision/workflows/WF-01-cost-cap-observability.md`
- `docs/tasks/TASK-0004-landing-public-release-decision/workflows/WF-02-public-decision-baseline.md`

`docs/README.md`는 변경하지 않는다. 최초 계획에는 "TASK 색인 갱신"을 넣었으나 **그 문서에 TASK 색인 절이 존재하지 않는다**(`TASK-000` 문자열 미검출). 없는 절을 이 Workflow에서 새로 만드는 것은 분리 작업의 범위를 넘는다. `docs/README.md`의 "현재 결론"·"다음 작업" 갱신은 TASK-0004 WF-02의 Expected Output에 있다.

## Validation

CI(`.github/workflows/landing.yml`)와 동일한 순서로 Task Branch에서 실행했다. 전체 exit code 0.

**실행 환경**: Windows / Node.js v24.12.0 / npm 11.6.2. **CI는 Node.js 22를 사용하므로 런타임이 동일하지 않다.** 이 로컬 결과는 CI 통과의 근거가 아니라 사전 확인이며, 확정은 Task PR의 Landing CI로 한다.

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Install | `cd landing && npm ci` | lock과 `package.json` 동기 | 507 packages 설치, 오류 없음 | Passed |
| Test | `cd landing && npm test` | 전체 통과 | `tests 21 / pass 21 / fail 0`, 44.9s | Passed |
| Lint | `cd landing && npm run lint` | 오류 0 | 출력 없음 (오류 0) | Passed |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 0 | `found 0 vulnerabilities` | Passed |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 경고 0건 (exit 0) | Passed |
| Manual | 이관 대상 AC 5개가 TASK-0004에 빠짐없이 옮겨졌는지 대조 | 누락 0건 | AC-09→01, AC-10→02, AC-11→03, AC-12→04, AC-15→05. 누락 0건 | Passed |
| Manual | TASK-0001에 남은 AC가 전부 검증 근거를 가지는지 대조 | 근거 없는 `[x]` 0건 | AC-01~AC-08·AC-13·AC-14 각각에 테스트명 또는 산출 문서를 병기. AC-13·AC-14의 미확인 부분은 사유와 함께 명시 | Passed |
| CI | Landing CI `verify` | 통과 | 미실행 | Not Run — PR 생성 후 확인 |

**기록해야 할 차이 1건.** `npm ci`는 `6 vulnerabilities (4 moderate, 2 high)`를 보고했으나 `npm audit --omit=dev --audit-level=high`는 `found 0 vulnerabilities`를 반환했다. high 2건이 **dev 의존성에 있어 `--omit=dev`에서 제외**된다는 뜻이다. CI가 쓰는 명령이 후자이므로 CI 기준으로는 통과이나, 취약점이 사라진 것은 아니다.

`landing/` 경로를 변경하지 않으므로 이 Workflow PR에서 Landing CI가 트리거되지 않을 수 있다. 그 경우 `N/A — 경로 미해당`으로 기록하고, **Task PR 단계에서 Task Branch 전체에 대한 CI 통과를 확인한다.** 이것이 이 Workflow의 실질적 목적이므로 생략하지 않는다.

## Done When

- [ ] WF-05·WF-06이 `Cancelled`이고 이관처가 명시되었다
- [ ] TASK-0004 문서 세트가 생성되었고 이관된 Scope·AC가 빠짐없이 담겼다
- [ ] TASK-0001의 Scope·AC·Index·Steps가 이관 결과와 일치한다
- [ ] TASK-0001의 Integration Validation이 실제 실행 결과로 채워졌다
- [ ] TASK-0001 Status가 `Review`이다
- [ ] 검증 명령과 결과를 기록했다
- [ ] 보안·권한·예외 처리 검토 — N/A, 코드 변경 없음. 저장 금지 정보 미포함만 확인
- [ ] 문서와 HISTORY를 갱신했다
- [ ] CI 결과를 기록했다 (통과 또는 `N/A — 경로 미해당`)
- [ ] 해결되지 않은 리뷰 의견이 없다
- [ ] Parent TASK Workflow Index를 갱신했다

## 판단 기록 — TASK-0004 문서를 이 Workflow에서 만드는 이유

`CLAUDE.md` 5절은 "하나의 Branch에서 여러 TASK를 처리하지 않는다"고 규정한다. 이 Workflow가 TASK-0004 문서를 생성하는 것이 그 규칙에 걸리는지 검토했다.

**적용하지 않는다고 판단했다.** 근거는 다음과 같다.

- 이 Branch에서 수행하는 것은 TASK-0004의 **작업이 아니라 분리 기록**이다. TASK-0004의 실제 작업(비용 상한 결정, 공개 판정)은 이 Branch에서 하지 않으며 Scope에서 명시적으로 제외했다.
- `docs/claude/01` §11은 Scope 변경 절차로 "Included / Excluded Scope 갱신 → Acceptance Criteria 갱신 → 새 Workflow 생성 → Step / Workflow Index 갱신"을 한 단위로 규정한다. 이관처 문서가 없으면 TASK-0001의 Excluded Scope와 AC 이관 표기가 **존재하지 않는 문서를 가리키게 된다.**
- 분리를 두 PR로 쪼개면 그 사이 시점에 이관된 작업이 어느 TASK에도 속하지 않는 공백이 생긴다.

대안으로 "TASK-0001 병합 후 별도 Branch에서 TASK-0004 생성"을 검토했으나, 위 공백과 dangling 참조를 만들어 채택하지 않았다.

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | In Progress | - | - | Workflow 생성. `develop` CI 차단 해소를 위한 배포 의존 범위 분리 |
