# TASK-0001 History

| Date | Type | ID | Status | Branch | Commit | PR | Validation | Description |
|---|---|---|---|---|---|---|---|---|
| 2026-08-17 | Task | TASK-0001 | Draft | task/TASK-0001-landing-public-gate | - | - | 문서 검토 | TASK 생성. 랜딩 공개 게이트 해소와 기준선 계측 범위 확정 |
| 2026-08-17 | Workflow | WF-01 | Draft | workflow/TASK-0001-WF-01-provider-selection | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-02 | Draft | workflow/TASK-0001-WF-02-abuse-defense | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-03 | Draft | workflow/TASK-0001-WF-03-email-confirmation | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-04 | Draft | workflow/TASK-0001-WF-04-privacy-runbook-alignment | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-05 | Draft | workflow/TASK-0001-WF-05-cost-cap-observability | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Workflow | WF-06 | Draft | workflow/TASK-0001-WF-06-public-decision-baseline | - | - | Not Run | Workflow 문서 생성 |
| 2026-08-17 | Task | TASK-0001 | Ready | task/TASK-0001-landing-public-gate | efdd9e9 | - | 문서 검증 Passed | AC-01~AC-12, STEP-01~03, WF-01~WF-06 분할 완료. 소유자 승인 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | - | - | Not Run | WF-01 착수에 따른 상태 전이 |
| 2026-08-17 | Workflow | WF-01 | In Progress | workflow/TASK-0001-WF-01-provider-selection | - | - | Not Run | 공급자·데이터 처리 사실 조사 시작 |
| 2026-08-17 | Workflow | WF-01 | Blocked | workflow/TASK-0001-WF-01-provider-selection | - | - | 문서 대조 4건 Passed, 2건 Not Run | ADR-20260817-003 초안 작성. 소유자 확인 6건 미완으로 ACCEPTED 전환 불가 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | - | - | Not Run | WF-01 조사 결과로 Scope 변경: WF-04에 D1 Time Travel 잔존 기간 반영 추가, TASK Risks 2건 추가 |
| 2026-08-17 | Workflow | WF-01 | Blocked | workflow/TASK-0001-WF-01-provider-selection | - | - | 문서 대조 Passed | 소유자 입력으로 Cloudflare 플랜 Workers Free 확정. 대안 2개(Amazon SES, Brevo) 조사했으나 데이터 저장 위치·무료 한도를 확인하지 못해 비교 미완 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | - | - | Not Run | Scope 변경: 쟁점 3(Free 플랜 D1 읽기 전용 전환)을 WF-05에 추가, TASK Risks 2건 추가 |
| 2026-08-17 | Workflow | WF-01 | Blocked | workflow/TASK-0001-WF-01-provider-selection | - | - | 공식 문서 조회 Passed | 요금·레지던시 페이지를 직접 조회해 미확인 6건 해소. Turnstile Free 무료, SES 서울 리전 지원·1,000건당 $0.16 확정. Cloudflare Email은 Workers Paid 전용 Beta로 배제 |
| 2026-08-17 | Workflow | WF-01 | Blocked | workflow/TASK-0001-WF-01-provider-selection | - | - | 소유자 실행 확인 | **프로덕션 D1 부재 확인.** `wrangler d1 info site-creator-d1`이 계정에서 DB를 찾지 못함. 기존 검증이 전부 로컬 D1이었음이 드러남 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | - | - | Not Run | Scope 변경: 쟁점 4(D1 부재·위치 변경 불가)를 반영. TASK Risks 3건 추가, WF-06 판정 기준에서 실행 계획 88행 체크 승계 금지 |
| 2026-08-17 | Workflow | WF-01 | Done | workflow/TASK-0001-WF-01-provider-selection | e6c64bc | - | 문서 대조 Passed | 소유자 선택으로 ADR-20260817-003 ACCEPTED. Turnstile Free, Amazon SES `ap-northeast-2`, D1 위치 `apac` 확정 |
| 2026-08-17 | Workflow | WF-07 | Draft | workflow/TASK-0001-WF-07-d1-provisioning | - | - | Not Run | 프로덕션 D1 프로비저닝 Workflow 신설. 최초 계획에 없었으며 WF-01 조사 결과로 추가 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | - | - | Not Run | Scope 변경: WF-07 추가, AC-13~AC-15 추가, WF-03·WF-05·WF-04·WF-06 의존에 WF-07 반영 |
| 2026-08-17 | Workflow | WF-08 | Review | workflow/TASK-0001-WF-08-lockfile-integrity | - | - | lock 복구 Passed, `npm test` 8개 Passed | WF-02 PR #2에서 Landing CI 첫 실행이 `npm ci` 단계에서 실패. `package-lock.json`의 `@emnapi/core`·`@emnapi/runtime` 누락이 원인이며 WF-02와 무관한 기존 결함이라 분리 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | 55dad7c | - | N/A — 문서 변경 | 소유자 지시로 Merge Authority를 `Human-only`에서 `Auto-after-checks`로 변경. `docs/claude/03` §10 병합 금지 조건은 그대로 적용 |
| 2026-08-17 | Workflow | WF-08 | Review | workflow/TASK-0001-WF-08-lockfile-integrity | - | #3 | Landing CI `verify` **Passed (55s)** | WF-08 PR #3에서 CI 통과 확인. lock 복구가 `npm ci` 실패를 해소함이 입증됨 |
| 2026-08-17 | Workflow | WF-08 | In Progress | workflow/TASK-0001-WF-08-lockfile-integrity | - | #3 | N/A — Conflict 해결 | Task Branch의 Merge Authority 커밋과 HISTORY 표 행이 충돌. 양쪽 행을 모두 보존해 해결. 원인은 WF-08 병합 전에 Task Branch를 먼저 수정한 순서 오류 |

