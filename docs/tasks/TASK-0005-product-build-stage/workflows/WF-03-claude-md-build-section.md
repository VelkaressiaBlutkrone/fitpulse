# WF-03: `CLAUDE.md` 빌드·테스트 절 보완

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-03 |
| Parent Task | TASK-0005 |
| Parent Step | STEP-02 |
| Status | Ready |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0005-product-build-stage |
| Branch | workflow/TASK-0005-WF-03-claude-md-build-section |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `CLAUDE.md` |
| Decision References | `ADR-20260817-005`(WF-01 산출) |
| Rule References | `CLAUDE.md` 절대 조건 1·5, `CLAUDE.md` 1절 규칙 우선순위 |
| Spec | `docs/plans/fitpulse-product-build-stage-transition-plan-20260817.md` — O-4 |

## Goal

`CLAUDE.md` 빌드·테스트 절에 **모듈별 존재 여부와 실제 검증 명령**을 명시해, 매 작업마다 `package.json`과 디렉터리를 확인해야 하는 부담을 없앤다.

## 이 Workflow가 고치는 것과 고치지 않는 것

**최초 진단을 정정했다.** Spec의 O-4 최초 판은 "존재하지 않는 모듈의 명령을 나열하고 있다"고 적었으나, 파일을 실제로 읽은 결과 그 진단은 과했다.

`CLAUDE.md` 141~146행은 이미 다음을 하고 있다.

| 행 | 내용 |
|---|---|
| 141 | "명령 실행 전 실제 모듈 경로와 빌드 설정 파일을 읽어 해당 명령이 현재 저장소에 적용되는지 확인한다" |
| 142~144 | 전부 "**Wiki 배포 가이드에 명시된** 검증 명령은"으로 출처를 밝힌다 |
| 146 | "현재 구현 또는 빌드 설정 파일이 없는 단계에서는 실행할 수 없는 빌드·테스트를 통과했다고 보고하지 않는다" |

즉 이 절은 존재하지 않는 명령을 실행 가능한 것처럼 제시하지 않는다. **결함 정정이 아니라 누락 보완이다.**

### 실제 갭 2건

1. **유일하게 존재하는 모듈 `landing/`이 이 절에 없다.** 실제로 돌아가는 `npm test`, `npm run lint`, `npm audit --omit=dev --audit-level=high`가 적혀 있지 않다
2. **어느 모듈이 존재하고 어느 것이 미생성인지에 대한 사실 진술이 없다.** 141행은 확인 절차를, 146행은 보고 제약을 주지만 사실 자체는 없다

## Input

- `CLAUDE.md` 139~146행 — 현재 빌드·테스트 절
- `landing/package.json` — 실제 scripts
- `.github/workflows/landing.yml` — CI가 실행하는 명령
- WF-01 산출물 `ADR-20260817-005` — 구축 순서와 모듈 경로
- Spec의 "O-4. `CLAUDE.md` 변경"

## Scope

### Included

- `CLAUDE.md` 빌드·테스트 절에 모듈별 존재 여부와 검증 명령 표 추가
- 각 모듈 신설 시 이 절을 갱신한다는 규칙 추가
- Wiki 배포가이드 명령의 적용 시점 명시

### Excluded

- **기존 문장의 삭제** — 141~146행 6개 항목을 하나도 지우지 않는다
- `CLAUDE.md`의 다른 절 — 절대 조건, 작업 실행 규칙, Document placement, Skill routing을 건드리지 않는다
- ADR 작성 — WF-01
- `docs/README.md`·`TASK-0004`·핸드오프 — WF-02
- 실제 모듈 생성 — 별도 TASK
- `landing/` 코드·설정 — 변경하지 않는다

## Preconditions

- WF-01의 PR이 Task Branch에 병합되어 `ADR-20260817-005`가 존재한다 (구축 순서와 모듈 경로를 참조한다)
- Task Branch가 최신이며 미커밋 변경이 없다

## Constraints

