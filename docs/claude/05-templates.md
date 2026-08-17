# TASK · Workflow · PR 템플릿

이 문서는 새 문서를 만들거나 기존 문서 형식을 정리할 때 읽는다.  
`{{...}}` 자리표시자를 실제 값으로 바꾸고, 해당 없는 항목은 삭제하지 말고 `N/A — 사유`로 작성한다.

---

## 1. TASK.md 템플릿

```markdown
# {{TASK-ID}}: {{TASK 제목}}

## Metadata

| Field | Value |
|---|---|
| Task ID | {{TASK-ID}} |
| Status | Draft |
| Priority | {{High / Medium / Low}} |
| Owner | {{담당자}} |
| Created At | {{YYYY-MM-DD}} |
| Updated At | {{YYYY-MM-DD}} |
| Related Issue | {{#번호 또는 N/A}} |
| Base Branch | develop |
| Task Branch | task/{{TASK-ID}}-{{slug}} |
| Merge Authority | Human-only |
| Decision References | {{DECISIONS / ADR}} |
| Rule References | {{CLAUDE / AGENTS / RULE}} |
| Dependencies | {{선행 TASK 또는 없음}} |

## Goal

{{완료 후 달성할 결과}}

## Background

{{현재 문제와 TASK가 필요한 이유}}

## Input

- {{요구사항}}
- {{관련 문서}}
- {{기존 코드 또는 데이터}}

## Scope

### Included

- {{이번 TASK에 포함}}

### Excluded

- {{이번 TASK에서 제외}}
- {{별도 TASK로 분리}}

## Acceptance Criteria

- [ ] AC-01: {{검증 가능한 완료 조건}}
- [ ] AC-02: {{검증 가능한 완료 조건}}

## Dependencies

- {{선행 TASK / Workflow / 외부 API / 환경}}

## Risks

- {{기능 위험}}
- {{보안 위험}}
- {{데이터·배포 위험}}

## Rollback Strategy

{{코드, 데이터, 설정 Rollback 방법}}

## Step / Workflow Index

| Step | Workflow | Description | Status | Branch | PR | Dependency |
|---|---|---|---|---|---|---|
| STEP-01 | WF-01 | {{설명}} | Draft | {{branch}} | - | 없음 |

## Steps

### STEP-01

| Field | Content |
|---|---|
| Step Name | {{이름}} |
| Goal | {{결과}} |
| Input | {{입력}} |
| Scope | {{포함·제외}} |
| Instructions | {{실행 순서}} |
| Output Format | {{산출물}} |
| Constraints | {{제약·금지}} |
| Done When | {{검증 조건}} |
| Duration | {{Small / Medium / Large}} |
| RULE Reference | {{관련 규칙}} |

## Integration Validation

| Type | Command or Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Build | {{명령}} | 성공 | 미실행 | Not Run |
| Test | {{명령}} | 전체 통과 | 미실행 | Not Run |

## Definition of Done

- [ ] 모든 필수 Workflow가 Done이다.
- [ ] 모든 Acceptance Criteria가 검증되었다.
- [ ] 통합 및 회귀 테스트를 통과했다.
- [ ] 보안, 권한, 예외 처리를 검토했다.
- [ ] DB 호환성과 Rollback을 검토했다.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] Task PR 필수 CI가 통과했다.
- [ ] 필수 리뷰가 완료되었다.
- [ ] 해결되지 않은 리뷰 의견이 없다.
```

---

## 2. Workflow 문서 템플릿

```markdown
# {{WF-ID}}: {{Workflow 제목}}

## Metadata

| Field | Value |
|---|---|
| Workflow ID | {{WF-ID}} |
| Parent Task | {{TASK-ID}} |
| Parent Step | {{STEP-ID}} |
| Status | Draft |
| Owner | {{담당자}} |
| Created At | {{YYYY-MM-DD}} |
| Updated At | {{YYYY-MM-DD}} |
| Base Branch | task/{{TASK-ID}}-{{slug}} |
| Branch | workflow/{{TASK-ID}}-{{WF-ID}}-{{slug}} |
| Pull Request | 미생성 |
| Related Issue | {{#번호 또는 N/A}} |
| Dependencies | {{WF-ID 또는 없음}} |
| Affected Paths | {{경로}} |
| Decision References | {{DECISIONS / ADR}} |
| Rule References | {{CLAUDE / AGENTS / RULE}} |

## Goal

{{Workflow 완료 결과}}

## Input

- {{Parent TASK}}
- {{선행 Workflow 결과}}
- {{API Contract / ERD / 결정 문서}}

## Scope

### Included

- {{포함 변경}}

### Excluded

- {{후속 Workflow 또는 TASK에서 처리}}

## Preconditions

- {{선행 병합}}
- {{환경, 데이터, 권한}}

## Constraints

- {{도메인 경계}}
- {{보안}}
- {{호환성}}
- {{금지 구현}}

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | - | - |
| 03 | ERD / 데이터 | No | N/A — 변경 없음 | - | - |
| 04 | API Contract | Yes | Draft | - | - |
| 05 | DTO | Yes | Draft | - | - |
| 06 | Domain | Yes | Draft | - | - |
| 07 | Service | Yes | Draft | - | - |
| 08 | Controller | No | N/A — 후속 WF | - | - |
| 09 | View / Client | No | N/A — 후속 WF | - | - |
| 10 | Test | Yes | Draft | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

## Expected Output

- {{변경 파일}}
- {{테스트}}
- {{문서}}

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Unit | {{명령}} | 통과 | 미실행 | Not Run |
| Build | {{명령}} | 성공 | 미실행 | Not Run |
| Manual | {{절차}} | {{기대 결과}} | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| {{YYYY-MM-DD}} | Draft | - | - | Workflow 생성 |
```

