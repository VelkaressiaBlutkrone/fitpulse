# Repository instructions

## 절대 조건 — 모든 작업에 예외 없이 적용

아래 다섯 가지는 이 저장소의 어떤 작업에도 우선하는 최상위 규칙이다. 개별 지시가 이를 명시적으로 면제하지 않는 한 항상 따른다.

### 1. 추측·예상 금지

- 코드·설정·동작·의존성을 추측하지 않는다. 모르면 파일을 읽고 명령을 실행해 사실을 확인한 뒤 행동한다.
- "아마 ~일 것이다", "보통 ~하다" 같은 가정에 기반한 변경·답변·커밋을 금지한다.
- 확인이 불가능하면 진행을 멈추고 묻는다. 모르는 것을 아는 척하지 않는다.

### 2. 테스트 코드 우선 (Test-First)

- 모든 기능 추가·수정은 실패하는 테스트를 먼저 작성하고, 그 테스트를 통과시키는 최소 구현을 작성한다.
- 테스트 없는 구현 변경을 금지한다. 변경 후에는 반드시 테스트를 실행해 통과를 눈으로 확인한다.
- 구체적 테스트·검증 명령은 아래 "빌드·테스트" 절을 따른다.

### 3. 문제 발생 시 코드 분석 우선

- 버그·테스트 실패·예상 밖 동작이 생기면 추측으로 고치지 않는다. 먼저 관련 코드·로그·스택 트레이스를 읽어 근본 원인을 규명한다.
- 증상만 덮는 임시방편을 금지한다. 원인을 설명할 수 있을 때만 수정한다.

### 4. 신규 작업은 무조건 신규 브랜치

- 모든 신규 작업은 시작 전 `develop`에서 새 작업 브랜치(`feat/*`, `fix/*`, `chore/*`, `docs/*`)를 분기해 그 위에서 진행한다.
- `develop`, `main` 등 공유·통합 브랜치에서 직접 작업하지 않는다.
- 여러 세션이 동시에 작업할 때 파일 관리 충돌을 예방하도록 미커밋 변경을 공유 브랜치 작업 트리에 방치하지 않는다.

### 5. 결과를 자화자찬하지 않는다 — 항상 검증·테스트로 확인

- 작업 결과를 스스로 칭찬하거나 과신하지 않는다. "완료했다", "문제없다"는 검증·테스트로 확인한 근거가 있을 때만 말한다.
- 당장 문제가 없어 보여도 모든 작업은 엄격하게 검증·테스트해 결과를 확인한다. 검증되지 않은 성공·완료를 보고하지 않는다.

# 프로젝트 작업 실행 규칙

> 이 문서는 모든 작업에 항상 적용되는 핵심 규칙만 포함한다.  
> 상세 절차는 해당 작업 직전에 `docs/claude/*.md`에서 필요한 문서만 읽고 적용한다.

## 1. 규칙 우선순위

충돌 시 다음 순서를 적용한다.

1. 현재 사용자의 명시적 지시
2. `CLAUDE.md`, `AGENTS.md`, 프로젝트 RULE의 금지·보안·도메인 규칙
3. `DECISIONS.md`, ADR 등 확정된 결정
4. `SCOPE.md`, `PRD.md`
5. 해당 `TASK.md`
6. 해당 `WF-*.md`
7. 코드 주석과 임시 메모

하위 문서가 상위 규칙을 변경하거나 우회할 수 없다. 충돌과 판단 결과는 TASK 또는 Workflow 이력에 기록한다.

## 2. 작업별 필수 참조

| 수행 작업 | 작업 직전에 읽을 문서 |
|---|---|
| TASK·Step·Workflow 생성, 분할, 상태·Scope 변경 | `docs/claude/01-task-workflow.md` |
| Branch·Commit·Push·Rebase·Worktree | `docs/claude/02-git-operations.md` |
| PR·리뷰 대응·Conflict·Merge | `docs/claude/03-pr-review-merge.md` |
| Test·API·보안·DB·UI·LLM·인프라 검증 | `docs/claude/04-validation-checklists.md` |
| TASK·Workflow·HISTORY·PR·작업 보고 작성 | `docs/claude/05-templates.md` |

한 작업이 여러 조건에 해당하면 관련 문서를 모두 읽는다. 아직 수행하지 않을 단계의 문서는 읽지 않는다.

## 3. 작업 단위와 Git 흐름

- **TASK**: 목표, Scope, Acceptance Criteria와 `develop` 통합을 관리하는 단위
- **TASK Step**: TASK 내부 관리 단계. 필수 10개 필드를 가진다.
- **WORKFLOW**: 실제 구현·검증·리뷰 단위
- **Commit**: 하나의 논리적 변경 단위
- **PR**: 검토와 병합 단위

