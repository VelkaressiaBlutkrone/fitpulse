# WF-09: 예약 작업 없이 보존 기간 준수

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-09 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Review — 배포 후 관찰 2건 Not Run |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-09-retention-without-cron |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-07 |
| Affected Paths | `landing/db/landing-storage.ts`, `landing/app/lib/api-handlers.ts`, `landing/worker/index.ts`, `landing/tests/`, `docs/runbooks/fitpulse-landing-data-deletion-retention.md`, `.github/workflows/`(검토) |
| Decision References | `ADR-20260814-002` 최소 운영 기준, WF-07 검증 기록 |
| Rule References | `CLAUDE.md` 절대 조건 2·3·5, `docs/claude/04-validation-checklists.md` |

## Goal

배포 플랫폼이 예약 작업(cron)을 지원하지 않는 조건에서도 **개인정보 안내가 약속한 보존 기간이 실제로 지켜지도록** 만든다. 미확인 이메일 14일, 그 밖 데이터 365일, 요청 제한 기록 1시간 삭제가 프로덕션에서 실행되는 것을 증거로 보인다.

## Background

WF-07 조사에서 확인했다.

> "ChatGPT Sites is not a fit for anything that needs ... **scheduled background workers**"
> "background services and long-running jobs are prohibited"

현재 구현은 보존 정책 전체를 cron에 의존한다.

| 구현 | 위치 |
|---|---|
| `scheduled` 핸들러 → `purgeExpiredData(env.DB)` | `landing/worker/index.ts` 169~171행 |
| `"crons": ["17 3 * * *"]` | `landing/worker/wrangler.jsonc`, `landing/vite.config.ts` 23행 |
| 미확인 14일 / 그 밖 365일 삭제 조건 | `landing/db/landing-storage.ts` 5~6·21~22행 |

**프로덕션에서 이 트리거가 실행되지 않으면 데이터가 약속한 기간에 삭제되지 않는다.** `landing/app/privacy/page.tsx`와 `landing/README.md`가 명시한 보존 기간이 사실과 어긋나게 되며, 이는 공개 GO를 막는 차단 요인이다.

기존 통합 테스트의 보존 검증은 `/cdn-cgi/local/scheduled`를 **수동 호출**해 통과한 것이다. 로컬 Wrangler의 수동 트리거 기능이며 프로덕션 cron 실행의 근거가 아니다.

## Input

- `docs/verification/fitpulse-landing-platform-data-handling-20260817.md` 항목 7
- `landing/db/landing-storage.ts` — 기존 `purgeExpiredData` 질의
- `landing/worker/index.ts` — 기존 `scheduled` 핸들러와 요청 경로
- `landing/tests/rendered-html.test.mjs` — 기존 보존 테스트
- `docs/runbooks/fitpulse-landing-data-deletion-retention.md`

## Scope

### Included

- 배포 후 **cron이 실제로 실행되는지 관찰로 확인** — 지원되면 이 Workflow의 범위가 줄어든다
- cron이 실행되지 않는 경우의 대체 삭제 경로 구현
- 대체 경로가 실제로 만료 데이터를 지우는 것을 검증
- `scheduled` 핸들러는 **제거하지 않고 유지** — 플랫폼이 지원하면 그대로 동작하고, 아니면 대체 경로가 담당한다
- 런북에 대체 경로의 실행 조건·주기·수동 실행 절차 추가
- 보존 기간 약속과 실제 삭제 시점의 차이를 문서화

### Excluded

- 개인정보 안내 문구 갱신 — WF-04에서 이 Workflow의 결과를 입력으로 받는다
- 비용 상한 — WF-05
- 공개 판정 — WF-06
- 자체 Cloudflare 배포로의 전환 — 별도 TASK

## 채택한 방안 — 후보 C (A + B 병행)

2026-08-17 소유자 승인으로 **지연 정리와 외부 스케줄러를 함께** 구현했다.

후보 A만으로는 **트래픽이 없을 때 삭제가 실행되지 않는다.** 개인정보 보존 기간은 방문자 유무와 무관하게 지켜져야 하므로 A 단독은 채택하지 않았다.

