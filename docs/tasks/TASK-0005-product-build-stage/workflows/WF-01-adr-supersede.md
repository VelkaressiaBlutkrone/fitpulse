# WF-01: ADR-005 신설과 ADR-002 대체 표기

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-01 |
| Parent Task | TASK-0005 |
| Parent Step | STEP-01 |
| Status | Ready |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0005-product-build-stage |
| Branch | workflow/TASK-0005-WF-01-adr-supersede |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | 없음 |
| Affected Paths | `docs/decisions/ADR-20260817-005-product-build-stage.md`(신규), `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` |
| Decision References | `ADR-20260814-001`, `ADR-20260814-002` |
| Rule References | `CLAUDE.md` 절대 조건 1·5, `docs/claude/05-templates.md`, `docs/README.md` 산출물 위치 규칙 |
| Spec | `docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md` — O-1, O-2 |

## Goal

`PRODUCT_BUILD` 단계와 게이트 G1~G5를 정의한 `ADR-20260817-005`를 만들고, `ADR-20260814-002`가 대체되었음을 명시한다. 대체된 문서의 본문은 이력으로 보존한다.

## Input

- Spec의 "O-1. 새 ADR의 내용" — ADR-005가 포함할 9개 절의 내용이 확정되어 있다
- Spec의 "O-2. `ADR-20260814-002` 변경" — 변경할 3가지가 확정되어 있다
- `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` — 대체 대상이며 최소 운영 기준의 전사 원본
- `docs/decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md` — 보증 수준, 500,000원의 성격
- `wiki/FitPulse_배포가이드_v2.0_20260813.md` — 스택 근거

## Scope

### Included

- `docs/decisions/ADR-20260817-005-product-build-stage.md` 신설
- `ADR-20260814-002`의 Status를 `SUPERSEDED by ADR-20260817-005 (2026-08-17)`로 변경
- `ADR-20260814-002` 머리말에 승계 안내 추가
- `ADR-20260814-002`의 "최소 운영 기준" 절에 이관 표기 추가

### Excluded

- `docs/README.md` 갱신 — WF-02
- `TASK-0004` 참조 추가 — WF-02
- `CLAUDE.md` 보완 — WF-03
- G1~G5 게이트 산출물의 실제 작성 — 각 게이트 도달 시
- 예산 금액 결정 — 소유자, G1 착수 전
- `wiki/` 수정 — 범위 밖
- `landing/` 변경 — 범위 밖

## Preconditions

- Spec이 소유자 승인을 받았다 (2026-08-17)
- Task Branch가 최신이며 미커밋 변경이 없다

## Constraints

- **예산 금액을 적지 않는다.** 확인하지 않은 수치를 문서에 넣는 것은 `CLAUDE.md` 절대 조건 1 위반이다
- **단계 이름에 `MVP`를 쓰지 않는다.** 선택된 범위가 최소 기능 제품이 아니다
- **ADR 번호 004를 사용하지 않는다.** `TASK-0004` WF-02가 예약했다
- **`ADR-20260814-002` 본문을 삭제하지 않는다.** TASK-0001·0003·0004가 참조하는 판단 근거다
- **`wiki/README.md`를 변경하지 않는다.** wiki는 역사 자료로 유지한다
- **최소 운영 기준 6개는 손으로 다시 타이핑하지 않는다.** 명령으로 추출해 붙여넣는다. 오타 한 글자가 랜딩 규칙을 조용히 바꾼다
- `landing/`을 변경하지 않는다

## 실행 절차

### 1단계 — Branch 생성

```bash
git fetch origin --prune
git switch task/TASK-0005-product-build-stage
git pull --ff-only origin task/TASK-0005-product-build-stage
git switch -c workflow/TASK-0005-WF-01-adr-supersede
git branch --show-current
git status --short
```

기대: 현재 Branch가 `workflow/TASK-0005-WF-01-adr-supersede`, 미커밋 변경 없음.

### 2단계 — 전사 원본 추출

**ADR-002를 수정하기 전에** 최소 운영 기준 6개를 추출한다.

```bash
awk '/^## 최소 운영 기준$/,/^## 정식 문서 체계 재개 조건$/' \
  docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md \
  | grep '^- ' | tee /tmp/landing-rules-original.txt
wc -l < /tmp/landing-rules-original.txt
```

기대: 6행 출력.

**행번호로 추출하지 않는다.** 4단계에서 ADR-002에 승계 안내를 넣으면 행번호가 밀린다. 위 명령은 절 제목을 기준으로 잡으므로 밀림에 영향받지 않는다.

### 3단계 — ADR-005 작성

`docs/decisions/ADR-20260817-005-product-build-stage.md`를 만든다. Spec "O-1. 새 ADR의 내용"이 규정한 9개 절을 그대로 따른다.

