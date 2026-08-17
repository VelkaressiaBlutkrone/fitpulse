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
| 2026-08-17 | Workflow | WF-01 | Done | workflow/TASK-0001-WF-01-provider-selection | 08bd8f4 | #1 | 문서 대조 Passed | PR #1 squash 병합. Task Branch에 반영 확인 |
| 2026-08-17 | Workflow | WF-02 | In Progress | workflow/TASK-0001-WF-02-abuse-defense | - | - | Not Run | 설계 결정 3건 확정 후 실패 테스트 선작성. `turnstileToken` 미지원으로 400 실패 확인 |
| 2026-08-17 | Workflow | WF-02 | Review | workflow/TASK-0001-WF-02-abuse-defense | 3c9e5c5 | - | `npm test` 12개 Passed, lint Passed, audit Passed | Turnstile 서버 검증·클라이언트 위젯·CSP 구현 |
| 2026-08-17 | Workflow | WF-02 | Done | workflow/TASK-0001-WF-02-abuse-defense | - | - | 수동 검증 5건 Passed, 1건 Not Run | 공개 테스트 키로 실제 siteverify 응답 계약 양방향 검증. `.dev.vars` gitignore 누락 수정. 실기기 뷰포트 QA만 Not Run |
| 2026-08-17 | Workflow | WF-02 | Review | workflow/TASK-0001-WF-02-abuse-defense | - | #2 | Landing CI `verify` **Failed** | PR #2에서 Landing CI 첫 실행이 `npm ci` 단계에서 실패. 원인은 `package-lock.json`의 optional 의존성 누락이며 WF-02 변경과 무관 |
| 2026-08-17 | Workflow | WF-08 | Review | workflow/TASK-0001-WF-08-lockfile-integrity | ee18c94 | - | lock 복구 Passed, `npm test` 8개 Passed | 위 CI 실패 원인을 `docs/claude/01` §11에 따라 별도 Workflow로 분리 |
| 2026-08-17 | Workflow | WF-08 | Review | workflow/TASK-0001-WF-08-lockfile-integrity | - | #3 | Landing CI `verify` **Passed (55s)** | lock 복구가 `npm ci` 실패를 해소함이 입증됨 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | 55dad7c | - | N/A — 문서 변경 | 소유자 지시로 Merge Authority를 `Human-only`에서 `Auto-after-checks`로 변경. `docs/claude/03` §10 병합 금지 조건은 그대로 적용 |
| 2026-08-17 | Workflow | WF-08 | In Progress | workflow/TASK-0001-WF-08-lockfile-integrity | 6874bdd | #3 | `npm test` 8개 Passed | Task Branch의 Merge Authority 커밋과 HISTORY 표 행이 충돌. 양쪽 행을 모두 보존해 해결. 원인은 WF-08 병합 전에 Task Branch를 먼저 수정한 순서 오류 |
| 2026-08-17 | Workflow | WF-08 | Done | workflow/TASK-0001-WF-08-lockfile-integrity | 5b2e933 | #3 | Landing CI Passed (58s) | PR #3 squash 병합. Task Branch에 lock 복구 반영 확인 |
| 2026-08-17 | Workflow | WF-02 | Review | workflow/TASK-0001-WF-02-abuse-defense | 69afbdc | #2 | `npm test` 12개 Passed, lint Passed | WF-08 병합분을 WF-02에 반영. HISTORY 표 행 충돌을 양쪽 보존으로 해결 |
| 2026-08-17 | Workflow | WF-02 | Done | workflow/TASK-0001-WF-02-abuse-defense | 06d76b0 | #2 | Landing CI Passed (1m1s) | PR #2 squash 병합. `landing/app/lib/turnstile.ts` 등 산출물 반영 확인 |
| 2026-08-17 | Task | TASK-0001 | In Progress | task/TASK-0001-landing-public-gate | - | - | N/A — 문서 변경 | WF-01·WF-02·WF-08 병합 완료를 Workflow Index에 반영. 남은 필수 Workflow는 WF-03·WF-04·WF-05·WF-06·WF-07 |
| 2026-08-17 | Workflow | WF-07 | Done | workflow/TASK-0001-WF-07-d1-provisioning | 93a7557 | #4 | 확인 5건 Passed, 원문 대조 3건 Not Run | PR #4 squash 병합. 플랫폼 데이터 처리 사실 기록, D1 위치 결정과 SES 국외이전 회피 근거 철회 |
| 2026-08-17 | Workflow | WF-09 | Done | workflow/TASK-0001-WF-09-retention-without-cron | 6f7e6a2 | #6 | Landing CI Passed (1m9s), `npm test` 15개 Passed | PR #6 squash 병합. 삭제 경로 3개 확보. 배포 후 관찰 2건은 Not Run |
| 2026-08-17 | Workflow | WF-05 | In Progress | workflow/TASK-0001-WF-05-cost-cap-observability | b52ff94 | #5 | 문서 검증 Passed | PR #5 squash 병합. **비용 전제 정정과 WF-09 신설만 완료.** 월 상한 금액 결정, 감지 수단 확인, 중단 절차는 미착수 |

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