- **기존 6개 항목을 삭제하지 않는다.** 특히 141행(사전 확인)과 146행(미실행 보고 금지)은 이 저장소의 안전장치다
- **`landing/`의 검증 명령을 추측해 적지 않는다.** `package.json`과 `landing.yml`을 읽어 확인한 것만 적는다
- 존재하지 않는 모듈의 명령을 실행 가능한 것처럼 적지 않는다
- `CLAUDE.md`의 다른 절을 건드리지 않는다. 최상위 규칙 파일이므로 변경 범위를 최소로 유지한다
- `landing/`을 변경하지 않는다

## 실행 절차

### 1단계 — Branch 생성

```bash
git fetch origin --prune
git switch task/TASK-0005-product-build-stage
git pull --ff-only origin task/TASK-0005-product-build-stage
ls docs/decisions/ADR-20260817-005-product-build-stage.md
git switch -c workflow/TASK-0005-WF-03-claude-md-build-section
```

기대: ADR-005 파일이 존재한다. 없으면 WF-01 미병합이므로 중단한다.

### 2단계 — 사실 확인

적을 내용을 추측하지 않고 읽어서 확인한다.

```bash
node -e "console.log(JSON.stringify(require('./landing/package.json').scripts, null, 2))"
grep -n "run:" .github/workflows/landing.yml
for d in backend app admin landing; do [ -d "$d" ] && echo "EXISTS $d" || echo "absent $d"; done
```

기대: `landing`만 `EXISTS`. CI가 실행하는 명령은 `npm ci`, `npm test`, `npm run lint`, `npm audit --omit=dev --audit-level=high` 4개.

### 3단계 — `CLAUDE.md` 보완

139~146행의 기존 6개 항목을 **그대로 두고**, 절 안에 표와 규칙을 추가한다.

```markdown
### 모듈별 현재 상태 (2026-08-17)

| 모듈 | 경로 | 상태 | 검증 명령 |
|---|---|---|---|
| 랜딩 | `landing/` | **존재** | `npm ci`, `npm test`, `npm run lint`, `npm audit --omit=dev --audit-level=high` |
| 백엔드 | `backend/` | **미생성** | 신설 시 이 표를 갱신한다 |
| 모바일 앱 | `app/` | **미생성** | 신설 시 이 표를 갱신한다 |
| 관리자 웹 | `admin/` | **미생성** | 신설 시 이 표를 갱신한다 |

`landing/`의 명령은 `.github/workflows/landing.yml`이 CI에서 실행하는 것과 같다.

`backend/`·`app/`·`admin/`은 `docs/decisions/ADR-20260817-005-product-build-stage.md`의 구축 순서에 따라 신설한다.
각 모듈을 신설한 Workflow가 이 표를 그 시점의 실제 빌드 설정으로 갱신한다.
위 "Wiki 배포 가이드에 명시된" 명령들은 참고 자료이며, 해당 모듈이 생성되기 전까지 이 저장소에 적용되지 않는다.
```

기존 항목은 하나도 지우지 않는다.

### 4단계 — 검증

```bash
git diff CLAUDE.md
```

확인할 것: 삭제된 행(`-`로 시작)이 없는가. 추가만 있어야 한다.

```bash
git diff CLAUDE.md | grep '^-' | grep -v '^---' | wc -l
```

기대: `0`. 0이 아니면 기존 문장을 지운 것이므로 되돌린다.

```bash
grep -c "명령 실행 전 실제 모듈 경로와 빌드 설정 파일을 읽어" CLAUDE.md
grep -c "실행할 수 없는 빌드·테스트를 통과했다고 보고하지 않는다" CLAUDE.md
```

기대: 각각 `1`. 두 안전장치 문장이 살아 있어야 한다.

```bash
git diff --check; echo "CHECK_EXIT:$?"
git diff --stat -- landing/    # 비어 있어야 한다
cd landing && npm test 2>&1 | tail -8; cd ..
```