모든 Workflow는 하나의 Parent TASK와 하나의 Primary Parent Step을 가진다.

```text
단순 TASK: task/TASK-* → develop
복합 TASK: workflow/TASK-*-WF-* → task/TASK-* → develop
Release:   develop 또는 release/* → main
```

단순 TASK도 `WF-01`을 정의한다. 복합 TASK는 원칙적으로 Workflow 하나당 Branch 하나와 PR 하나를 사용한다.

## 4. 기본 실행 순서

1. 저장소, Remote, 현재 Branch와 미커밋 변경을 확인한다.
2. TASK, Workflow, Base, Scope, 제외 범위를 식별한다.
3. 해당 단계의 상세 문서를 읽는다.
4. Scope 안에서만 최소 변경을 수행한다.
5. 관련 검증을 실제로 실행한다.
6. TASK, Workflow, HISTORY를 실제 결과에 맞게 갱신한다.
7. Diff, Secret, 예상하지 못한 파일을 확인한다.
8. 허용된 경우에만 Commit, Push, PR, Merge를 수행한다.
9. 수행·미수행·실패 항목과 남은 위험을 구분하여 보고한다.

Scope가 변경되면 구현보다 TASK의 Scope, Acceptance Criteria, Workflow 구성을 먼저 갱신한다.

## 5. 항상 적용하는 Git 규칙

- `main`, `develop`에 직접 Push하지 않는다.
- Workflow PR Base는 해당 `task/*`, Task PR Base는 `develop`이다.
- TASK 또는 Workflow Branch에서 `main`으로 직접 PR을 만들지 않는다.
- 하나의 Branch에서 여러 TASK를 처리하지 않는다.
- 복합 TASK의 Task Branch에는 최초 계획과 Workflow PR 병합 결과만 반영한다.
- 통합 수정도 Task Branch에 직접 넣지 않고 새 Workflow로 처리한다.
- Commit은 Conventional Commits와 TASK/WF 추적 정보를 사용한다.
- 사용자 또는 다른 작업자의 미커밋 변경을 섞거나 덮어쓰지 않는다.

## 6. 권한과 검증

- Branch, Commit, Push, PR은 현재 요청 또는 저장소 작업 규칙이 허용할 때 수행한다.
- Merge 기본 권한은 `Human-only`이며 명시적 허용이 없으면 수행하지 않는다.
- CI, 승인, 리뷰, Branch Protection을 우회하지 않는다.
- 실제 실행한 검증만 `Passed` 또는 `성공`으로 기록한다.
- 미실행은 `Not Run — 사유`, 미수행 Git 작업은 `Not performed`로 기록한다.
- 실패, 임시 우회, 호환성 문제, 잔여 위험을 숨기지 않는다.
- 실패한 테스트를 삭제하거나 약화하여 통과시키지 않는다.

## 7. 절대 금지

```text
git reset --hard
git clean -fd / -fdx
git push --force
main·develop 직접 Push
사용자 변경의 임의 stash·삭제·덮어쓰기
공유 Branch 이력 재작성
--no-verify 및 필수 Check 우회
관리자 권한을 이용한 Branch Protection 우회
Secret, Token, Password, .env Commit
이미 공유된 Migration 파일의 임의 수정
Scope 밖 대규모 리팩터링·일괄 포맷
검증 결과 또는 작업 수행 여부의 허위 기록
```

세부 시작·완료 보고 형식은 `docs/claude/05-templates.md`를 따른다.


## 빌드·테스트

- 명령 실행 전 실제 모듈 경로와 빌드 설정 파일을 읽어 해당 명령이 현재 저장소에 적용되는지 확인한다. 확인할 수 없으면 실행하거나 대체 명령을 추측하지 않는다.
- 백엔드: Wiki 배포 가이드에 명시된 검증 명령은 `./gradlew test`이다.
- 모바일 앱: Wiki 배포 가이드에 명시된 검증 명령은 `flutter analyze`와 `flutter test`이다.
- 관리자 웹: Wiki 배포 가이드에는 `npm run build`만 명시되어 있다. 테스트 명령은 실제 `package.json`의 scripts를 확인한 뒤 사용한다.
- 문서 변경: 최소한 `git diff --check`를 실행하고, 문서가 참조하는 로컬 경로와 파일의 존재 여부를 확인한다.
- 현재 구현 또는 빌드 설정 파일이 없는 단계에서는 실행할 수 없는 빌드·테스트를 통과했다고 보고하지 않는다.

## Document placement

- Keep repository-level control files that must live at the root, such as `CLAUDE.md`, in the repository root.
- Store design documents, plans, specifications, reviews, reports, and other project documentation under `docs/` unless a tool or platform requires a specific root-level path.
- Treat `wiki/` as the source material and publication workspace for the GitHub Wiki, not as the default location for new implementation-planning artifacts.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
