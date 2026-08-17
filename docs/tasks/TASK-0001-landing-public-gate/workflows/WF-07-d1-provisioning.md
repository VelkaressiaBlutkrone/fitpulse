# WF-07: 프로덕션 D1 프로비저닝

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-07 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-01 |
| Status | Draft |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-07-d1-provisioning |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `landing/worker/wrangler.jsonc`, `landing/README.md`, `docs/verification/`(신규) |
| Decision References | `ADR-20260817-003`, `ADR-20260814-002` |
| Rule References | `CLAUDE.md` 절대 조건 1·5, `docs/claude/04-validation-checklists.md` |

## Goal

`ADR-20260817-003`이 정한 위치 힌트 `apac`으로 프로덕션 D1 데이터베이스를 생성하고, 실제 배치된 위치를 확인해 기록한다. `landing/worker/wrangler.jsonc`의 플레이스홀더 `database_id`를 실제 값으로 교체하고, 마이그레이션을 원격에 적용한다.

## 이 Workflow가 필요한 이유

WF-01에서 `wrangler d1 info site-creator-d1`을 실행한 결과 **해당 데이터베이스가 Cloudflare 계정에 존재하지 않음**이 확인되었다. `landing/worker/wrangler.jsonc`의 `database_id: "00000000-0000-4000-8000-000000000000"`은 값을 채우지 않은 것이 아니라 가리킬 대상이 없었던 것이다.

따라서 지금까지의 모든 검증은 로컬 D1(`--local`, `.wrangler/`)에서만 이뤄졌고, 원격 D1의 데이터 위치·백업·처리 국가는 검증된 적이 없다. 이 Workflow는 최초 계획에 없었으며 WF-01 조사 결과로 추가되었다.

## Input

- `ADR-20260817-003` — 위치 힌트 `apac` 결정, Workers Free 플랜 제약
- `landing/worker/wrangler.jsonc` — 현재 D1 바인딩 선언
- `landing/drizzle/` — 적용할 마이그레이션 `0000_absent_jackal.sql`, `0001_living_lady_mastermind.sql`
- `landing/package.json` — `db:migrate:local` 스크립트 (원격용은 없음)

## Scope

### Included

- `wrangler d1 create`로 위치 힌트 `apac`을 지정해 데이터베이스 생성
- 생성 후 `wrangler d1 info`로 실제 배치 위치 확인과 기록
- `landing/worker/wrangler.jsonc`의 `database_name`·`database_id`를 실제 값으로 교체
- 원격 마이그레이션 적용 스크립트 추가 (`db:migrate:remote`)
- 기존 마이그레이션을 원격에 적용하고 결과 검산
- Time Travel 실제 복원 가능 기간을 `wrangler d1 time-travel info`로 확인
- `landing/README.md`의 데이터 설명에 원격 D1 사실 반영

### Excluded

- 남용 방어 연동 — WF-02
- 이메일 확인 흐름과 그에 따른 신규 마이그레이션 — WF-03
- 개인정보 안내 갱신 — WF-04. 이 Workflow는 확인된 위치를 기록만 하고 안내 문구는 건드리지 않는다
- 비용 상한·중단 조건 — WF-05
- 공개 판정 — WF-06
- 로컬 개발 환경 변경 — 기존 `--local` 흐름은 그대로 둔다

## Preconditions

- WF-01의 PR이 Task Branch에 병합되어 `ADR-20260817-003`이 `ACCEPTED`다.
- `wrangler login`으로 인증되어 있다. (2026-08-17 소유자 인증 완료)
- 계정이 Workers Free이며 D1 데이터베이스 10개 한도 안에 여유가 있다.

## Constraints

- **위치 힌트는 생성 시에만 지정할 수 있고 이후 변경할 수 없다.** 잘못 생성하면 새 데이터베이스를 만들어 이전해야 한다. 생성 명령 실행 전 `--location=apac`이 포함되었는지 확인한다.
- **위치 힌트는 보장이 아니다.** `apac`을 지정해도 배치 위치가 아시아·태평양이라는 보장은 없다. 확인 없이 특정 지역에 있다고 기록하지 않는다.
- 실제 `database_id`는 시크릿이 아니므로 `wrangler.jsonc`에 커밋할 수 있다. 그러나 API 토큰과 계정 ID는 커밋하지 않는다.
- 원격 마이그레이션 적용은 되돌리기 어렵다. 적용 전 대상이 신규 빈 데이터베이스인지 확인한다.
- 이미 적용된 마이그레이션 파일을 수정하지 않는다.
- Workers Free는 D1 최대 500 MB, 일 100,000 행 쓰기 제한을 받는다. 이 사실을 README에 남긴다.
- 기존 로컬 개발 흐름(`npm run preview`)이 깨지지 않아야 한다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | - | - |
| 03 | ERD / 데이터 | Yes | Draft | - | - |
| 04 | API Contract | No | N/A — 외부 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | Yes | Draft | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

## Expected Output

- 생성된 프로덕션 D1 데이터베이스
- `landing/worker/wrangler.jsonc` — 실제 `database_name`과 `database_id`
- `landing/package.json` — 원격 마이그레이션 스크립트 추가
- `docs/verification/fitpulse-landing-d1-provisioning-YYYYMMDD.md`
  - 실행한 명령과 출력 요약 (계정 ID·토큰 제외)
  - 지정한 위치 힌트와 `wrangler d1 info`가 보고한 실제 위치
  - `wrangler d1 time-travel info`로 확인한 복원 가능 기간
  - 적용된 마이그레이션 목록과 결과 테이블 목록
  - 위치가 보장되지 않는다는 사실과 그 근거
- `landing/README.md` — 원격 D1과 Free 플랜 제약 반영
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Manual | `npx wrangler d1 info <name>` | 데이터베이스 존재, 실제 위치 확인됨 | 미실행 | Not Run |
| Manual | `npx wrangler d1 time-travel info <name>` | 복원 가능 기간 확인됨 (Free 기준 7일 예상) | 미실행 | Not Run |
| Manual | 원격 마이그레이션 적용 후 테이블 목록 조회 | `waitlist_entries`, `survey_responses`, `landing_events`, `request_rate_limits` 4개 존재 | 미실행 | Not Run |
| Manual | 생성 직후 각 테이블 행 수 조회 | 전부 0건 | 미실행 | Not Run |
| Test | `cd landing && npm test` | 기존 로컬 테스트 전체 통과 (회귀 없음) | 미실행 | Not Run |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run |
| Build | `cd landing && npm run types:check` | 성공 | 미실행 | Not Run |
| Manual | `npm run preview` 실행 | 로컬 개발 흐름 정상 동작 | 미실행 | Not Run |
| Security | `git diff`에서 API 토큰·계정 ID 검색 | 0건 | 미실행 | Not Run |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — 기존 테스트 회귀 확인
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토 — 토큰·계정 ID 미포함 확인
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과 — `landing/**` 변경이 있으므로 Landing CI가 트리거된다
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신
- [ ] 실제 배치 위치가 확인되어 기록되었고, 추측으로 기재된 위치가 없음

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성. WF-01에서 프로덕션 D1 부재가 확인되어 최초 계획에 추가됨 |