**절 제목은 아래 문자열을 그대로 쓴다.** 번호를 붙이지 않는다. 4단계 검증 명령이 `## 랜딩 트랙`과 `## 예산`을 앵커로 삼으므로, `## 6. 랜딩 트랙`처럼 쓰면 검증이 실패한다.

| 절 제목 (그대로 사용) | 내용 |
|---|---|
| `## 결정` | `PREVALIDATION_LITE` → `PRODUCT_BUILD`, ADR-002 대체 |
| `## 범위` | wiki v2를 "범위 정의의 입력"으로 채택 (실행 기준 아님) |
| `## 스택과 저장소 구조` | `backend/` `app/` `admin/` `landing/` |
| `## 구축 순서` | 1~5단계 |
| `## 게이트` | G1~G5 표 + 공통 절차 |
| `## 랜딩 트랙` | 최소 운영 기준 6개 전문 + `TASK-0004`는 선행 조건 아님 |
| `## 예산` | 미정 + 상시 비용 인프라 미프로비저닝 |
| `## 보증 수준` | ADR-001 유지 + 독립 검증 아님 |
| `## 이 결정의 한계` | 수요 데이터 없이 전환했다는 사실 |

`## 랜딩 트랙` 절에서 최소 운영 기준 6개는 **`- `로 시작하는 목록**으로 적는다. 4단계 명령이 `grep '^- '`로 뽑는다. 그 절에 다른 `- ` 목록을 넣지 않는다. 넣어야 하면 4단계 명령의 앵커를 함께 조정한다.

머리말에 다음을 포함한다.

```markdown
Status: ACCEPTED — OWNER-DIRECTED
Decision date: 2026-08-17
Supersedes: ADR-20260814-002
```

`## 랜딩 트랙` 절의 최소 운영 기준은 **2단계에서 추출한 내용을 붙여넣는다.** 다시 타이핑하지 않는다.

번호에 대한 각주를 넣는다.

> `ADR-20260817-004`는 랜딩 공개 판정용으로 예약되어 있다(`TASK-0004` WF-02의 산출물). 빈 번호가 아니다.

### 4단계 — 전사 일치 검증

```bash
awk '/^## 랜딩 트랙$/,/^## 예산$/' \
  docs/decisions/ADR-20260817-005-product-build-stage.md \
  | grep '^- ' > /tmp/landing-rules-copy.txt
diff /tmp/landing-rules-original.txt /tmp/landing-rules-copy.txt \
  && echo "TRANSCRIPTION_IDENTICAL" || echo "TRANSCRIPTION_DIFFERS"
```

기대: `TRANSCRIPTION_IDENTICAL`.

`TRANSCRIPTION_DIFFERS`가 나오면 진행하지 않는다. `diff` 출력을 읽어 어느 문구가 어긋났는지 확인하고 원본으로 맞춘다. 절 제목(`## 랜딩 트랙`, `## 예산`)을 다르게 썼다면 위 명령의 앵커도 맞춰 수정한다.

### 5단계 — 참조 무결성 검증

아래 두 명령은 `ADR-20260814-002`를 대상으로 실제 실행해 동작을 확인한 것이다.