기존 `scheduled` 핸들러와 `crons` 선언은 **제거하지 않았다.** 플랫폼이 지원하면 그대로 동작하고, 아니면 아래 두 경로가 담당한다. 셋 중 하나라도 동작하면 보존 기간이 지켜진다.

### 구현 결과

| 경로 | 트리거 | 게이트 | 한계 |
|---|---|---|---|
| 1. 예약 작업 | 플랫폼 cron | 없음 | **지원 여부 미확인** |
| 2. 요청 시점 정리 | 쓰기 요청 후 `ctx.waitUntil()` | 마지막 실행 후 6시간 | **트래픽 없으면 미실행** |
| 3. 외부 스케줄러 | GitHub Actions 일 1회 | 없음 (`force`) | 공개 전에는 호출 불가 |

변경 파일

- `landing/db/schema.ts` — `maintenance_runs` 테이블 추가 (이름, 마지막 실행 시각)
- `landing/drizzle/0002_fine_excalibur.sql` — 신규 마이그레이션
- `landing/db/landing-storage.ts` — `runRetentionPurge()`. 게이트를 통과하거나 강제 실행이면 기존 `purgeExpiredData`를 호출하고 시각을 기록한다
- `landing/app/lib/api-handlers.ts` — `handleMaintenancePurge()`. **토큰 미설정 시 모든 요청을 401로 거부**한다
- `landing/worker/index.ts` — 정리 경로 라우팅, 쓰기 요청 후 지연 정리
- `.github/workflows/retention-purge.yml` — 매일 03:20 UTC 호출

### 남은 한계 — WF-04에서 안내에 반영해야 함

경로 1의 지원 여부가 미확인이고, 경로 3은 공개 후에만 동작하며, 경로 2는 트래픽에 의존한다. **공개 직후 트래픽이 없고 시크릿이 미설정이면 어느 경로도 실행되지 않는다.**

## 최초 검토한 방안 후보

아래는 채택 전 비교한 내용이다.

### 후보 A — 요청 시점 지연 정리 (lazy cleanup)

쓰기 요청 처리 중 만료 데이터를 함께 정리한다.

- 장점: 외부 의존이 없다. 플랫폼 제약 안에서 동작한다
- 단점: **트래픽이 없으면 실행되지 않는다.** 방문이 끊긴 뒤 남은 데이터는 그대로 남는다
- 완화: 정리 대상 건수를 제한해 요청 지연을 억제하고, 마지막 정리 시각을 기록해 과도한 반복을 막는다

### 후보 B — 외부 스케줄러가 정리 엔드포인트 호출

GitHub Actions 등 저장소 밖 스케줄러가 인증된 정리 엔드포인트를 주기적으로 호출한다.

- 장점: 트래픽과 무관하게 실행된다
- 단점: 엔드포인트 인증이 필요하고, 시크릿 관리와 외부 의존이 늘어난다. 실패 시 알림 경로도 필요하다

### 후보 C — A + B 병행

지연 정리를 기본으로 두고 외부 스케줄러로 보강한다. 가장 확실하지만 구현·유지 비용이 가장 크다.

**판단 기준**: 개인정보 보존 기간은 트래픽 유무와 무관하게 지켜져야 한다. 후보 A만으로는 그 보장이 성립하지 않으므로, A 단독 채택 시 그 한계를 개인정보 안내에 명시해야 한다.

## Preconditions

- WF-07이 병합되어 cron 미지원 사실이 기록되어 있다.
- 배포 후 cron 실행 여부를 관찰할 수 있다.

## Constraints