---

## 3. HISTORY.md 템플릿

```markdown
# {{TASK-ID}} History

| Date | Type | ID | Status | Branch | Commit | PR | Validation | Description |
|---|---|---|---|---|---|---|---|---|
| {{YYYY-MM-DD}} | Task | {{TASK-ID}} | Draft | task/{{...}} | - | - | 문서 검토 | TASK 생성 |
| {{YYYY-MM-DD}} | Workflow | {{WF-ID}} | In Progress | workflow/{{...}} | {{hash}} | - | Unit Passed | 구현 시작 |
```

기록해야 하는 사건:

- 상태 변경
- Scope 또는 Acceptance Criteria 변경
- Branch 생성과 Base 변경
- Commit과 Push
- PR 생성·Draft 해제·병합
- Rebase와 `--force-with-lease`
- 테스트 성공·실패·미실행
- Conflict 해결
- Migration 또는 Rollback 변경
- 별도 TASK 분리

---

## 4. Workflow PR 본문 템플릿

```markdown
## Parent

- Task: {{TASK-ID}}
- Workflow: {{WF-ID}}
- Parent Step: {{STEP-ID}}
- Related Issue: {{#번호}}
- Base Branch: task/{{TASK-ID}}-{{slug}}
- Workflow Document: `{{문서 경로}}`

## Goal

{{Workflow 목표}}

## Scope

### Included

- {{포함 변경}}

### Excluded

- {{제외 또는 후속 Workflow}}

## Changes

- {{코드 변경}}
- {{테스트 변경}}
- {{문서 변경}}

## Decisions

- {{선택한 방법과 이유}}
- {{배제한 대안}}

## Validation

| Command or Method | Result |
|---|---|
| `{{명령}}` | {{Passed / Failed / Not Run}} |

## Contract / Database / Security

- API Compatibility: {{내용}}
- DB Migration: {{내용}}
- Authorization: {{내용}}
- PII / Secret: {{내용}}
- External API: {{내용}}

## UI Evidence

{{Screenshot 또는 N/A — UI 변경 없음}}

## Risks

- {{알려진 위험}}
- {{미확인 항목}}

## Rollback

{{되돌리는 방법}}

## Checklist

- [ ] TASK와 Workflow Scope 안의 변경만 포함한다.
- [ ] Workflow 문서를 갱신했다.
- [ ] 테스트를 실제로 실행했다.
- [ ] 실패 또는 미실행 테스트를 숨기지 않았다.
- [ ] 보안과 권한을 검토했다.
- [ ] DB와 API 호환성을 검토했다.
- [ ] Secret과 로컬 설정이 포함되지 않았다.
- [ ] PR Base가 Task Branch인지 확인했다.
- [ ] 해결되지 않은 리뷰 의견이 없다.

Refs {{#Issue}}
```

---

## 5. Task PR 본문 템플릿

```markdown
## Task

- Task ID: {{TASK-ID}}
- Related Issue: {{#번호}}
- Task Document: `{{TASK 문서 경로}}`
- Head: task/{{TASK-ID}}-{{slug}}
- Base: develop

## Goal

{{TASK 최종 결과}}

## Acceptance Criteria

- [x] AC-01: {{조건}}
- [x] AC-02: {{조건}}

## Included Workflow PRs

| Workflow | PR | Status | Description |
|---|---|---|---|
| WF-01 | {{#번호}} | Merged | {{설명}} |

## Integrated Changes

- {{전체 변경}}
- {{API / DB / UI / 설정}}

## Integration Validation

| Command or Method | Result |
|---|---|
| `{{명령}}` | {{Passed / Failed / Not Run}} |

## Compatibility

- Existing API: {{내용}}
- Existing Data: {{내용}}
- Previous Client: {{내용}}
- Deployment Order: {{내용}}

## Security

- Authentication: {{내용}}
- Authorization: {{내용}}
- PII: {{내용}}
- Input Validation: {{내용}}

## Risks and Remaining Work

- {{위험}}
- {{별도 TASK}}

## Rollback

- Code: {{방법}}
- Database: {{방법}}
- Configuration: {{방법}}

## Final Checklist

- [ ] 모든 필수 Workflow PR이 병합되었다.
- [ ] 모든 Acceptance Criteria가 검증되었다.
- [ ] 통합·회귀 테스트를 통과했다.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] 미완료 작업은 별도 TASK로 분리했다.
- [ ] 필수 CI와 승인을 충족했다.
- [ ] 해결되지 않은 리뷰 의견이 없다.

Closes {{#Issue}}
```

---

## 6. 작업 시작 보고 템플릿

```text
Task: {{TASK-ID}}
Workflow: {{WF-ID}}
Parent Step: {{STEP-ID}}
Mode: {{Simple Task / Composite Task}}
Base Branch: {{base}}
Working Branch: {{branch}}
Target PR Base: {{target}}
Scope: {{포함 범위}}
Excluded Scope: {{제외 범위}}
Affected Paths: {{경로}}
Validation Plan: {{검증 계획}}
Decision / RULE References: {{문서}}
```

---

## 7. 작업 완료 보고 템플릿

```text
Task: {{TASK-ID}}
Workflow: {{WF-ID}}
Status: {{상태}}
Branch: {{branch}}
Base Branch: {{base}}

Changed Files:
- {{파일}}

Commits:
- {{hash}} {{message}}

Validation:
- {{검증}}: {{Passed / Failed / Not Run — 사유}}

Push:
- {{Completed / Not performed}}

Pull Request:
- {{#번호 / Not created}}

Merge:
- {{Completed / Not performed — 사유}}

Remaining Risks:
- {{위험 또는 없음}}

Follow-up Task:
- {{TASK-ID 또는 없음}}
```
