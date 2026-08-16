# PR · 리뷰 · Conflict · Merge 상세 규칙

이 문서는 PR 생성, 리뷰 대응, Conflict 해결, Merge를 수행하기 직전에 읽는다.

## 1. PR Target

| PR 종류 | Head | Base |
|---|---|---|
| Workflow PR | `workflow/TASK-*-WF-*` | 해당 `task/TASK-*` |
| 단순 Task PR | `task/TASK-*` | `dev` |
| 복합 Task PR | `task/TASK-*` | `dev` |
| Release PR | `dev` 또는 `release/*` | `main` |
| Hotfix PR | `hotfix/*` | `main` |

금지:

- Workflow PR을 `dev` 또는 `main`에 생성
- Task PR을 `main`에 생성
- 일반 기능 Branch에서 `main`으로 직접 PR 생성

## 2. PR 생성 전 점검

```bash
git fetch origin --prune
git status --short
git diff --check
git log --oneline origin/<base>..HEAD
git diff --stat origin/<base>...HEAD
```

확인:

- Head와 Base가 정확한가
- Scope 밖 변경이 없는가
- Commit과 파일이 예상 범위인가
- 테스트 결과가 기록되었는가
- TASK / Workflow 문서가 현재 코드와 일치하는가
- Secret 또는 로컬 설정이 없는가

## 3. PR 제목

### Workflow PR

```text
feat(reservation): [TASK-0123/WF-02] add duplicate booking policy
```

### Task PR

```text
feat(reservation): complete duplicate booking prevention
```

제목은 변경의 최종 결과를 표현한다.

## 4. Workflow PR 필수 내용

- Parent Task
- Workflow
- Parent Step
- Related Issue
- Base Branch
- Workflow 문서 경로
- Goal
- Included / Excluded Scope
- 주요 변경
- 적용한 결정과 대안
- 실제 Validation 결과
- API / DB / Security 영향
- UI Evidence
- Risks
- Rollback
- Checklist

Workflow PR은 Parent Issue를 종료하지 않는다.

금지 Footer:

```text
Closes #123
Fixes #123
Resolves #123
```

대신 다음을 사용한다.

```text
Refs #123
```

## 5. Task PR 필수 내용

- Task ID와 Issue
- Task 문서 경로
- Head / Base
- Goal
- Acceptance Criteria 결과
- 포함된 Workflow PR 목록
- 통합 변경 요약
- 통합·회귀 검증
- API / DB / Client 호환성
- Security
- Risks와 후속 TASK
- Rollback
- Final Checklist

Parent Issue는 최종 Task PR에서만 종료한다.

```text
Closes #123
```

## 6. Draft PR

다음 상황에서는 Draft로 생성한다.

- 구현 미완료
- 조기 구조 리뷰 필요
- CI 결과 선확인 필요
- 다른 Workflow와 Scope 조율 필요
- Contract 또는 설계 검토가 선행되어야 함

Ready for Review 전 확인:

- Workflow 상태가 `Review` 또는 `Done`
- Done When 충족
- 테스트 결과 기록
- 임시 코드와 디버깅 로그 제거
- PR 설명과 실제 변경 일치
- Base 정확
- 불필요한 Commit과 파일 없음

## 7. PR 생성 명령 예시

Workflow PR:

```bash
gh pr create \
  --draft \
  --base task/TASK-0123-reservation-duplicate-check \
  --head workflow/TASK-0123-WF-02-domain-service \
  --title "feat(reservation): [TASK-0123/WF-02] add duplicate booking policy" \
  --body-file .github/PULL_REQUEST_BODY.md
```

Task PR:

```bash
gh pr create \
  --base dev \
  --head task/TASK-0123-reservation-duplicate-check \
  --title "feat(reservation): complete duplicate booking prevention" \
  --body-file .github/TASK_PULL_REQUEST_BODY.md
```

생성 후 확인:

```bash
gh pr view
gh pr checks
```

명령의 성공 결과를 확인하지 않고 PR이 생성되었다고 보고하지 않는다.

## 8. 리뷰 기준

### Workflow PR

- Parent TASK와 Workflow Scope 일치
- Acceptance Criteria와 연결
- 도메인 경계 준수
- API Contract 일치
- 예외 및 오류 응답
- 인증·권한 검증
- 개인정보와 Secret
- 테스트의 유효성
- DB Migration 안전성
- 성능 영향
- Rollback
- 문서 일치
- 불필요한 변경 없음

### Task PR 추가 기준

- 모든 필수 Workflow 포함
- Workflow 간 통합 문제 없음
- 모든 Acceptance Criteria 충족
- 통합·회귀 테스트 수행
- 배포 순서와 Rollback 명확
- 후속 작업이 별도 TASK로 분리됨

