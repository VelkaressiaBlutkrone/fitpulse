# TASK-0003: 랜딩 전환 카피 재정리

## Metadata

| Field | Value |
|---|---|
| Task ID | TASK-0003 |
| Status | Review |
| Priority | Medium |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Base Branch | develop |
| Task Branch | task/TASK-0003-landing-copy |
| Merge Authority | Auto-after-checks |
| Decision References | `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` |
| Rule References | `CLAUDE.md`, `docs/claude/01-task-workflow.md` §10 |
| Dependencies | TASK-0001의 WF-03(확인 흐름)·WF-04(안내 정합화) 결과 |

## Goal

랜딩 카피를 다듬어 대기자 등록까지의 이탈 요인을 줄인다. 특히 TASK-0001에서 도입한 **이메일 확인 단계를 사전에 알려** 등록 후 이탈을 막고, 문제 서사와 FAQ를 구체화한다.

## Background

TASK-0001은 랜딩의 기능(남용 방어, 확인 흐름, 보존 정리, 개인정보 정합화)을 완성했으나 **카피는 손대지 않았다.** 당시 Scope에서 "랜딩 카피·시각 디자인 개편 — 별도 TASK"로 명시적으로 제외했다.

### 확인 단계 도입이 만든 공백

TASK-0001 WF-03에서 더블 옵트인을 넣었다. 이제 등록만으로는 완료가 아니고 **메일의 링크를 눌러야** 신청이 끝난다.

그러나 폼 제출 후 문구만 바뀌었고, **제출 전에는 확인 단계가 있다는 사실을 알리지 않는다.** 사용자가 등록 후 메일을 확인하지 않으면 14일 뒤 삭제되며 대기자 집계에 포함되지 않는다. 사전 고지가 없으면 이 손실이 커진다.

### 반응 데이터가 없다는 한계

랜딩은 소유자 전용 상태이고 외부 방문자가 0명이다. 따라서 이 TASK는 **개선을 증명할 수 없다.** 전환율 비교는 공개 후 기준선을 확보한 뒤에만 가능하다(TASK-0001 WF-06).

이 작업은 "명백한 이탈 요인 제거"와 "사실 정확성 향상"에 한정하며, 성과를 주장하지 않는다.

## Input

- `landing/app/page.tsx` — 현재 카피
- `landing/app/components/WaitlistForm.tsx` — 폼 문구
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 16~34행 — 확정된 메시지와 페이지 구성
- `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` — 표현 금지 사항
- `landing/app/privacy/page.tsx` — WF-04에서 정합화한 안내 (FAQ와 일관성 유지)

## Scope

### Included

- **확인 단계 사전 고지** — 폼 제출 전에 메일 확인이 필요함을 알린다
- 문제 서사 구체화 — 계획이 정한 "다음 중량을 감으로 정하거나 이전 기록을 찾느라 생기는 불편" 범위 안에서
- 제안 흐름 문구의 구체화
- FAQ 보강 — 확인 메일, 데이터 저장 위치를 개인정보 안내와 일관되게
- 신뢰 섹션 문구 — 계획의 "데이터 최소 수집, 삭제 요청, 효능 과장 금지"에 맞춰

### Excluded

- **메인 문구·보조 문구·CTA 변경** — 실행 계획 19~21행이 확정한 값이다. 바꾸려면 그 계획을 먼저 갱신해야 한다
- **페이지 구성(섹션 순서·종류) 변경** — 같은 계획 25~33행이 정했다
- 시각 디자인·CSS — 별도 TASK
- A/B 테스트 — 실행 계획 110행이 기준선 확보를 우선한다고 명시
- 개인정보 안내 본문 — TASK-0001 WF-04에서 정합화했다. FAQ가 그것과 어긋나지 않게만 맞춘다
- 제품 기능 추가

## Acceptance Criteria

- [x] AC-01: 폼 제출 **전에** 이메일 확인 단계가 필요함을 알리는 문구가 있다.
- [x] AC-02: 확인 링크 만료 기간(14일)이 랜딩과 개인정보 안내에서 일치한다.
- [x] AC-03: 실행 계획이 확정한 메인 문구·보조 문구·CTA가 변경되지 않았다.
- [x] AC-04: 섹션 구성이 실행 계획 25~33행과 일치한다.
- [x] AC-05: 효능 주장(의학적 안전, 부상 예방, 회복 보장)이 없다. 기존 테스트가 이를 강제한다.
- [x] AC-06: 실제 추천 기능이 이미 동작하는 것처럼 읽히는 표현이 없다.
- [ ] AC-07: FAQ가 개인정보 안내의 저장 위치·보존 기간 설명과 어긋나지 않는다. **현재 브랜치에서는 검증할 수 없다** — 아래 "FAQ와 개인정보 안내의 시차" 참조.
- [x] AC-08: `npm test`가 통과하고, 변경한 문구를 검사하는 테스트가 갱신되어 있다.

## Dependencies

- TASK-0001의 WF-03·WF-04가 `task/TASK-0001-landing-public-gate`에 병합되어 있다. **단 그 TASK는 아직 `develop`에 병합되지 않았다.**

이 TASK는 `develop`에서 분기했으므로 **확인 흐름 코드가 없는 상태**다. 따라서 카피만 다루고, 확인 흐름 코드에 의존하는 테스트는 추가하지 않는다. 두 TASK가 `develop`에서 만나면 문구와 구현이 함께 검증된다.

## Risks