## 기록해야 할 사건과 현재 상태

### 2026-08-17 — TASK 생성 시점의 사실

**저장소 준비 작업 (TASK-0001 이전, `develop`에 반영됨)**

- `03511af docs: adopt task and workflow execution rules` — `CLAUDE.md` 작업 실행 규칙 절과 `docs/claude/01~05` 추가
- `ec9da88 docs: archive published wiki document set` — `wiki/` v1·v2 문서 세트 30개 파일 보관
- `develop`을 `ec9da88`로 fast-forward 하고 `origin`에 최초 push. 이력 재작성 없음
- 위 두 커밋은 TASK-0001 범위가 아니며, TASK 문서가 참조하는 규칙·템플릿을 통합 브랜치에 올리기 위한 선행 정리다

**미해결 규칙 불일치**

- `CLAUDE.md` 3절과 5절이 통합 브랜치를 `dev`로 표기하나, 실제 통합 브랜치는 `develop`이다. 이 TASK의 모든 문서는 `develop`을 Base로 쓴다. 표기 정정은 별도 chore TASK로 분리했다
- `.github/workflows/landing.yml`의 `push` 트리거가 `main`만 대상으로 한다. `develop` push는 CI가 돌지 않는다. `pull_request` 트리거는 Base와 무관하게 동작하므로 Workflow PR과 Task PR에서는 CI가 동작한다
- 저장소 루트에 `.gitignore`가 없다. `landing/.gitignore`만 존재하며, `.omc/` 같은 도구 상태 디렉터리가 untracked로 남는다

**검증 미실행 사실**

- 이 시점에 `landing/`의 `npm test`, `npm run lint`, `npm audit`을 실행하지 않았다. TASK-0001은 문서만 추가하며 코드를 변경하지 않는다
- 각 Workflow의 Validation 표는 전부 `Not Run` 상태다

**Scope 판단 근거**

- `wiki/` v2 문서 세트(요구사항 136건, ERD 43테이블, TC 235건)는 `wiki/README.md` 3행이 역사 참조본으로 명시하므로 구현 범위에서 제외했다
- 앱·계정·결제·건강데이터·개인화는 `ADR-20260814-002`가 현재 단계 제외 범위로 명시하므로 제외했다
- A/B 테스트는 `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 110행이 기준선 확보 우선을 명시하므로 제외했다

**코드 확인으로 좁혀진 범위**

- `landing/db/schema.ts` 11행의 `verified_at` 컬럼, `landing/db/landing-storage.ts` 5·21~22행의 미확인 14일 삭제 조건, `landing/worker/index.ts` 169행의 `scheduled` 핸들러가 이미 구현되어 있다
- 따라서 WF-03의 신규 범위는 확인 토큰 발급·발송·검증과 `verified_at` 설정으로 한정되며, 만료 삭제와 예약 작업은 회귀 확인 대상이다
