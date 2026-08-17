# TASK-0002 History

| Date | Type | ID | Status | Branch | Commit | PR | Validation | Description |
|---|---|---|---|---|---|---|---|---|
| 2026-08-17 | Task | TASK-0002 | In Progress | task/TASK-0002-repo-hygiene | - | - | 문서 검토 | TASK 생성. TASK-0001에서 기록한 두 결함을 분리해 착수 |
| 2026-08-17 | Workflow | WF-01 | In Progress | task/TASK-0002-repo-hygiene | - | - | Not Run | 표기 정정과 무시 목록 정비 시작 |
| 2026-08-17 | Workflow | WF-01 | Review | task/TASK-0002-repo-hygiene | - | - | 검증 8건 Passed | 표기 27곳 정정, 루트 `.gitignore` 신설 |

## 2026-08-17 — 작업 경위

### 분리 근거

두 결함은 TASK-0001 진행 중 확인했으나 그 TASK의 Scope 밖이었다. `docs/claude/01-task-workflow.md` §11의 "현재 TASK와 무관한 결함은 분리" 기준을 적용해 별도 TASK로 열었다.

TASK-0001은 아직 `develop`에 병합되지 않았고 WF-05·WF-06이 배포 보류로 `Blocked` 상태다. 이 TASK는 `CLAUDE.md`와 `docs/claude/`만 건드려 TASK-0001과 파일이 겹치지 않으므로 `develop`에서 독립적으로 분기했다.

### 결함 1 — 통합 브랜치 표기

규칙 문서가 통합 브랜치를 `dev`로 표기했으나 실제 브랜치는 `develop`이다. 존재하지 않는 브랜치명을 지시하면 잘못된 Base로 PR을 만들 위험이 있다.

**치환 전 안전 확인**: `dev`가 브랜치 외 의미(`npm run dev`, `--omit=dev`, `devDependencies`)로 쓰인 곳이 **0건**임을 확인한 뒤 단어 경계로 치환했다.

| 파일 | 정정 건수 |
|---|---|
| `CLAUDE.md` | 7 |
| `docs/claude/01-task-workflow.md` | 1 |
| `docs/claude/02-git-operations.md` | 8 |
| `docs/claude/03-pr-review-merge.md` | 9 |
| `docs/claude/05-templates.md` | 2 |

**절차 내용 무변경 확인**: `git diff --stat`이 **27 insertions / 27 deletions**로 1:1 대응을 보였고, 추가 라인 중 `develop`을 포함하지 않는 것이 0건이었다. 표기만 바뀌고 규칙 내용은 그대로다.

중간에 `grep -c "^-[^-]"`로 삭제 라인을 세다 21건으로 집계해 불일치로 오판했다. 마크다운 리스트 삭제 라인(`- `가 diff에서 `--`가 됨)을 패턴이 걸러낸 탓이며, `git diff --stat`이 정확한 근거다.

### 결함 2 — 루트 `.gitignore` 부재

루트에 `.gitignore`가 없어 `.omc/`, `.codex-tmp/`, `.gstack/`가 무시되지 않았다. TASK-0001 진행 중 `.omc/`가 매 `git status`에 나타나 커밋마다 경로를 명시해 회피해야 했다.

세 디렉터리 모두 **추적 파일이 0개**임을 확인한 뒤 무시 목록에 넣었다. 추적 중인 파일을 무시로 숨기면 변경이 조용히 사라지므로, 그런 경우가 없는지 먼저 확인했다.

환경 파일(`.env`, `.dev.vars`)도 함께 넣었다. `landing/.gitignore`가 이미 같은 규칙을 갖고 있으나, 루트나 다른 하위 경로에 생길 경우를 막는다.

### 검증 결과

| 항목 | 결과 |
|---|---|
| 브랜치 의미 `dev` 잔여 | 0건 |
| `developelop` 중복 치환 | 0건 |
| 표기 치환 1:1 대응 | 27 / 27 |
| `git check-ignore` | 세 디렉터리 모두 무시 |
| `git status` | `.omc/` 미표시 |
| 무시 목록이 가리는 추적 파일 | 0개 |
| `git diff --check` | 경고 0건 |
| `cd landing && npm test` | tests 8, pass 8, fail 0 |

`landing/`을 변경하지 않아 Landing CI는 트리거되지 않는다. 트리거되지 않은 것을 통과로 기록하지 않는다.
