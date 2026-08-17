# TASK-0004 History

| Date | Type | ID | Status | Branch | Commit | PR | Validation | Description |
|---|---|---|---|---|---|---|---|---|
| 2026-08-17 | Task | TASK-0004 | Draft | task/TASK-0004-landing-public-release-decision | - | - | N/A — 문서 생성 | TASK 생성. TASK-0001 WF-10에서 분리된 배포 의존 범위를 승계 |
| 2026-08-17 | Workflow | WF-01 | Draft | workflow/TASK-0004-WF-01-cost-cap-observability | - | - | Not Run | TASK-0001 WF-05를 승계해 Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-02 | Draft | workflow/TASK-0004-WF-02-public-decision-baseline | - | - | Not Run | TASK-0001 WF-06을 승계하고 배포 의존 검증 해소를 추가해 Workflow 문서 생성 |

## 기록해야 할 사건과 현재 상태

### 2026-08-17 — TASK 생성 경위

이 TASK는 새로 발견된 요구사항이 아니라 **TASK-0001에서 분리된 범위**다. 분리 자체는 TASK-0001의 WF-10에서 수행했으며, 이 문서는 승계 결과를 기록한다.

**분리한 이유**

TASK-0001의 WF-05(비용 상한)와 WF-06(공개 판정)은 2026-08-17 소유자의 배포 보류 지시로 `Blocked` 상태가 되었다. `docs/claude/01-task-workflow.md` §9는 필수 Workflow가 모두 `Done`이어야 TASK를 `Review`·`Done`으로 옮길 수 있다고 규정하므로, 두 Workflow가 TASK-0001의 마감을 막았다.

그 결과 TASK-0001 안의 모든 변경이 `develop`에 도달하지 못했고, 그 안에 있던 `landing/package-lock.json` 복구(WF-08)도 갇혔다. `develop`의 lock은 `npm ci`가 요구하는 `@emnapi` 항목 3개 중 1개만 가진 상태로 남아 통합 브랜치에서 분기한 모든 PR의 CI를 실패시켰다.

```text
git show origin/develop:landing/package-lock.json | grep -c '"node_modules/@emnapi'   → 1
git show origin/task/TASK-0001-landing-public-gate:landing/package-lock.json | ...    → 3
```

즉 **배포를 기다리는 문서 작업 2개가 코드 수정의 통합을 막고 있었다.** 결합을 끊는 것이 분리의 목적이다.

**승계 관계**

| TASK-0001 | TASK-0004 | 상태 |
|---|---|---|
| WF-05 비용 상한·중단 조건 | WF-01 비용 상한·중단 조건과 플랜 한도 확인 | WF-05는 `Cancelled — 대체` |
| WF-06 공개 판정·기준선 계측 | WF-02 배포 의존 검증 해소와 공개 판정·기준선 계측 | WF-06은 `Cancelled — 대체` |
| AC-09, AC-10, AC-11, AC-12, AC-15 | AC-01, AC-02, AC-03, AC-04, AC-05 | 이관 |

Workflow 번호를 재사용하지 않은 것은 `docs/claude/01-task-workflow.md` §1을 따른 것이다. TASK가 달라졌으므로 번호 공간도 다르다.

**TASK-0001 WF-05에서 이미 완료된 부분**

WF-05는 완전 미착수가 아니었다. PR #5로 **비용 전제 정정과 WF-09 신설**이 병합되었다. 그 결과(ChatGPT Sites 번들 요금 구조, Workers·D1 종량 비용 미부담, 실질 위험이 Sites 플랜 한도로 이동)는 TASK-0004 WF-01의 "확정된 입력"으로 승계했으므로 다시 조사하지 않는다.

**추가한 범위**

TASK-0001이 `Not Run`으로 남긴 배포 의존 검증을 WF-02에 넣었다. 배포가 있어야 수행할 수 있고 동시에 공개 판정의 입력이기 때문이다.

- 실제 SES 연동·발송 검증 (WF-03)
- 배포본 개인정보 안내 검산 (WF-04)
- 배포본 삭제·보존 동작 확인, 플랫폼 cron 실행 여부 관찰 (WF-09)
- OpenAI 문서 원문 대조 3건 (WF-01·WF-07)
- 실기기 또는 지정 뷰포트 QA

### 2026-08-17 — 착수 전 알아야 할 것

**최상위 차단 요인은 Worker 시크릿 주입 경로다.**

`wrangler secret put`을 쓸 수 없고, `chatgpt.com/sites` → More actions → Settings에 환경변수 항목이 있는지 확인되지 않았다. fail-closed 설계상 시크릿이 없으면 **모든 등록이 503으로 거부된다.** 이것이 확인되지 않으면 WF-02의 배포 의존 검증 대부분이 성립하지 않는다.

따라서 WF-02의 첫 실행 항목으로 지정했다. 확인 불가로 판명되면 설계 변경이냐 플랫폼 변경이냐의 결정이 필요해지며, 그 판단은 소유자에게 보고한다.

**근거 강도의 한계**

레지던시 미지원, cron 미지원, 비용 구조는 전부 **2차 자료가 인용한 OpenAI 문서 문구**에 근거한다. `help.openai.com`과 `openai.com/policies`가 HTTP 403을 반환해 원문을 대조하지 못했다. 공개 판정의 근거 강도가 여기에 묶여 있으므로, 판정 전 원문 확인을 재시도하고 결과를 기록한다.

**이 TASK는 NO-GO로 완료될 수 있다**

GO를 목표로 삼아 확인을 생략하면 `CLAUDE.md` 절대 조건 5를 위반한다. 미확인 항목이 남은 상태의 GO는 결론으로 쓰지 않는다.

### 미실행 검증

TASK 착수 전이므로 이 TASK 범위에서 실행한 검증이 없다. Integration Validation 표는 전부 `Not Run`이며, 사유를 함께 기록했다.

TASK-0001 Task Branch에서 실행한 검증 결과(2026-08-17, `npm test` 21개 통과·lint 오류 0·audit 0건)는 TASK-0001의 기록이며 이 TASK의 근거로 쓰지 않는다.