```bash
cd docs/decisions

# 마크다운 상대 링크
grep -oE '\]\((\./|\.\./)[^)]+\)' ADR-20260817-005-product-build-stage.md \
  | sed 's/^](//; s/)$//' \
  | while read -r p; do [ -e "$p" ] && echo "OK   $p" || echo "MISS $p"; done

# 백틱으로 감싼 저장소 루트 기준 경로
grep -oE '`(docs|landing|wiki)/[^`]+`|`CLAUDE\.md`' ADR-20260817-005-product-build-stage.md \
  | tr -d '`' | sort -u \
  | while read -r p; do [ -e "../../$p" ] && echo "OK   $p" || echo "MISS $p"; done

cd ../..
```

기대: `MISS` 0건. `MISS`가 나오면 경로를 고치거나 참조를 제거한다. 두 번째 명령이 아무것도 출력하지 않으면 백틱 경로가 없다는 뜻이며 정상이다.

### 6단계 — ADR-002 수정

```bash
git diff --stat  # 이 시점에 ADR-002는 아직 미변경이어야 한다
```

세 가지를 변경한다.

1. `Status: ACCEPTED — OWNER-DIRECTED` → `Status: SUPERSEDED by ADR-20260817-005 (2026-08-17)`
2. 머리말 직후에 승계 안내 추가

```markdown
> **대체됨 (2026-08-17)** — 이 결정은 `ADR-20260817-005`(제품 구축 단계)로 대체되었다.
> 현재 유효한 단계 결정은 그쪽이다. 이 문서는 랜딩 구현의 판단 근거로 보존한다.
> `TASK-0001`·`TASK-0003`·`TASK-0004`가 이 문서를 참조한다.
```

3. `## 최소 운영 기준` 절 제목 바로 아래에 이관 표기 추가

```markdown
> **이관됨** — 이 절은 `ADR-20260817-005`의 "랜딩 트랙"으로 전문 이관되었으며 그쪽이 정본이다.
> 랜딩이 유지되는 한 이 기준은 계속 구속력을 가진다. 아래 내용은 이력으로 보존한다.
```

본문의 다른 부분은 건드리지 않는다.

### 7단계 — 검증

```bash
git diff --check; echo "CHECK_EXIT:$?"
git diff --stat -- landing/   # 출력이 비어 있어야 한다
cd landing && npm test 2>&1 | tail -8; cd ..
```

기대: `CHECK_EXIT:0`, `landing/` diff 비어 있음, `tests 21 / pass 21 / fail 0`.

`landing/`에 변경이 잡히면 실수로 건드린 것이므로 되돌린다.

### 8단계 — Commit과 Push

```bash
git add docs/decisions/
git diff --cached --name-status
git diff --cached --check
```

기대: 신규 1개(ADR-005), 수정 1개(ADR-002). 그 외 파일이 있으면 stage에서 뺀다.

Commit 메시지는 `docs/claude/02` §8을 따르고 `Task: TASK-0005`, `Workflow: WF-01`을 포함한다. 검증 결과를 `Validation:` 절에 실제 출력으로 적는다.

```bash
git push -u origin workflow/TASK-0005-WF-01-adr-supersede
```

### 9단계 — PR 생성

Base는 `task/TASK-0005-product-build-stage`다. `develop`이나 `main`으로 만들지 않는다. 본문은 `docs/claude/05` §4 템플릿을 따른다.

```bash
gh pr create \
  --base task/TASK-0005-product-build-stage \
  --head workflow/TASK-0005-WF-01-adr-supersede \
  --title "docs(decisions): [TASK-0005/WF-01] supersede the prevalidation ADR with the product build stage" \
  --body-file /tmp/wf01-pr-body.md
gh pr view
gh pr checks
```

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Ready | Spec O-1·O-2에서 확정 | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 변경하지 않음. 저장 금지 정보 미포함만 확인 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 결정 문서 작성이며 신규 코드 경로가 없음. 검증은 전사 `diff`, 참조 존재 확인, `landing/` 회귀로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | Ready | - | - |

## Expected Output

- `docs/decisions/ADR-20260817-005-product-build-stage.md` — Spec O-1의 9개 절, 004 예약 각주 포함
- `docs/decisions/ADR-20260814-002-prevalidation-lite-landing-first.md` — Status 변경, 승계 안내, 이관 표기. 본문 보존
- 갱신된 이 문서와 `HISTORY.md`

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Document | 2단계 추출 명령 | 6행 | 미실행 | Not Run |
| Document | 4단계 전사 `diff` | `TRANSCRIPTION_IDENTICAL` | 미실행 | Not Run |
| Document | 5단계 참조 존재 확인 | `MISS` 0건 | 미실행 | Not Run |
| Document | `git diff --check` | 경고 0건 | 미실행 | Not Run |
| Manual | ADR-005가 9개 절을 모두 포함하는지 대조 | 누락 0건 | 미실행 | Not Run |
| Manual | 예산 금액이 기입되지 않았는지 확인 | 숫자 0건 | 미실행 | Not Run |
| Manual | 단계 이름에 `MVP`가 쓰이지 않았는지 확인 | 0건 | 미실행 | Not Run |
| Manual | ADR-002 본문이 삭제되지 않았는지 확인 | 삭제 0행 | 미실행 | Not Run |
| Regression | `git diff --stat -- landing/` | 변경 0건 | 미실행 | Not Run |
| Regression | `cd landing && npm test` | 21개 통과 | 미실행 | Not Run |
| CI | Landing CI `verify` | 통과 또는 미트리거 | 미실행 | Not Run |

`landing/`을 변경하지 않으므로 Landing CI가 트리거되지 않을 수 있다. 그 경우 `N/A — 경로 미해당`으로 기록하고 Task PR 단계에서 확인한다.

## Done When

- [ ] AC-01~AC-09가 충족되었다
- [ ] 전사 `diff`가 `TRANSCRIPTION_IDENTICAL`이다
- [ ] 참조 존재 확인에서 `MISS`가 0건이다
- [ ] 예산 금액이 문서에 없다
- [ ] `ADR-20260814-002` 본문이 삭제되지 않았다
- [ ] `landing/`이 변경되지 않았고 `npm test` 21개가 통과했다
- [ ] 검증 명령과 결과를 실제 출력으로 기록했다
- [ ] 보안·권한·예외 처리 검토 — N/A, 코드 변경 없음. 저장 금지 정보 미포함 확인
- [ ] 문서와 HISTORY를 갱신했다
- [ ] CI 결과를 기록했다 (통과 또는 `N/A — 경로 미해당`)
- [ ] 해결되지 않은 리뷰 의견이 없다
- [ ] Parent TASK Workflow Index를 갱신했다

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Ready | - | - | Workflow 생성. Spec O-1·O-2를 실행 절차로 분해 |