### 2026-08-17 — WF-07 전제 오류와 정정

WF-07은 "프로덕션 D1을 직접 생성한다"로 정의되어 있었다. 착수 중 이 전제가 틀렸음을 확인하고 재정의했다.

**확인한 사실**

- `landing/.openai/hosting.json`에 `project_id`와 `d1: "DB"`가 있다.
- `landing/vite.config.ts` 24~33행이 `database_id`를 플레이스홀더로 하드코딩하고 `migrations_dir`를 `dist/.openai/drizzle`로 지정한다.
- `landing/build/sites-vite-plugin.ts` 27~42행이 `hosting.json`과 `drizzle/`를 `dist/.openai/`로 패키징한다.

즉 이 랜딩은 OpenAI Sites 플랫폼 배포 패키지를 만들고, **D1은 플랫폼이 프로비저닝한다.** 플레이스홀더 `database_id`는 결함이 아니라 의도된 설계이며, Cloudflare 계정에 D1이 없는 것도 정상 상태다.

**되돌린 조치**

| 실행 | 되돌림 | 확인 |
|---|---|---|
| `wrangler d1 create fitpulse-landing --location=apac` (`cabbfb2c-f7c5-494f-84da-c8fb974fdcce`, APAC) | `wrangler d1 delete --skip-confirmation` | `d1 list`가 `[]` 반환 |
| `worker/wrangler.jsonc`의 `database_name`·`database_id` 변경 | `git checkout --` | 원래 값 복원 |
| `package.json`에 `db:migrate:remote` 추가 | `git checkout --` | 제거 확인 |

생성한 데이터베이스에는 테이블·데이터가 없었고(`num_tables: 0`) 어떤 배포와도 연결되지 않아 데이터 손실은 없다.

**원인과 재발 방지**

배포 대상과 빌드 파이프라인을 먼저 읽지 않고 `wrangler d1 info` 결과만으로 결함을 판단했다. 인프라 관련 판단 전에는 `vite.config.ts`, 빌드 플러그인, 호스팅 설정을 먼저 확인한다.

**영향**

- `ADR-20260817-003`의 "D1 위치 힌트 `apac`" 결정을 철회했다.
- WF-07을 "배포 플랫폼의 데이터 처리 사실 확인"으로 재정의했다.
- AC-13·AC-14를 플랫폼 기준으로 다시 썼다.
- WF-01의 미확인 항목 5(랜딩 호스팅의 실제 위치와 로그 보존)가 이 TASK에서 가장 중요한 미확인 항목이 되었다.

### 2026-08-17 — WF-07 플랫폼 데이터 처리 확인 결과

`docs/verification/fitpulse-landing-platform-data-handling-20260817.md`에 상세 기록.

**확인된 사실 5건**

| 항목 | 결과 |
|---|---|
| 데이터 레지던시 | **미지원** — 배포된 Sites, 코드, D1/R2 저장, 아티팩트, 로그 전부 |
| 책임 구조 | 소유자 **Controller**, OpenAI **Processor**. "Hosted Data"로 정의 |
| Hosted Data 범위 | 사용자 제공분 + **로그·사용·기기정보·쿠키 수집분** |
| 재수탁자 | 웹호스팅·인프라·모더레이션 제공, **보안·안전 분류기를 페이지에 실행** |
| 삭제 후 보존 | 삭제 요청 후 **내부 최대 30일** |
| 금지 데이터 | PHI·결제카드 처리 금지. `ADR-20260814-002` 제외 범위와 일치 |

**Not Run 3건** — `help.openai.com`과 `openai.com/policies`가 HTTP 403을 반환해 원문 대조, 재수탁자 명단·소재국, Sites 로그 보존 기간을 확인하지 못했다. 근거는 검색 결과에 인용된 문구다.

**영향**

- `ADR-20260817-003`의 SES 서울 선택 근거 중 **"국외 이전 고지를 피할 수 있다"를 철회**했다. 이메일 원본이 저장되는 D1의 위치를 통제할 수 없으므로 고지는 어차피 필요하다. 선택 자체(발송 수탁자 국내화, 낮은 단가)는 유지한다.
- WF-04는 수탁자 목록에 OpenAI와 그 재수탁자를 넣고, **저장 국가를 특정할 수 없다는 사실**, 로그·기기정보 수집, 페이지 분류기 실행, 삭제 후 30일 보존을 안내에 반영해야 한다.
- WF-06은 실행 계획 104행 조건 2를 "처리 국가 확정 불가, 수탁 2단 구조 확인, 삭제 후 30일 보존"으로 판정하되 Not Run 3건을 명시한다.
- WF-01이 기록한 Cloudflare D1 Time Travel 7일은 **우리 계정 기준이며 이 배포에 적용되지 않는다.**

### 2026-08-17 — 배포 플랫폼 cron 미지원 발견과 WF-09 신설

WF-05 착수 전 비용 전제를 재확인하다가 두 가지가 드러났다.

**1. 예약 작업(cron) 미지원 — 보존 정책 차단 요인**

> "ChatGPT Sites is not a fit for anything that needs ... scheduled background workers"
> "background services and long-running jobs are prohibited"

