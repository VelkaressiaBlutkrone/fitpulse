# TASK 및 WORKFLOW 상세 규칙

이 문서는 TASK 생성, 분할, 상태 관리, Scope 변경, Workflow 완료 판단이 필요할 때 읽는다.

## 1. 식별자와 기본 경로

### 식별자

```text
TASK-0123
STEP-01
WF-01
```

- TASK ID는 생성 후 변경하지 않는다.
- Step 번호는 TASK 내부에서 유일해야 한다.
- Workflow ID는 Parent TASK 내부에서 유일해야 한다.
- 폐기된 Workflow 번호를 재사용하지 않는다.

### 권장 경로

```text
docs/
└── tasks/
    └── TASK-0123-short-description/
        ├── TASK.md
        ├── HISTORY.md
        └── workflows/
            ├── WF-01-contract.md
            ├── WF-02-domain-service.md
            └── WF-03-integration-validation.md
```

기존 저장소에 정해진 경로가 있으면 기존 구조를 우선한다.

## 2. TASK 상태

| 상태 | 의미 |
|---|---|
| `Draft` | 목표, Scope 또는 완료 조건이 미확정 |
| `Ready` | Acceptance Criteria, Step, Workflow 분할 완료 |
| `In Progress` | 하나 이상의 Workflow 진행 중 |
| `Blocked` | 외부 의존성, 결정, 환경 문제로 진행 불가 |
| `Review` | 통합 검증 또는 Task PR 검토 중 |
| `Done` | 완료 조건을 충족하고 Task PR 병합 가능 |
| `Cancelled` | 중단 또는 다른 TASK로 대체 |

## 3. Workflow 상태

| 상태 | 의미 |
|---|---|
| `Draft` | 실행 범위 또는 절차 미완성 |
| `Ready` | 입력, Scope, 완료 조건, 검증 방법 확정 |
| `In Progress` | 실제 작업 진행 중 |
| `Blocked` | 의존 Workflow, 환경, 권한 등으로 중단 |
| `Review` | 구현·검증 완료 후 PR 검토 중 |
| `Done` | Workflow 완료 조건 충족 |
| `Cancelled` | 폐기 또는 다른 Workflow로 대체 |

`Done`과 PR 병합 상태는 구분한다.

```text
Workflow Status: Done
PR State: Open
```

## 4. TASK 필수 구성

TASK에는 최소한 다음을 포함한다.

### Metadata

- Task ID
- Status
- Priority
- Owner
- Created At / Updated At
- Related Issue
- Base Branch
- Task Branch
- Merge Authority
- Decision / RULE References
- Dependencies

`Merge Authority` 기본값은 `Human-only`이다.

허용 값:

| 값 | 의미 |
|---|---|
| `Human-only` | 사람이 명시적으로 병합 |
| `Explicit-command` | 현재 지시에서 병합을 명시한 경우만 허용 |
| `Auto-after-checks` | 저장소 정책이 허용하고 모든 조건 충족 시 허용 |

값이 없거나 모호하면 `Human-only`로 처리한다.

### 본문

- Goal
- Background
- Input
- Included Scope
- Excluded Scope
- Acceptance Criteria
- Dependencies
- Risks
- Rollback Strategy
- Step / Workflow Index
- Integration Validation
- Definition of Done

Acceptance Criteria는 검증 가능한 문장으로 작성한다.

```markdown
- [ ] AC-01: 동일 환자의 동일 시간대 활성 예약 요청은 충돌 응답을 반환한다.
- [ ] AC-02: 취소된 예약은 중복 판정에서 제외된다.
```

다음과 같은 모호한 기준은 사용하지 않는다.

```text
적절히 처리한다.
문제가 없도록 한다.
기능을 개선한다.
```

## 5. TASK Step 필수 10개 필드

모든 Step은 다음 10개 필드를 가진다.

| 필드 | 내용 |
|---|---|
| `Step Name` | 단계의 명확한 이름 |
| `Goal` | 달성해야 할 결과 |
| `Input` | 요구사항, 데이터, 파일, 선행 결과 |
| `Scope` | 포함 및 제외 범위 |
| `Instructions` | 실행 순서 |
| `Output Format` | 산출물 형식 |
| `Constraints` | 기술·보안·호환성·금지 조건 |
| `Done When` | 검증 가능한 완료 조건 |
| `Duration` | Small / Medium / Large 또는 프로젝트 기준 |
| `RULE Reference` | 관련 규칙·결정 문서 |

해당 사항이 없는 필드는 비워두지 않는다.

```text
N/A — 이 Step에서는 DB 변경이 발생하지 않음
```

## 6. Workflow 필수 구성

### Metadata

- Workflow ID
- Parent Task
- Parent Step
- Status
- Owner
- Created At / Updated At
- Base Branch
- Working Branch
- Pull Request
- Related Issue
- Dependencies
- Affected Paths
- Decision / RULE References

### 본문

- Goal
- Input
- Included / Excluded Scope
- Preconditions
- Constraints
- Execution Checklist
- Expected Output
- Validation
- Done When
- Change History

## 7. Workflow 분할 기준

다음 중 하나라도 해당하면 별도 Workflow를 검토한다.

