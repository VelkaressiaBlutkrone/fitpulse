# Git 작업 상세 규칙

이 문서는 Branch 생성, Commit, Push, Rebase, Worktree 등 Git 명령을 수행하기 직전에 읽는다.

## 1. 작업 시작 전 점검

```bash
git remote -v
git branch --show-current
git status --short
git fetch origin --prune
```

확인할 항목:

- 올바른 저장소와 Remote인가
- 현재 Branch가 무엇인가
- 미커밋 변경이 있는가
- 사용자 또는 다른 작업자의 변경이 있는가
- 같은 TASK / Workflow Branch가 이미 존재하는가
- Parent Branch가 최신인가
- TASK와 Workflow 문서가 준비되었는가

사용자의 미커밋 변경이 있으면 임의로 Stash, 삭제, 덮어쓰기 또는 현재 TASK Commit에 혼합하지 않는다.

## 2. Branch 명명

### Task Branch

```text
task/<TASK-ID>-<short-kebab-description>
```

예:

```text
task/TASK-0123-reservation-duplicate-check
```

### Workflow Branch

```text
workflow/<TASK-ID>-<WF-ID>-<short-kebab-description>
```

예:

```text
workflow/TASK-0123-WF-02-domain-service
```

설명은 소문자 영문, 숫자, 하이픈만 사용한다.

금지 예:

```text
task/temp
feature/test
workflow/update
Reservation_Duplicate_Check
예약-중복-검사
```

병합된 Branch 이름을 다시 사용하지 않는다.

## 3. Branch 흐름

### 단순 TASK

```text
task/TASK-* → develop
```

### 복합 TASK

```text
workflow/TASK-*-WF-* → task/TASK-* → develop
```

### Release

```text
develop 또는 release/* → main
```

일반 TASK 작업에서 `main`으로 직접 연결하지 않는다.

## 4. Worktree 사용

현재 작업 트리에 다른 변경이 있거나 여러 Workflow를 병렬 처리해야 하면 Worktree를 우선 검토한다.

```bash
git worktree add ../repo-TASK-0123 \
  -b task/TASK-0123-reservation-duplicate-check \
  origin/develop
```

Workflow Worktree 예:

```bash
git worktree add ../repo-TASK-0123-WF-02 \
  -b workflow/TASK-0123-WF-02-domain-service \
  origin/task/TASK-0123-reservation-duplicate-check
```

변경이 Commit 및 Push되기 전에 Worktree를 삭제하지 않는다.

## 5. Task Branch 생성

```bash
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
git switch -c task/TASK-0123-reservation-duplicate-check
```

복합 TASK에서는 TASK와 전체 Workflow 계획을 먼저 Commit한다.

```bash
git add docs/tasks/TASK-0123-reservation-duplicate-check
git diff --cached
git commit -S -m "docs(task-0123): initialize task and workflow plan"
git push -u origin task/TASK-0123-reservation-duplicate-check
```

저장소가 Signed Commit을 요구하지 않으면 `-S`를 생략할 수 있다.

복합 TASK의 최초 계획 Commit 이후 구현 코드를 Task Branch에 직접 Push하지 않는다.

## 6. Workflow Branch 생성

최신 Task Branch에서 생성한다.

```bash
git fetch origin --prune
git switch task/TASK-0123-reservation-duplicate-check
git pull --ff-only origin task/TASK-0123-reservation-duplicate-check
git switch -c workflow/TASK-0123-WF-02-domain-service
```

생성 직후 확인:

```bash
git branch --show-current
git status --short
git log -1 --oneline
```

잘못된 Base에서 생성했다면 계속 구현하지 않는다. 올바른 Base에서 Branch를 다시 만들고 필요한 Commit만 옮긴다.

## 7. 독립·의존 Workflow

### 독립 Workflow

동일한 최신 Task Branch에서 각각 생성한다.

```text
task/TASK-0123
├── workflow/TASK-0123-WF-01-api-contract
├── workflow/TASK-0123-WF-02-security-review
└── workflow/TASK-0123-WF-03-ui
```

### 의존 Workflow

선행 Workflow가 Task Branch에 병합된 뒤 후속 Branch를 생성하는 것이 기본이다.

```text
WF-01 병합
→ Task Branch 최신화
→ WF-02 Branch 생성
```

### Stacked Workflow 예외

선행 PR 병합 전에 후속 작업이 반드시 필요할 때만 사용한다.

기록할 정보:

```text
Stacked On: WF-01
Temporary Base: workflow/TASK-0123-WF-01-api-contract
Final Base: task/TASK-0123-reservation-duplicate-check
```

선행 PR 병합 후:

```bash
git fetch origin
git switch workflow/TASK-0123-WF-02-domain-service
git rebase --onto \
  origin/task/TASK-0123-reservation-duplicate-check \
  origin/workflow/TASK-0123-WF-01-api-contract
git push --force-with-lease
```

Stacked Workflow는 기본 방식이 아니다.

## 8. Commit 메시지

Conventional Commits:

```text
<type>(<scope>): <summary>
```

허용 Type:

```text
feat fix refactor test docs perf build ci chore style revert
```

좋은 예:

