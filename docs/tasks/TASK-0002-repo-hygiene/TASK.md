# TASK-0002: 저장소 규칙 표기 정정과 무시 목록 정비

## Metadata

| Field | Value |
|---|---|
| Task ID | TASK-0002 |
| Status | Done |
| Priority | Medium |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Base Branch | develop |
| Task Branch | task/TASK-0002-repo-hygiene |
| Merge Authority | Auto-after-checks |
| Decision References | N/A — 결정 문서를 필요로 하지 않는 정비 작업 |
| Rule References | `CLAUDE.md`, `docs/claude/01-task-workflow.md` §10(단순 TASK), `docs/claude/02-git-operations.md` |
| Dependencies | 없음 |

## Goal

규칙 문서가 통합 브랜치를 `dev`로 표기하는 문제를 실제 브랜치명 `develop`으로 정정하고, 저장소 루트에 `.gitignore`를 두어 도구 상태 디렉터리가 실수로 커밋되지 않게 한다.

## Background

TASK-0001 진행 중 두 결함을 확인해 기록했으나, 그 TASK의 Scope 밖이라 별도 TASK로 분리했다.

### 결함 1 — 통합 브랜치 표기 불일치

`CLAUDE.md`와 `docs/claude/`가 통합 브랜치를 `dev`로 표기한다. 그러나 실제 통합 브랜치는 **`develop`**이며, 전역 규칙(`~/.claude/rules/git-branch-flow.md`)도 `develop`을 쓴다. TASK-0001은 2026-08-17 소유자 지시로 `develop`을 Base로 확정했고 `origin/develop`을 생성했다.

문서가 존재하지 않는 브랜치명을 지시하면 이후 작업에서 잘못된 Base로 PR을 만들 위험이 있다.

확인된 표기 위치는 27곳이다.

| 파일 | 건수 |
|---|---|
| `CLAUDE.md` | 7 |
| `docs/claude/01-task-workflow.md` | 1 |
| `docs/claude/02-git-operations.md` | 8 |
| `docs/claude/03-pr-review-merge.md` | 9 |
| `docs/claude/05-templates.md` | 2 |

`dev`가 브랜치 외 의미(`npm run dev`, `--omit=dev`, `devDependencies`)로 쓰인 곳은 **0건**임을 확인했다. 단어 경계 치환이 안전하다.

### 결함 2 — 루트 `.gitignore` 부재

저장소 루트에 `.gitignore`가 없다. `landing/.gitignore`만 존재한다.

그 결과 `.omc/`, `.codex-tmp/`, `.gstack/` 같은 도구 상태 디렉터리가 무시되지 않는다. 세 디렉터리 모두 현재 추적 파일은 0개지만, 파일이 생기면 `git status`에 나타나고 `git add -A` 시 실수로 커밋될 수 있다.

실제로 TASK-0001 진행 중 `.omc/`가 계속 `git status`에 표시되어 매 커밋마다 경로를 명시해 회피해야 했다.

## Input

- `CLAUDE.md`, `docs/claude/*.md` — 정정 대상
- TASK-0001 `HISTORY.md`의 "미해결 규칙 불일치" 절 — 두 결함의 최초 기록
- `landing/.gitignore` — 기존 무시 규칙 참고

## Scope

### Included

- `CLAUDE.md`와 `docs/claude/*.md`의 통합 브랜치 표기를 `dev`에서 `develop`으로 정정
- 저장소 루트 `.gitignore` 신설 — 도구 상태 디렉터리와 OS 산출물 무시
- 정정 후 문서가 지시하는 브랜치명이 실제 원격 브랜치와 일치하는지 확인

### Excluded

- `docs/claude/`의 절차 내용 변경 — 표기만 고치고 규칙 자체는 바꾸지 않는다
- `landing/.gitignore` 변경 — 이미 필요한 규칙을 담고 있다
- `.github/workflows/landing.yml`의 `push` 트리거 확대 — 별도 판단이 필요하다
- TASK-0001의 잔여 Workflow(WF-05·WF-06) — 그 TASK에 남는다
- 이미 커밋된 도구 파일 제거 — 추적 중인 파일이 없어 해당 사항 없음

## Acceptance Criteria

