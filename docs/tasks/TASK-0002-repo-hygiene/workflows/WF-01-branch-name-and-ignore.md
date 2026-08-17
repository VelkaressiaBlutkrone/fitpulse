# WF-01: 표기 정정과 무시 목록 정비

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-01 |
| Parent Task | TASK-0002 |
| Parent Step | STEP-01 |
| Status | Review |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | develop |
| Branch | task/TASK-0002-repo-hygiene |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | 없음 |
| Affected Paths | `CLAUDE.md`, `docs/claude/01-task-workflow.md`, `docs/claude/02-git-operations.md`, `docs/claude/03-pr-review-merge.md`, `docs/claude/05-templates.md`, `.gitignore`(신규) |
| Decision References | N/A |
| Rule References | `docs/claude/01-task-workflow.md` §10 |

단순 TASK이므로 별도 Workflow Branch를 만들지 않고 Task Branch에서 진행한다.

## Goal

규칙 문서의 통합 브랜치 표기를 `develop`으로 맞추고, 루트 `.gitignore`로 도구 상태 디렉터리를 무시한다.

## Input

- 확인된 `dev` 표기 27곳 (`CLAUDE.md` 7, `01` 1, `02` 8, `03` 9, `05` 2)
- 브랜치 외 의미 검사 결과 — `npm run dev`·`--omit=dev`·`devDependencies` **0건**
- 도구 디렉터리 추적 상태 — `.omc`, `.codex-tmp`, `.gstack` 모두 추적 파일 0개

## Scope

### Included

- 통합 브랜치 표기 정정
- 루트 `.gitignore` 신설

### Excluded

- 절차 내용 변경
- `landing/.gitignore` 변경
- CI 트리거 변경
- 추적 중인 파일 제거 — 해당 사항 없음

## Preconditions

- `develop`이 `origin`에 존재한다. (2026-08-17 생성)

## Constraints

- 단어 경계로 치환한다. `develop`이 `developelop`이 되지 않아야 한다.
- 브랜치 외 의미의 `dev`를 훼손하지 않는다.
- 규칙의 **절차와 내용은 바꾸지 않는다.** 표기만 고친다.
- 무시 패턴을 필요 이상으로 넓히지 않는다. 확인된 디렉터리만 지정한다.
- **이미 추적 중인 파일을 무시 목록으로 숨기지 않는다.** 무시는 추적되지 않은 파일에만 효력이 있으므로, 추적 파일이 있으면 별도 판단이 필요하다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Done | 표기 27곳 특정, 브랜치 외 의미 0건 확인 | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 건드리지 않음 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 변경 없음 | - | - |
| 06 | Domain | No | N/A — 코드 변경 없음 | - | - |
| 07 | Service | No | N/A — 코드 변경 없음 | - | - |
| 08 | Controller | No | N/A — 코드 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 문서와 무시 목록 변경이며 자동 테스트 대상 코드 경로가 없다. 검증은 전수 검색과 `git check-ignore`로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | In Progress | 이 문서와 HISTORY | - |

## Expected Output

- `CLAUDE.md`, `docs/claude/01`·`02`·`03`·`05` — 통합 브랜치 표기가 `develop`
- `.gitignore`(신규) — 도구 상태 디렉터리와 OS 산출물 무시
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Manual | 정정 후 브랜치 의미 `dev` 전수 검색 | 0건 | 0건 | Passed |
| Manual | `developelop` 같은 중복 치환 검색 | 0건 | 0건 | Passed |
| Manual | `git check-ignore -v .omc .codex-tmp .gstack` | 세 디렉터리 무시됨 | 세 디렉터리 모두 `.gitignore` 규칙으로 무시 확인 | Passed |
| Manual | `git status --short` | 도구 디렉터리 미표시 | `.omc/`가 목록에서 사라짐 | Passed |
| Manual | 무시 목록이 추적 파일을 가리지 않는지 확인 | 추적 파일 0개 | 0개 | Passed |
| Document | `git diff --check` | 의도한 hard break 외 경고 없음 | 경고 0건 | Passed |
| Test | `cd landing && npm test` | 회귀 없음 | tests 8, pass 8, fail 0 | Passed |
| Manual | `git diff --stat`으로 표기 치환의 1:1 대응 확인 | 삽입 = 삭제 | **27 insertions / 27 deletions** | Passed |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — N/A. 전수 검색과 `git check-ignore`로 대체하고 결과를 기록함
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한 검토 — N/A, 경계 변경 없음
- [ ] 문서와 HISTORY 갱신
- [ ] CI — `landing/**` 변경이 없어 Landing CI가 트리거되지 않는다. 트리거되지 않은 것을 통과로 기록하지 않는다
- [ ] Parent TASK Workflow Index 갱신

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | In Progress | - | - | Workflow 생성. TASK-0001에서 기록한 두 결함을 별도 TASK로 분리해 착수 |