## 9. 승인과 리뷰 대응

- 저장소 Ruleset의 승인 수를 따른다.
- 별도 규칙이 없으면 비작성자 1명 이상 리뷰를 원칙으로 한다.
- 보안, DB Migration, 운영 인프라 변경은 관련 담당자 리뷰가 필요하다.
- 작성자는 자신의 PR을 승인한 것으로 처리하지 않는다.
- 리뷰 의견을 임의로 무시하거나 Resolve하지 않는다.
- 반영한 Commit과 변경 내용을 리뷰 답변에 기록한다.

## 10. 병합 금지 조건

다음 중 하나라도 해당하면 병합하지 않는다.

- 필수 CI 실패 또는 진행 중
- 필수 승인 부족
- 해결되지 않은 리뷰 의견
- 잘못된 PR Base
- Merge Conflict
- 문서와 실제 변경 불일치
- 미실행 테스트를 통과로 기록
- Scope 밖 변경
- Secret 또는 민감정보 가능성
- DB 호환성·Rollback 검토 누락
- Merge Authority 미충족

다음 기능으로 우회하지 않는다.

```text
Merge without waiting for requirements
Admin bypass
Skip required checks
Branch Protection 우회
```

## 11. Conflict 해결

Conflict는 표시 제거가 아니라 양쪽 변경 의도의 통합이다.

순서:

1. 충돌 파일과 양쪽 Commit 확인
2. Parent TASK와 Workflow Scope 확인
3. API Contract, ERD, DECISIONS 확인
4. 양쪽 변경 의도 비교
5. 최종 동작 결정
6. Conflict Marker 제거
7. Format, Build, Test 재실행
8. 해결 내용을 Workflow와 PR에 기록

다음 명령을 전체 파일에 무분별하게 사용하지 않는다.

```bash
git checkout --ours .
git checkout --theirs .
```

파일별로 의도를 확인한 뒤 제한적으로 사용한다.

### Migration Conflict

금지:

- 이미 공유된 Migration 번호 변경
- 이미 적용된 Migration 내용 수정
- 충돌 회피를 위한 임의 파일 삭제
- 실행 순서 검증 없이 번호만 조정

필요하면 새 보상 Migration을 만든다.

## 12. Merge Authority

기본값:

```text
Human-only
```

병합 가능 조건:

- 사용자의 현재 지시가 명확히 허용하거나
- TASK Metadata의 `Merge Authority`가 허용하고
- 저장소 권한과 모든 필수 조건을 충족함

모호하면 병합하지 않고 PR 상태까지만 보고한다.

## 13. Merge 방식

### Workflow PR

기본:

```text
Squash and merge
```

Squash Commit 예:

```text
feat(reservation): [TASK-0123/WF-02] add duplicate booking policy (#205)
```

Target:

```text
workflow/* → task/*
```

허용된 경우 명령:

```bash
gh pr merge <PR-NUMBER> --squash --delete-branch
```

### Task PR

기본:

```text
Squash and merge
```

Squash Commit 예:

```text
feat(reservation): complete duplicate booking prevention (#223)
```

Target:

```text
task/* → dev
```

허용된 경우 명령:

```bash
gh pr merge <TASK-PR-NUMBER> --squash --delete-branch
```

### `main`

`main` 병합은 일반 TASK 작업과 분리된 Release 또는 Hotfix 절차로만 수행한다.

필요 조건:

- Release 정책
- 운영 승인
- Release Test
- Migration 및 Rollback 검토
- 배포 일정과 책임자

## 14. Workflow 병합 후 확인

```bash
git fetch origin --prune
git switch task/TASK-0123-reservation-duplicate-check
git pull --ff-only origin task/TASK-0123-reservation-duplicate-check
git log -5 --oneline
```

확인:

- Workflow Squash Commit 존재
- 예상 파일 반영
- 후속 Workflow Base로 사용 가능
- 즉시 발생한 통합 문제 없음

통합 수정이 필요하면 새 Workflow Branch를 만든다.

```text
workflow/TASK-0123-WF-04-integration-fix
```

Task Branch에 직접 수정하지 않는다.

## 15. Task 병합 후 확인

```bash
git fetch origin --prune
git switch dev
git pull --ff-only origin dev
git log -5 --oneline
```

확인:

- Task Squash Commit 존재
- Issue가 의도대로 종료
- Task Branch 삭제 여부
- 다음 TASK가 최신 `dev`에서 시작 가능

이미 병합된 Task Branch를 추가 수정에 재사용하지 않는다.
