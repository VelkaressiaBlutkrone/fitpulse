# WF-09: 예약 작업 없이 보존 기간 준수

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-09 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Draft |
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

## 구현 방안 후보

착수 시 하나를 선택하고 근거를 기록한다. 현재는 결정하지 않았다.

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
| Manual | 배포 후 cron 실행 여부 관찰 | 실행 여부 확정 | 미실행 | Not Run |
| Test | `cd landing && npm test` | 신규·기존 테스트 통과 | 미실행 | Not Run |
| Test | 대체 경로 실행 후 만료 행 삭제 검산 | 만료 0건, 미만료 유지 | 미실행 | Not Run |
| Manual | 정리 엔드포인트 무인증 호출 거부 (후보 B 채택 시) | 거부 | 미실행 | Not Run |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run |
| Manual | 실제 배포본에서 만료 데이터가 지워지는 것 확인 | 삭제 확인 | 미실행 | Not Run |

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