- 서로 다른 도메인 또는 모듈
- API Contract 확정이 후속 구현의 선행 조건
- Backend와 UI를 독립적으로 리뷰 가능
- DB Migration, 보안, 권한 변경이 별도 검토 필요
- 외부 API, LLM, 메시지 브로커 등 장애 가능성이 높은 연동
- 병렬 작업 가능
- Rollback 단위가 다름
- 하나의 PR에서 리뷰 목적이 불명확해짐

하나로 유지할 수 있는 경우:

- 동일 목적의 코드와 직접 연결된 단위 테스트
- 작은 버그 수정과 회귀 테스트
- 분리하면 빌드 또는 검증이 불가능한 변경
- 하나의 도메인 정책을 완성하는 소규모 변경

라인 수만으로 기계적으로 분리하지 않는다.

## 8. 기능 Workflow 기본 순서

적용 가능한 항목을 다음 순서로 검토한다.

1. 요구사항 정제
2. 보안 모델
3. ERD 및 데이터 변경
4. API Contract
5. DTO
6. Domain
7. Service
8. Controller
9. View 또는 Client
10. Test
11. 문서와 HISTORY

적용하지 않는 항목도 삭제하지 말고 `N/A — 사유`로 기록한다.

## 9. 상태 변경 규칙

- TASK가 `Draft`이면 Workflow를 `In Progress`로 만들지 않는다.
- 첫 Workflow 시작 시 TASK를 `In Progress`로 변경한다.
- 필수 Workflow가 모두 `Done`이어야 TASK를 `Review` 또는 `Done`으로 변경할 수 있다.
- TASK `Done` 전 통합 검증과 모든 Acceptance Criteria 확인이 필요하다.
- 상태 변경 시 날짜, 이유, 관련 Commit 또는 PR을 HISTORY에 남긴다.
- `Cancelled` ID는 재사용하지 않는다.

## 10. 단순 TASK와 복합 TASK 전환

### 단순 TASK 조건

다음을 모두 만족하면 Task Branch 하나로 처리할 수 있다.

- 필수 Workflow가 하나
- 병렬 작업 없음
- 선행 Workflow 없음
- 하나의 PR로 독립 리뷰 가능
- 변경 목적이 하나로 집중됨

단순 TASK도 `WF-01` 문서를 유지한다.

### 복합 TASK 조건

다음 중 하나라도 해당하면 복합 TASK로 처리한다.

- Workflow 둘 이상
- 병렬 작업 또는 선행 관계
- 여러 도메인·계층 변경
- DB, 보안, API, UI를 별도 리뷰해야 함
- 통합 전 개별 검증 필요

단순 TASK가 진행 중 확대되면:

1. 기존 작업을 `WF-01`로 기록한다.
2. 공유된 Git 이력은 임의 재작성하지 않는다.
3. 추가 작업부터 `WF-02` Branch를 생성한다.
4. 전환 이유를 TASK와 HISTORY에 기록한다.

## 11. Scope 변경과 발견 작업

Scope 변경 시 순서:

1. 변경 요구사항 확인
2. Included / Excluded Scope 갱신
3. Acceptance Criteria 갱신
4. 기존 Workflow 포함 여부 판단
5. 독립 변경이면 새 Workflow 생성
6. Step / Workflow Index와 Branch·PR 계획 갱신
7. 구현 시작

기존 Workflow에 포함 가능한 조건:

- 기존 Goal과 동일
- 기존 Done When에 자연스럽게 포함
- 리뷰 단위를 불필요하게 키우지 않음
- 별도 Rollback 단위가 필요 없음
- 다른 도메인을 침범하지 않음

새 Workflow 또는 TASK로 분리해야 하는 조건:

- 별도 Acceptance Criteria 필요
- 다른 도메인·계층 변경
- 별도 테스트 또는 Rollback 필요
- 기존 PR의 리뷰 목적이 흐려짐
- Workflow 완료 후 발견된 통합 문제
- 현재 TASK와 무관한 결함

이미 `develop`에 병합된 TASK Branch를 다시 사용하지 않는다. 추가 변경은 새 TASK로 시작한다.

## 12. 완료 조건

### Workflow Done

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행
- [ ] 실제 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK의 Workflow Index 갱신

### TASK Done

- [ ] 모든 필수 Workflow가 Done
- [ ] 모든 Acceptance Criteria 검증
- [ ] 통합·회귀 테스트 통과
- [ ] 보안, 권한, 예외 처리 검토
- [ ] DB 호환성과 Rollback 검토
- [ ] TASK와 HISTORY 갱신
- [ ] Task PR 필수 CI 통과
- [ ] 필수 리뷰 완료
- [ ] 해결되지 않은 리뷰 의견 없음

## 13. HISTORY 기록

최소 기록 항목:

- 날짜
- Task 또는 Workflow
- 상태
- Branch
- Commit
- PR
- Validation
- 설명

다음 사실을 숨기지 않는다.

- 테스트 미실행 또는 실패
- 임시 우회
- 미해결 위험
- Scope 변경
- PR Base 변경
- Rebase 또는 `--force-with-lease`
- Migration 변경
- Rollback 제약
