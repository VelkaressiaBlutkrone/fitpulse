# WF-02: 공개 트래픽 남용 방어 서버 검증

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-02 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Review |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-02-abuse-defense |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `landing/app/lib/turnstile.ts`(신규), `landing/app/lib/api-handlers.ts`, `landing/app/lib/input.ts`, `landing/app/api/waitlist/route.ts`, `landing/app/components/WaitlistForm.tsx`, `landing/app/page.tsx`, `landing/worker/index.ts`, `landing/tests/rendered-html.test.mjs` |
| Decision References | `ADR-20260814-002`, WF-01 산출 ADR |
| Rule References | `CLAUDE.md` 절대 조건 2, `docs/claude/04-validation-checklists.md` |

## Goal

WF-01에서 선정한 남용 방어 수단을 대기자 등록·설문·삭제 경로에 적용하고, **서버 측에서** 방어 토큰을 검증한다. 토큰이 없거나 위조·만료된 요청이 거부되는 것을 자동 테스트로 확인한다. 기존 세션 기반 요청 제한(`request_rate_limits`)은 유지하며 이를 대체하지 않는다.

## Input

- WF-01 산출 ADR — 선정된 남용 방어 수단과 서버 검증 엔드포인트
- `landing/app/lib/api-handlers.ts` — 현재 요청 처리와 응답 규약
- `landing/app/lib/input.ts` — 현재 입력 파싱·거부 규칙
- `landing/app/lib/session.ts` — 현재 HttpOnly 세션 처리
- `landing/tests/rendered-html.test.mjs` — 기존 프로덕션 Worker 통합 시험 8개
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 96~102행 — 기존 보안 경계 기록

## Scope

### Included

- 방어 토큰의 서버 측 검증 로직
- 검증 실패 시 응답 규약 정의와 구현
- 클라이언트 폼의 토큰 획득·전달
- 검증 실패·성공에 대한 실패 테스트 선작성과 최소 구현
- 방어 수단이 수집·전송하는 정보 범위의 확인. 확인 결과는 이 문서에 기록해 WF-04의 입력으로 전달한다. `landing/app/privacy/page.tsx` 자체는 이 Workflow에서 변경하지 않는다

### Excluded

- 이메일 확인 흐름 — WF-03
- 개인정보 안내 전체 정합화 — WF-04
- 비용 상한과 중단 조건 — WF-05
- 공개 판정 — WF-06
- 기존 `request_rate_limits` 정책 변경 — 현행 유지

## Preconditions

- WF-01의 PR이 Task Branch에 병합되어 `ADR-20260817-003`이 `ACCEPTED`다. 방어 수단은 **Cloudflare Turnstile Free 플랜**으로 확정되었다.
- 자동 테스트에는 Cloudflare가 공개한 테스트 sitekey(`1x00000000000000000000AA`)와 테스트 secret key를 사용한다. 프로덕션 secret key는 더미 토큰을 거부하므로 테스트에 쓰지 않는다.
- 실제 sitekey·secret key는 Cloudflare Secret으로 주입하며 저장소에 커밋하지 않는다. 테스트용 공개 키는 Cloudflare 문서에 공개된 값이므로 커밋할 수 있다.
- 이 Workflow는 원격 D1을 요구하지 않으므로 WF-07과 병렬로 진행할 수 있다.

## Constraints

- 클라이언트 측 검증만으로 방어를 주장하지 않는다. 서버가 거부하지 않으면 방어로 인정하지 않는다.
- 검증 실패 응답이 이메일 존재 여부, 내부 ID, 스택 트레이스를 노출하지 않는다.
- 방어 토큰과 방어 수단이 반환하는 식별자를 `landing_events` 속성에 넣지 않는다.
- 기존 보안 헤더, 교차 사이트 거부, 중복 등록 방지 동작을 회귀시키지 않는다.
- 실제 사이트 키·시크릿 키를 저장소에 커밋하지 않는다.
- 방어 수단이 방문자 데이터를 제3국으로 전송하면 그 사실을 고지 문구 초안에 반영한다.

## 설계 결정

2026-08-17 소유자 선택으로 확정했다.

### 결정 1 — siteverify 엔드포인트를 환경변수로 주입한다

`siteverify` URL을 Worker 환경변수 `TURNSTILE_VERIFY_URL`로 두고, 기본값은 Cloudflare 실제 엔드포인트(`https://challenges.cloudflare.com/turnstile/v0/siteverify`)로 한다. 자동 테스트에서만 로컬 스텁 서버를 가리키도록 `wrangler dev --var`로 덮어쓴다.

- 채택 이유: 테스트가 외부 네트워크에 의존하지 않아 결정적이고, Cloudflare 장애가 CI를 깨뜨리지 않는다.
- **대가**: 실제 Cloudflare 응답 계약(응답 필드, 오류 코드)은 자동 테스트로 검증되지 않는다. 수동 QA에서 실제 키로 확인하고 그 결과를 기록한다.
- 배제한 대안: Cloudflare 공식 테스트 키로 실제 호출 — 계약까지 검증되나 CI가 외부 네트워크에 의존한다.

### 결정 2 — 검증 실패는 403으로 명시적으로 거부한다

기존 허니팟(`company` 필드)은 봇에게 202로 위장 응답하고 저장만 생략한다. Turnstile 검증 실패는 이와 다르게 **403으로 명시적으로 거부**한다.

- 채택 이유: 위젯 만료 등으로 실패한 실제 사용자가 재시도해야 하는데, 202로 위장하면 등록된 줄 알고 이탈한다. 토큰 유효성은 이메일 존재 여부와 무관하므로 403이 정보를 노출하지 않는다.
- 응답 본문은 오류 코드만 담고 Cloudflare가 반환한 `error-codes` 원문을 그대로 노출하지 않는다.

