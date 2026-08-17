# TASK-0005 History

| Date | Type | ID | Status | Branch | Commit | PR | Validation | Description |
|---|---|---|---|---|---|---|---|---|
| 2026-08-17 | Task | TASK-0005 | Draft | task/TASK-0005-product-build-stage | 22bfd9e | - | 참조 8건·전사 diff·`git diff --check` Passed | Spec(`docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md`) 작성. 소유자 결정 4건 확정 |
| 2026-08-17 | Task | TASK-0005 | Ready | task/TASK-0005-product-build-stage | - | - | N/A — 문서 생성 | TASK와 WF-01~WF-03 계획 작성. AC-01~AC-15 확정 |
| 2026-08-17 | Workflow | WF-01 | Ready | workflow/TASK-0005-WF-01-adr-supersede | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-02 | Ready | workflow/TASK-0005-WF-02-reference-updates | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-03 | Ready | workflow/TASK-0005-WF-03-claude-md-build-section | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Task | TASK-0005 | Ready | task/TASK-0005-product-build-stage | - | - | N/A — 문서 변경 | Scope 변경: 구 O-6(핸드오프 상태 표기)을 세션 핸드오프 작업으로 이관하고 AC-16 폐기. 소유자의 "핸드오프 기재 → 다음 세션 이관" 지시에 따름 |

## 기록해야 할 사건과 현재 상태

### 2026-08-17 — TASK 생성 경위

`ADR-20260814-002`가 회원 계정·인증·건강데이터·개인화를 현재 단계의 제외 범위로 두어 제품 기능 개발을 착수할 수 없었다. 소유자가 갱신을 지시했고, 브레인스토밍으로 범위와 방식을 확정한 뒤 이 TASK를 만들었다.

**소유자 결정 4건과 제시했던 대안**

| # | 결정 | 배제한 대안 |
|---|---|---|
| 1 | wiki v2 전체 범위 | 계정 없는 로컬 전용 앱 / 계정·서버 동기화까지 |
| 2 | 랜딩은 대기자 모집으로 유지, 제품 병렬 착수 | 랜딩 공개를 선행 조건으로 / 사전검증 종료 |
| 3 | 새 ADR로 대체 | 능력별 게이트로 개정 / 제외 범위만 해제 |
| 4 | 예산은 공백, G1 착수 전 결정 | 지금 금액 확정 |

### 제시했으나 채택되지 않은 우려 — 기록으로 남긴다

**결정 1에 대해**: wiki v2 전체 범위를 선택하면 `ADR-20260814-002`의 재개 조건 5개가 사실상 동시에 발동하고, 랜딩이 공개된 적이 없어 **수요 데이터 없이 대규모 구축에 들어간다**는 점을 선택 시점에 제시했다. 소유자가 그대로 선택했다. 이 사실을 ADR-005 본문에도 기록한다.

**결정 3에 대해**: 새 ADR로 대체하면 `ADR-20260814-002`를 죽은 문서로 표시하면서도 그 안의 랜딩 운영 기준 6개는 살려두어야 해 참조가 꼬인다는 점을 제시했다. 소유자가 선택했으므로, **6개 기준을 ADR-005 본문으로 전사**해 꼬임을 해소하는 방식으로 설계했다.

### 판단 기록 — 단계 이름을 `MVP_BUILD`가 아니라 `PRODUCT_BUILD`로 한 이유

소유자 지시는 "MVP 기능 개발"이었으나 선택된 범위는 요구사항 136건, ERD 43테이블, 관리자 웹 RBAC 5역할×27권한을 포함한다. 최소 기능 제품이 아니다. `CLAUDE.md` 절대 조건 5(검증되지 않은 성공을 보고하지 않는다)의 취지를 단계 이름에도 적용해 사실대로 붙였다. 설계 제시 시점에 근거와 함께 알렸고 소유자가 승인했다.

### 판단 기록 — ADR 번호를 004가 아니라 005로 한 이유

`TASK-0004`의 `WF-02`가 산출물로 `ADR-20260817-004-landing-public-release-decision.md`를 이미 예약했다. 004를 가져가면 그 문서를 수정해야 하므로 예약을 존중했다. ADR-005 본문에 004의 예약 사실을 적어 빈 번호가 누락으로 보이지 않게 한다.

### 판단 기록 — 계획 산출물을 스킬 기본 경로에 두지 않은 이유

브레인스토밍·writing-plans 스킬의 기본 경로는 `docs/superpowers/specs/`와 `docs/superpowers/plans/`이나, 이 저장소는 `CLAUDE.md`의 Document placement와 `docs/claude/01`·`05`가 계획 산출물의 위치와 형식을 이미 규정한다. `CLAUDE.md` 1절의 규칙 우선순위상 저장소 규칙이 스킬 기본값보다 앞선다.

- Spec → `docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md`
- 구현 계획 → 이 TASK의 `TASK.md`와 `workflows/WF-*.md`

별도 계획 문서를 만들면 같은 내용이 두 곳에 생겨 서로 어긋날 위험이 있어 만들지 않았다.

### 판단 기록 — `Merge Authority`를 `Human-only`로 둔 이유

`docs/claude/01` §4의 기본값이 `Human-only`이고, 소유자가 TASK-0001·TASK-0003에 부여한 `Auto-after-checks`는 그 TASK들에 한정된 지시였다. 이 TASK는 `CLAUDE.md`(최상위 규칙 파일)와 단계 결정 ADR을 바꾸므로 기본값을 유지한다. 소유자가 명시적으로 허용하면 변경하고 그 사실을 이 HISTORY에 기록한다.

### 미실행 검증

TASK 계획 단계이므로 이 TASK 범위에서 실행한 검증은 Spec 작성 시점의 3건뿐이다.

| 항목 | 결과 |
|---|---|
| Spec 참조 경로 8건 존재 확인 | Passed — 깨진 참조 0건 |
| `backend/`·`app/`·`admin/` 부재 확인 | Passed — 문서 기술과 일치 |
| `ADR-20260814-002` 최소 운영 기준 6개 전사 대조 | Passed — `diff` IDENTICAL |
| `git diff --check` | Passed — 경고 0건 |

Integration Validation 표의 나머지 항목은 전부 `Not Run`이며 각 Workflow에서 실행한다.