- **기존 `scheduled` 핸들러와 `purgeExpiredData` 질의를 삭제하지 않는다.** 플랫폼이 cron을 지원하면 그대로 쓰인다.
- 삭제 대상과 기간(미확인 14일, 그 밖 365일, 요청 제한 1시간)을 임의로 바꾸지 않는다.
- 정리 작업이 사용자 요청 응답을 눈에 띄게 지연시키지 않아야 한다.
- 정리 엔드포인트를 만든다면 인증 없이 노출하지 않는다. 인증 없는 삭제 트리거는 남용 경로가 된다.
- 실제로 삭제되는 것을 확인하기 전에 "보존 기간을 준수한다"고 문서에 쓰지 않는다.
- 시크릿을 저장소에 커밋하지 않는다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | 정리 엔드포인트 인증 설계 | - |
| 03 | ERD / 데이터 | No | N/A — 스키마 변경 없음. 정리 시각 기록이 필요하면 재검토 | - | - |
| 04 | API Contract | Yes | Draft | 후보 B 채택 시 신규 경로 | - |
| 05 | DTO | No | N/A — 입력 계약 변경 없음 | - | - |
| 06 | Domain | No | N/A — 보존 정책 값은 그대로 | - | - |
| 07 | Service | Yes | Draft | 정리 실행 경로 | - |
| 08 | Controller | Yes | Draft | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | Yes | Draft | 대체 경로가 만료 데이터를 지우는지 | - |
| 11 | 문서 / HISTORY | Yes | Draft | 런북과 이 문서 | - |

## Expected Output

- 선택한 방안과 근거를 기록한 이 문서
- 대체 삭제 경로 구현
- 추가 테스트: 대체 경로 실행 후 만료 행이 사라지고 미만료 행은 남는지
- `docs/runbooks/fitpulse-landing-data-deletion-retention.md` — 대체 경로의 실행 조건·주기·수동 실행 절차
- 배포 후 cron 실행 여부 관찰 기록

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 신규·기존 테스트 통과 | **15개 전부 통과** (기존 12 + 신규 3) | Passed |
| Test | 토큰 없이 정리 호출 | 401 `unauthorized` | 통과 | Passed |
| Test | 틀린 토큰으로 정리 호출 | 401 `unauthorized` | 통과 | Passed |
| Test | 토큰을 질의 문자열로 전달 | 401 — 헤더만 인정 | 통과 | Passed |
| Test | 유효 토큰으로 정리 호출 후 만료 행 검산 | 202, 만료 대기자·이벤트 0건 | 통과 | Passed |
| Test | 정리 실행 시각이 `maintenance_runs`에 기록됨 | 1행, `last_run_at` 양수 | 통과 | Passed |
| Lint | `cd landing && npm run lint` | 오류 0 | 오류 0 | Passed |
| Audit | `npm audit --omit=dev --audit-level=high` | high 이상 0 | `found 0 vulnerabilities` | Passed |
| Build | `npm run db:generate` | 신규 마이그레이션만 추가 | `0002_fine_excalibur.sql` 생성, 기존 파일 변경 0 | Passed |
| Security | `git diff`에서 토큰 문자열 검색 | 0건 | 0건 | Passed |
| Manual | **배포 후 플랫폼 cron 실행 여부 관찰** | 실행 여부 확정 | 미실행 | **Not Run — 공개 후 관찰** |
| Manual | **실제 배포본에서 만료 데이터 삭제 확인** | 삭제 확인 | 미실행 | **Not Run — 공개 후 확인** |

## Done When

- [ ] 배포 후 cron 실행 여부가 관찰로 확정되었다
- [ ] cron이 실행되지 않는 경우 대체 경로가 구현되고 테스트로 검증되었다
- [ ] 관련 테스트 작성 및 실행
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한 검토 — 정리 트리거가 인증 없이 노출되지 않음
- [ ] 런북과 HISTORY 갱신
- [ ] CI 통과
- [ ] Parent TASK Workflow Index 갱신
- [ ] **실제 배포본에서 만료 데이터가 삭제되는 것을 확인했다.** 이 확인 없이 Done으로 표시하지 않는다

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성. WF-07 조사에서 배포 플랫폼의 cron 미지원이 확인되어 신설 |
| 2026-08-17 | Review | - | - | 후보 C(지연 정리 + 외부 스케줄러) 채택·구현. `maintenance_runs` 테이블과 마이그레이션 추가, 인증된 정리 엔드포인트, GitHub Actions 스케줄러 작성. `npm test` 15개 통과. 배포 후 관찰 2건은 Not Run |
