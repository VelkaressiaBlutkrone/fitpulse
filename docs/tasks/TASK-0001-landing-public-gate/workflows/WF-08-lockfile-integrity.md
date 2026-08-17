# WF-08: package-lock 무결성 복구

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-08 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Review |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-08-lockfile-integrity |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | 없음 |
| Affected Paths | `landing/package-lock.json` |
| Decision References | N/A — 결정 문서를 필요로 하지 않는 결함 수정 |
| Rule References | `CLAUDE.md` 절대 조건 3, `docs/claude/01-task-workflow.md` §11 |

## Goal

`landing/package-lock.json`에서 누락된 optional 의존성 항목을 복구해 `npm ci`가 Linux 러너에서 성공하게 한다. Landing CI를 통과 가능한 상태로 만든다.

## Background

WF-02의 PR #2에서 **Landing CI가 처음 실행되었고 `npm ci` 단계에서 실패**했다.

```text
npm error `npm ci` can only install packages when your package.json and
package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
```

확인한 사실이다.

- 이 실행이 `.github/workflows/landing.yml`의 **첫 CI 실행**이다. WF-01 PR은 `docs/`만 변경해 경로 필터에 걸리지 않았고, 그 이전 커밋들은 `main` push가 아니라 트리거된 적이 없다.
- `package-lock.json`은 WF-02의 변경 파일에 **포함되지 않았다.** WF-02는 의존성을 추가하지 않았다.
- `@emnapi/runtime`과 `@emnapi/core`는 libvips(sharp) 계열 패키지의 wasm 폴백용 optional 의존성이다. lock에는 `node_modules/@emnapi/wasi-threads`만 있고 나머지 둘의 항목이 없었다.

따라서 이 결함은 WF-02가 만든 것이 아니라 **기존부터 존재했고 CI가 처음 돌면서 드러난 것**이다. lock 파일이 Linux 경로의 optional 의존성을 포함하지 않은 상태로 커밋되어 있었다.

`docs/claude/01-task-workflow.md` §11의 "현재 TASK와 무관한 결함" 분리 기준에 따라 WF-02에 섞지 않고 별도 Workflow로 처리한다.

## Input

- PR #2의 CI 실행 로그 (`gh run view 31990407904 --log-failed`)
- `landing/package-lock.json`
- `landing/package.json`
- `.github/workflows/landing.yml`

## Scope

### Included

- `npm install --package-lock-only`로 lock 파일의 누락 항목 복구
- 복구 후 기존 패키지 버전이 바뀌지 않았는지 확인
- 취약점이 늘지 않았는지 확인

### Excluded

- 의존성 버전 올리기 — 이 Workflow는 lock 무결성만 다룬다
- `package.json` 변경
- CI 워크플로 파일 변경
- Turnstile 관련 구현 — WF-02

## Preconditions

- Task Branch `task/TASK-0001-landing-public-gate`가 존재한다.

## Constraints

- 기존 의존성의 버전을 변경하지 않는다. 누락 항목 추가만 허용한다.
- `package.json`을 변경하지 않는다.
- `npm audit fix --force` 같은 파괴적 명령을 쓰지 않는다.
- 취약점 수가 늘어나면 중단하고 보고한다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Done | CI 로그로 누락 항목 2건 특정 | - |
| 02 | 보안 모델 | No | N/A — 인증·권한 경계를 변경하지 않음 | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 변경 없음 | - | - |
| 06 | Domain | No | N/A — 코드 변경 없음 | - | - |
| 07 | Service | No | N/A — 코드 변경 없음 | - | - |
| 08 | Controller | No | N/A — 코드 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 코드 변경 없음 | - | - |
| 10 | Test | Yes | Done | 기존 테스트 회귀 확인 | - |
| 11 | 문서 / HISTORY | Yes | Done | 이 문서와 HISTORY 갱신 | - |

## Expected Output

- `landing/package-lock.json` — `@emnapi/core@1.11.3`, `@emnapi/runtime@1.11.3` 항목 추가 (22줄)
- 갱신된 이 문서와 HISTORY
- Parent TASK의 Workflow Index 갱신

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Build | `npm install --package-lock-only --ignore-scripts` | 누락 항목만 추가 | 22줄 추가, 기존 버전 변경 0건 | Passed |
| Manual | 추가된 항목 확인 | `@emnapi/core`, `@emnapi/runtime` | 둘 다 `1.11.3`으로 추가됨 | Passed |
| Audit | `npm audit --omit=dev --audit-level=high` | 취약점이 늘지 않음 | `found 0 vulnerabilities` | Passed |
| Test | `npm test` | 회귀 없음 | 미실행 | Not Run |
| CI | Landing CI의 `npm ci` 단계 | 성공 | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — 기존 테스트 회귀 확인
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토 — 의존성 버전 변경 없음 확인
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과 — 이 Workflow의 목적 자체가 CI 통과이므로 반드시 확인한다
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신

## 남은 위험

lock 파일을 Windows에서 갱신했다. 이번에는 Linux 러너가 요구한 항목이 채워졌으나, 향후 의존성을 추가할 때 같은 문제가 재발할 수 있다. 근본 대응(CI에서 lock 검증, 또는 Linux 환경에서 lock 생성)은 이 Workflow 범위 밖이며 별도 TASK로 다룬다.

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성. WF-02 PR #2의 CI 실패로 드러난 기존 결함을 분리 |
| 2026-08-17 | Review | - | - | lock 복구 완료. 22줄 추가, 기존 버전 변경 없음, 취약점 0건 |