### 결정 3 — 시크릿 미설정 시 fail-closed

`TURNSTILE_SECRET_KEY`가 설정되지 않은 환경에서는 등록 요청을 **거부**한다(503). 설정 누락은 운영 오류이며, 방어가 꺼진 채로 공개되는 것보다 등록이 실패하는 편이 안전하다.

이 결정으로 기존 통합 테스트가 시크릿 없이는 실패하게 된다. 기존 테스트에 시크릿·스텁 주입을 추가하는 것이 이 Workflow의 범위에 포함된다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Done | 설계 결정 3건 기록 | - |
| 02 | 보안 모델 | Yes | Done | fail-closed, 403 거부, `error-codes` 미노출, CSP 출처 한정 | - |
| 03 | ERD / 데이터 | No | N/A — 새 테이블·컬럼을 만들지 않음 | - | - |
| 04 | API Contract | Yes | Done | `turnstileToken` 필드 추가, 403·503 응답 규약 | - |
| 05 | DTO | Yes | Done | `WaitlistInput.turnstileToken`, `TurnstileConfig`·`TurnstileResult` | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음. 요청 수용 조건만 추가 | - | - |
| 07 | Service | Yes | Done | `app/lib/turnstile.ts` 신규 | - |
| 08 | Controller | Yes | Done | `api-handlers.ts`, `api/waitlist/route.ts`, `worker/index.ts` | - |
| 09 | View / Client | Yes | Done | `WaitlistForm.tsx` 위젯·토큰 전달, `page.tsx` sitekey 주입 | - |
| 10 | Test | Yes | Done | 통합 테스트 12개 통과 (신규 3개 포함) | - |
| 11 | 문서 / HISTORY | Yes | Done | 이 문서와 HISTORY 갱신 | - |

## Expected Output

- 변경 파일
  - `landing/app/lib/api-handlers.ts` — 방어 토큰 검증 분기 추가
  - `landing/app/lib/input.ts` — 토큰 필드 파싱과 형식 거부
  - `landing/app/components/WaitlistForm.tsx` — 토큰 획득과 전달
  - `landing/worker/wrangler.jsonc` — 필요한 바인딩·시크릿 참조 선언
- 추가 테스트 (`landing/tests/`)
  - 토큰 누락 요청 거부
  - 위조 토큰 요청 거부
  - 만료 토큰 요청 거부
  - 유효 토큰 요청 수용
  - 검증 실패 응답에 이메일 존재 여부·내부 ID 미노출
  - 방어 토큰이 `landing_events` 저장 행에 남지 않음
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 신규 테스트 포함 전체 통과 | **12개 전부 통과** (기존 9 + 신규 3) | Passed |
| Lint | `cd landing && npm run lint` | 오류 0 | 출력 없음 (오류 0) | Passed |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 0 | `found 0 vulnerabilities` | Passed |
| Test | 토큰 누락 요청 거부 | 403 `turnstile_required`, siteverify 미호출 | 통과 | Passed |
| Test | 위조 토큰 거부 | 403 `turnstile_failed` | 통과 | Passed |
| Test | 만료 토큰 거부 | 403 `turnstile_failed` | 통과 | Passed |
| Test | 유효 토큰 수용 | 202, siteverify 1회 호출 | 통과 | Passed |
| Test | 응답에 `error-codes` 원문 미노출 | 0건 | 통과 | Passed |
| Test | 허니팟 요청이 siteverify를 호출하지 않음 | 0회 | 통과 | Passed |
| Test | CSP가 방어 출처만 좁게 허용 | `script-src`·`frame-src`에만 추가 | 통과 | Passed |
| Test | 폼이 `cf-turnstile-response`를 전달하고 시크릿을 담지 않음 | 일치 | 통과 | Passed |
| Security | `git diff`에서 시크릿·키 문자열 검색 | 0건 | 0건 | Passed |
| Manual | 실제 Cloudflare 키로 `siteverify` 응답 계약 확인 | 실제 응답과 구현 일치 | 미실행 | **Not Run — 실제 sitekey·secret 미발급** |
| Manual | 375×812 뷰포트에서 위젯 포함 폼 제출 흐름 | 제출 성공, 가로 넘침 없음 | 미실행 | **Not Run — 실제 sitekey 미발급으로 위젯 미렌더링** |
| Manual | D1 `landing_events` 저장 행 조회로 토큰·식별자 부재 검산 | 0건 | 미실행 | **Not Run — 원격 D1 부재(WF-07 선행)** |

### 미실행 검증이 남은 이유

- 실제 Turnstile sitekey·secret key가 아직 발급되지 않았다. 자동 테스트는 설계 결정 1에 따라 로컬 스텁으로 검증했으므로, **실제 Cloudflare 응답 계약은 검증되지 않았다.**
- 위젯은 `turnstileSiteKey`가 없으면 렌더링되지 않으므로 실기기 QA를 할 수 없다.
- 이 세 항목은 키 발급 후 수행하며, WF-06 공개 판정의 입력이다.

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — 실패 테스트 선작성 후 통과 확인
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성 |
| 2026-08-17 | In Progress | - | - | 설계 결정 3건(검증 URL 주입, 403 거부, fail-closed) 확정 후 실패 테스트 선작성 |
| 2026-08-17 | Review | - | - | 서버 검증·클라이언트 위젯·CSP 구현 완료. `npm test` 12개, lint, audit 통과. 실제 키가 필요한 수동 검증 3건은 Not Run |