기대: `CHECK_EXIT:0`, `landing/` 변경 0건, `tests 21 / pass 21 / fail 0`.

### 5단계 — Commit, Push, PR

```bash
git add CLAUDE.md
git diff --cached --name-status
git diff --cached --check
```

기대: `CLAUDE.md` 1개 파일만 stage.

Commit 메시지에 `Task: TASK-0005`, `Workflow: WF-03`을 포함하고, **진단을 정정했다는 사실**(결함 정정이 아니라 누락 보완)을 본문에 적는다.

```bash
git push -u origin workflow/TASK-0005-WF-03-claude-md-build-section
gh pr create --base task/TASK-0005-product-build-stage \
  --head workflow/TASK-0005-WF-03-claude-md-build-section \
  --title "docs: [TASK-0005/WF-03] record module status and landing verification commands in CLAUDE.md" \
  --body-file /tmp/wf03-pr-body.md
gh pr view
gh pr checks
```

PR 본문에 **삭제된 행이 0건임을 검증 결과로 명시한다.** 최상위 규칙 파일 변경이므로 리뷰어가 가장 먼저 확인할 항목이다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Ready | Spec O-4 (진단 정정 반영) | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 변경하지 않음 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 규칙 문서 보완이며 신규 코드 경로가 없음. 검증은 삭제 행 0건 확인과 `landing/` 회귀로 수행 | - | - |
| 11 | 문서 / HISTORY | Yes | Ready | - | - |

## Expected Output

- `CLAUDE.md` — 빌드·테스트 절에 모듈별 상태 표와 갱신 규칙 추가. 기존 6개 항목 보존
- 갱신된 이 문서와 `HISTORY.md`

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Manual | `landing/package.json` scripts 확인 후 표에 반영 | 추측 0건 | 미실행 | Not Run |
| Manual | `.github/workflows/landing.yml`의 명령과 표 대조 | 일치 | 미실행 | Not Run |
| Manual | 모듈 존재 여부 실측 후 표에 반영 | `landing`만 존재 | 미실행 | Not Run |
| Document | `git diff CLAUDE.md \| grep '^-' \| grep -v '^---' \| wc -l` | `0` (삭제 행 없음) | 미실행 | Not Run |
| Document | 안전장치 문장 2개 잔존 확인 | 각각 1건 | 미실행 | Not Run |
| Document | `CLAUDE.md`의 다른 절 미변경 확인 | 변경 0행 | 미실행 | Not Run |
| Document | `git diff --check` | 경고 0건 | 미실행 | Not Run |
| Regression | `git diff --stat -- landing/` | 변경 0건 | 미실행 | Not Run |
| Regression | `cd landing && npm test` | 21개 통과 | 미실행 | Not Run |
| CI | Landing CI `verify` | 통과 또는 미트리거 | 미실행 | Not Run |

## Done When

- [ ] AC-13, AC-14, AC-15가 충족되었다
- [ ] `git diff CLAUDE.md`에 삭제된 행이 0건이다
- [ ] 141행과 146행의 안전장치 문장이 살아 있다
- [ ] 표의 명령이 `package.json`·`landing.yml`에서 확인한 것과 일치한다. 추측이 없다
- [ ] `CLAUDE.md`의 다른 절이 변경되지 않았다
- [ ] `landing/`이 변경되지 않았고 `npm test` 21개가 통과했다
- [ ] 검증 명령과 결과를 실제 출력으로 기록했다
- [ ] 보안·권한·예외 처리 검토 — N/A, 코드 변경 없음
- [ ] 문서와 HISTORY를 갱신했다
- [ ] CI 결과를 기록했다
- [ ] 해결되지 않은 리뷰 의견이 없다
- [ ] Parent TASK Workflow Index를 갱신했다
- [ ] PR 본문에 삭제 행 0건 검증 결과를 명시했다

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Ready | - | - | Workflow 생성. `CLAUDE.md`를 실제로 읽고 최초 진단을 "결함 정정"에서 "누락 보완"으로 정정 |