현재 보존 정책 전체가 `worker/index.ts` 169행의 `scheduled` 핸들러와 `"crons": ["17 3 * * *"]`에 의존한다. 프로덕션에서 실행되지 않으면 미확인 이메일 14일 삭제와 365일 보존이 지켜지지 않는다.

기존 통합 테스트의 보존 검증은 `/cdn-cgi/local/scheduled`를 **수동 호출**해 통과한 것이며, 프로덕션 cron 실행의 근거가 아니다. 이 한계를 검증 문서에 명시했다.

**WF-09(예약 작업 없이 보존 기간 준수)를 신설**했다. 구현 방안 후보 3개(지연 정리 / 외부 스케줄러 / 병행)를 제시하고 착수 시 선택하도록 했다.

**2. 비용 전제 오류 정정**

ChatGPT Sites는 유료 플랜에 번들되며 사이트당 요금·호스팅 청구가 없다. **Workers·D1 종량 비용을 소유자가 부담하지 않는다.**

따라서 WF-01이 기록한 다음 두 항목은 이 배포에 적용되지 않는다.

- "Free 플랜 D1 일일 한도 초과 시 읽기 전용 전환" — 우리 Cloudflare 계정 기준
- "Workers Logs 3일 보존, Logpush 불가" — 같은 사유

실제 신규 지출은 SES 발송비(월 3,000건 기준 약 $0.48)와 유료 채널 집행비로 좁혀지며 500,000원 상한에 여유가 크다. WF-05의 실질 위험은 금액 초과가 아니라 **Sites 플랜 한도 소진**으로 옮겨갔고, 그 수치는 제품 내부에만 표시되어 미확인이다.

**근거의 한계**: 두 사실 모두 2차 자료(기술 블로그)가 인용한 OpenAI 문서 문구에 근거한다. `help.openai.com` 403으로 원문을 대조하지 못했다.

### 2026-08-17 — WF-09 구현 (예약 작업 없는 보존 정리)

소유자 승인으로 **후보 C(지연 정리 + 외부 스케줄러 병행)**를 채택했다. 후보 A 단독은 트래픽이 없을 때 삭제가 실행되지 않아 배제했다.

**삭제 경로 3개** — 셋 중 하나라도 동작하면 보존 기간이 지켜진다.

| 경로 | 트리거 | 게이트 | 한계 |
|---|---|---|---|
| 1. 예약 작업 | 플랫폼 cron | 없음 | 지원 여부 미확인 |
| 2. 요청 시점 정리 | 쓰기 요청 후 `waitUntil` | 마지막 실행 후 6시간 | 트래픽 없으면 미실행 |
| 3. 외부 스케줄러 | GitHub Actions 일 1회 | 없음 | 공개 전 호출 불가 |

기존 `scheduled` 핸들러와 `crons` 선언은 제거하지 않았다. 플랫폼이 지원하면 그대로 쓰인다.

**보안 결정 2건**

- 정리 엔드포인트는 `Authorization` 헤더로만 토큰을 받는다. 질의 문자열 토큰은 인정하지 않는다 — 접근 로그와 Referer에 남기 때문이다
- `MAINTENANCE_TOKEN` 미설정 환경에서는 **모든 정리 요청을 401로 거부**한다. 인증 없는 삭제 트리거를 열어두지 않는다

**검증**: `npm test` 15개 통과(신규 3개), lint 오류 0, audit 0건, 마이그레이션은 신규 파일만 추가.

**Not Run 2건**: 배포 후 플랫폼 cron 실행 여부 관찰, 실제 배포본에서 만료 데이터 삭제 확인. 둘 다 공개 후에만 가능하다.

**남은 한계**: 공개 직후 트래픽이 없고 시크릿이 미설정이면 어느 경로도 실행되지 않는다. WF-04에서 개인정보 안내에 반영해야 한다.

### 2026-08-17 — 실행 우선순위 재조정 (배포 보류, 로컬 개발 우선)

소유자 지시로 **배포·공개 관련 작업을 전부 뒤로 미루고 로컬 개발을 우선**한다. TASK의 Goal과 Scope는 바꾸지 않았고 **실행 순서만 조정**했다.

| 구분 | 대상 |
|---|---|
| 우선 진행 | WF-03(이메일 확인 — 어댑터 대체 구현으로 로컬 완결), 이어서 WF-04(안내 정합화) |
| 보류 | WF-05, WF-06, Turnstile 운영 키 발급, GitHub 시크릿 등록, Worker 시크릿 주입 경로 확인, AWS 프로덕션 액세스 승인, OpenAI 문서 원문 대조 3건 |

**보류는 취소가 아니다.** 공개 판정 전에 모두 해소해야 하며, 그때까지 랜딩은 소유자 전용 상태를 유지한다.

로컬 개발 중에도 `ADR-20260814-002`의 제외 범위(계정·인증·결제·건강데이터·개인화)와 fail-closed 설계는 그대로 적용한다.

WF-05·WF-06을 `Blocked — 배포 보류`로 표시했다. `docs/claude/01` §2의 `Blocked` 정의(외부 의존·결정으로 진행 불가)에 해당한다.