- [x] AC-01: `CLAUDE.md`와 `docs/claude/*.md`에 통합 브랜치를 뜻하는 `dev` 표기가 남아 있지 않다.
- [x] AC-02: 정정 후에도 `dev`가 브랜치 외 의미로 쓰인 표현은 훼손되지 않았다.
- [x] AC-03: 저장소 루트 `.gitignore`가 존재하고 `.omc/`, `.codex-tmp/`, `.gstack/`를 무시한다.
- [x] AC-04: `git check-ignore`로 세 디렉터리가 무시됨을 확인했다.
- [x] AC-05: `git status`에 도구 상태 디렉터리가 나타나지 않는다.
- [x] AC-06: `git diff --check`가 의도한 Markdown hard break 외 경고를 내지 않는다.

## Dependencies

- 없음. 다른 TASK와 파일이 겹치지 않는다.

## Risks

- 치환 위험: 단어 경계 없이 치환하면 `develop`이 `developelop`이 되거나 브랜치 외 의미가 훼손될 수 있다. 치환 후 전수 확인으로 방지한다.
- 문서 신뢰성 위험: 규칙 문서를 고치는 작업이므로, 표기만 바꾸고 절차 내용을 바꾸지 않았음을 확인해야 한다.
- 무시 목록 위험: 지나치게 넓은 패턴을 쓰면 필요한 파일이 무시된다. 확인된 디렉터리만 좁게 지정한다.

## Rollback Strategy

문서와 `.gitignore`만 변경한다. Task PR의 Squash Commit을 `git revert`하면 완전히 되돌아간다. 코드·스키마·외부 리소스 변경이 없다.

## Step / Workflow Index

| Step | Workflow | Description | Status | Branch | PR | Dependency |
|---|---|---|---|---|---|---|
| STEP-01 | WF-01 | 표기 정정과 무시 목록 정비 | Done | task/TASK-0002-repo-hygiene | #10 Merged | 없음 |

단순 TASK이므로 `docs/claude/01-task-workflow.md` §10에 따라 Task Branch 하나로 처리한다. 별도 Workflow Branch를 만들지 않는다.

## Steps

### STEP-01

| Field | Content |
|---|---|
| Step Name | 표기 정정과 무시 목록 정비 |
| Goal | 규칙 문서의 통합 브랜치 표기가 실제 브랜치명과 일치하고, 도구 상태 디렉터리가 무시된다 |
| Input | `CLAUDE.md`, `docs/claude/*.md`, 확인된 `dev` 표기 27곳 |
| Scope | 포함: 표기 정정, 루트 `.gitignore` 신설. 제외: 절차 내용 변경, CI 트리거 변경 |
| Instructions | 1. `dev`가 브랜치 외 의미로 쓰인 곳이 없음을 확인한다. 2. 단어 경계로 치환한다. 3. 잔여 표기를 전수 확인한다. 4. 루트 `.gitignore`를 만든다. 5. `git check-ignore`로 확인한다. 6. `git diff --check`를 실행한다. |
| Output Format | 정정된 `CLAUDE.md`와 `docs/claude/*.md`, 신설된 루트 `.gitignore` |
| Constraints | 절차 내용을 바꾸지 않는다. 브랜치 외 의미의 `dev`를 훼손하지 않는다. 무시 패턴을 필요 이상으로 넓히지 않는다. 이미 추적 중인 파일을 무시 목록으로 숨기지 않는다. |
| Done When | AC-01~AC-06이 모두 확인되었다 |
| Duration | Small |
| RULE Reference | `docs/claude/01-task-workflow.md` §10, `docs/claude/02-git-operations.md` |

## Integration Validation

| Type | Command or Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 경고 0건 | Passed |
| Manual | 정정 후 `dev` 잔여 표기 전수 검색 | 브랜치 의미 0건 | 0건. `git diff --stat` 27/27로 1:1 대응 확인 | Passed |
| Manual | `git check-ignore -v .omc .codex-tmp .gstack` | 세 디렉터리 모두 무시됨 | 세 디렉터리 무시 확인 | Passed |
| Manual | `git status --short` | 도구 상태 디렉터리 미표시 | `.omc/` 미표시 | Passed |
| Test | `cd landing && npm test` | 회귀 없음 | tests 8, pass 8, fail 0 | Passed |

`landing/`을 변경하지 않으므로 Landing CI는 트리거되지 않는다. 그 사실을 통과로 기록하지 않는다.

## Definition of Done

- [x] 필수 Workflow(WF-01)가 Done이다.
- [ ] 모든 Acceptance Criteria(AC-01~AC-06)가 검증되었다.
- [ ] 규칙 문서의 절차 내용이 바뀌지 않았음을 확인했다.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] Task PR을 `develop`으로 올렸다.
- [ ] 해결되지 않은 리뷰 의견이 없다.