```text
feat(reservation): reject duplicate active bookings
fix(inventory): prevent negative stock quantities
test(reservation): cover overlapping time slots
docs(task-0123): record workflow validation
```

나쁜 예:

```text
update
fix bug
changes
작업완료
수정
```

중요 Commit 본문:

```text
feat(reservation): reject duplicate active bookings

Why:
- 동일 환자의 동일 시간대 중복 예약을 방지한다.

Changes:
- 활성 예약 중복 조회를 추가한다.
- 충돌 예외를 추가한다.
- 단위 테스트를 추가한다.

Validation:
- ./gradlew test --tests "*ReservationServiceTest"

Task: TASK-0123
Workflow: WF-02
Refs: #123
```

단순 TASK도 `Workflow: WF-01`을 기록한다.

## 9. Commit 분리

Commit 하나에는 하나의 논리적 목적만 포함한다.

권장 예:

```text
feat(reservation): add duplicate booking policy
test(reservation): cover duplicate booking policy
docs(task-0123): update workflow evidence
```

다음 변경은 혼합하지 않는다.

- 서로 다른 TASK
- 기능과 무관한 전체 포맷
- 대규모 파일 이동과 기능 변경
- 의존성 일괄 업데이트와 도메인 기능
- 디버깅 로그와 실제 기능
- IDE 개인 설정과 애플리케이션 코드

## 10. Stage 및 Commit 전 확인

```bash
git status --short
git diff
git diff --check
```

파일을 선택적으로 Stage한다.

```bash
git add path/to/file1 path/to/file2
git diff --cached --name-status
git diff --cached
```

`git add .` 또는 `git add -A`를 사용할 경우 Stage 결과 전체를 반드시 확인한다.

확인 항목:

- TASK / Workflow Scope 안의 변경인가
- 사용자 변경이 섞이지 않았는가
- Secret, Token, Password, `.env`가 없는가
- 빌드 결과, 로그, 임시 파일이 없는가
- 디버깅 코드가 없는가
- Migration과 Lock 파일 변경이 의도된 것인가
- 테스트 결과가 실제 기록과 일치하는가

## 11. Signed Commit

저장소 Ruleset이 요구할 때:

```bash
git commit -S -m "feat(reservation): reject duplicate active bookings"
git log --show-signature -1
```

금지:

- 서명 규칙 비활성화
- 다른 사람의 Identity 또는 서명 사용
- Global Git Config 임의 변경
- 검증되지 않은 서명을 검증되었다고 보고
- `--no-verify` 사용

## 12. Push 전 확인

Workflow Branch 예:

```bash
git fetch origin --prune
git status --short
git diff --check
git log --oneline --decorate \
  origin/task/TASK-0123-reservation-duplicate-check..HEAD
git diff --stat \
  origin/task/TASK-0123-reservation-duplicate-check...HEAD
```

Task Branch는 Base를 `origin/develop`로 바꿔 확인한다.

확인 항목:

- 현재 Branch와 Base가 올바른가
- 예상하지 못한 Commit 또는 파일이 없는가
- 검증 결과가 기록되었는가
- Secret이 없는가
- Workflow 문서 상태가 갱신되었는가

## 13. Push

최초 Push:

```bash
git push -u origin workflow/TASK-0123-WF-02-domain-service
```

후속 Push:

```bash
git push
```

Rebase 후 Force Push는 다음 조건을 모두 만족할 때만 허용한다.

- 올바른 Branch 확인
- Rebase 결과와 Diff 검토
- 다른 작업자가 같은 Branch를 사용하지 않음
- PR 리뷰 영향 확인
- 일반 Push가 Non-fast-forward로 거절됨

```bash
git push --force-with-lease
```

다음은 금지한다.

```bash
git push --force
git push origin HEAD:develop
git push origin HEAD:main
```

## 14. Base 최신화와 Rebase

```bash
git fetch origin
git switch workflow/TASK-0123-WF-02-domain-service
git status --short
git rebase origin/task/TASK-0123-reservation-duplicate-check
```

Conflict 해결 후:

```bash
git add <resolved-files>
git rebase --continue
```

완료 후:

```bash
git diff --check
# 프로젝트 테스트 실행
git log --oneline --decorate \
  origin/task/TASK-0123-reservation-duplicate-check..HEAD
git push --force-with-lease
```

해결이 불확실하면:

```bash
git rebase --abort
```

리뷰 시작 후 Rebase했다면 PR에 사실을 기록하고 재리뷰 필요 여부를 확인한다.

## 15. 공유 이력 규칙

- 최초 Push 전에는 로컬 Commit 정리 가능
- 리뷰가 시작된 뒤에는 새 수정 Commit을 우선
- 공유 Branch의 이력은 임의 재작성하지 않음
- Rebase가 필요하면 PR에 알리고 수행
- `git push --force`는 사용하지 않음

## 16. Branch 정리

원격 PR이 실제 병합되었고 변경이 Target Branch에 반영된 것을 확인한 뒤 삭제한다.

Squash Merge 후 로컬 Branch는 조상으로 인식되지 않을 수 있다.

```bash
git branch -D workflow/TASK-0123-WF-02-domain-service
```

`-D`는 PR 병합 확인 후에만 사용한다. 병합되지 않은 작업 Branch를 삭제하지 않는다.