- **개선을 증명할 수 없다.** 반응 데이터가 없으므로 이 변경이 전환을 올린다고 주장하지 않는다
- 카피를 고치다 실행 계획이 확정한 값을 건드릴 위험이 있다. AC-03·AC-04로 막는다
- 효능 주장 경계를 넘을 위험. 기존 테스트가 `의학적으로 안전|부상을 예방|회복을 보장`을 금지하고 있으나 다른 표현으로 우회될 수 있다
- TASK-0001과 같은 파일(`page.tsx`)을 건드리므로 `develop` 병합 시 충돌 가능. 두 TASK가 만나는 시점에 해결한다

## Rollback Strategy

문구만 변경한다. Task PR의 Squash Commit을 `git revert`하면 되돌아간다. 스키마·API·외부 리소스 변경이 없다.

## Step / Workflow Index

| Step | Workflow | Description | Status | Branch | PR | Dependency |
|---|---|---|---|---|---|---|
| STEP-01 | WF-01 | 전환 카피 재정리 | Review | task/TASK-0003-landing-copy | - | 없음 |

단순 TASK이므로 Task Branch 하나로 처리한다.

## Steps

### STEP-01

| Field | Content |
|---|---|
| Step Name | 전환 카피 재정리 |
| Goal | 확인 단계 사전 고지와 서사 구체화로 명백한 이탈 요인을 줄인다 |
| Input | 현재 카피, 실행 계획의 확정 메시지, ADR의 표현 금지 사항 |
| Scope | 포함: 문제·흐름·신뢰·FAQ 문구, 확인 단계 고지. 제외: 메인 문구·CTA·섹션 구성·CSS |
| Instructions | 1. 실행 계획이 확정한 값을 목록화해 건드리지 않을 것을 정한다. 2. 확인 단계 고지를 넣는다. 3. 문제·흐름·FAQ를 다듬는다. 4. 개인정보 안내와 대조한다. 5. 문구를 검사하는 테스트를 갱신한다. 6. `npm test`·lint를 실행한다. |
| Output Format | 갱신된 `landing/app/page.tsx`, 필요 시 테스트 |
| Constraints | 효능 주장 금지. 실제 추천 기능이 동작하는 것처럼 쓰지 않는다. 개발 전 검증 단계임을 숨기지 않는다. 실행 계획 확정 값을 바꾸지 않는다. 개인정보 안내와 어긋나는 설명을 쓰지 않는다. |
| Done When | AC-01~AC-08이 확인되었다 |
| Duration | Small |
| RULE Reference | `ADR-20260814-002` 최소 운영 기준, `docs/claude/01-task-workflow.md` §10 |

## Integration Validation

| Type | Command or Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 전체 통과 | tests 8, pass 8, fail 0 | Passed |
| Lint | `cd landing && npm run lint` | 오류 0 | 오류 0 | Passed |
| Manual | 실행 계획 확정 값(메인·보조·CTA) 대조 | 변경 0건 | 3개 모두 유지 확인 | Passed |
| Manual | 섹션 구성과 실행 계획 25~33행 대조 | 일치 | hero·problem·flow·waitlist·faq 5개 유지 | Passed |
| Manual | FAQ와 개인정보 안내 대조 | 모순 0건 | **검증 불가** — 안내의 해당 변경이 TASK-0001에 있고 develop 미병합 | Not Run — 시차 |
| Document | `git diff --check` | 경고 없음 | 경고 0건 | Passed |

## Definition of Done

- [ ] 필수 Workflow(WF-01)가 Done이다.
- [ ] 모든 Acceptance Criteria가 검증되었다.
- [ ] 효능 주장과 기능 과장이 없음을 확인했다.
- [ ] TASK와 HISTORY를 갱신했다.
- [ ] Task PR을 `develop`으로 올렸다.
- [ ] **개선 효과를 주장하지 않았다.** 반응 데이터가 없으므로 검증 불가함을 명시했다.

## FAQ와 개인정보 안내의 시차 (2026-08-17)

FAQ에 넣은 두 문구는 TASK-0001 WF-07에서 확인한 사실이다.

- "저장 국가를 특정해 알려드릴 수 없습니다"
- "배포 환경 내부에 최대 30일 남을 수 있고"

같은 사실이 개인정보 안내에도 반영되어 있으나, **그 변경은 TASK-0001 WF-04에 있고 아직 `develop`에 병합되지 않았다.** 이 TASK는 `develop`에서 분기했으므로 현재 브랜치의 `landing/app/privacy/page.tsx`는 이전 버전이며 "실제 저장 위치는 공개 전에 다시 확인해 반영합니다"라고만 적혀 있다.

즉 **FAQ가 안내보다 최신 사실을 말하는 상태**다. FAQ가 틀린 것이 아니라 안내가 낡았고, 그 수정은 이미 존재하며 병합만 남았다.

### 판단

FAQ에서 두 문구를 빼는 대신 **남기기로 했다.** 근거는 다음과 같다.

- 두 문구는 WF-07에서 출처와 함께 확인한 사실이다
- 저장 국가와 삭제 잔존은 등록 여부를 정할 때 알아야 하는 정보다. 빼면 정보를 감추는 쪽이 된다
- FAQ에 이미 개인정보 안내 링크를 걸어 정본을 가리키고 있다

### 해소 조건

TASK-0001이 `develop`에 병합되면 FAQ와 안내가 같은 사실을 말한다. **그 시점에 AC-07을 검증한다.** 그때까지 이 항목은 미검증으로 둔다.

TASK-0001은 WF-05·WF-06이 배포 보류로 `Blocked`이므로, 그 두 Workflow를 별도 TASK로 분리해야 `develop` 병합이 가능하다.
