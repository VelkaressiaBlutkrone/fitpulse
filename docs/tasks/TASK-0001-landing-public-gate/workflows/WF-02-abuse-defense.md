# WF-02: 공개 트래픽 남용 방어 서버 검증

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-02 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-02 |
| Status | Draft |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-02-abuse-defense |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `landing/app/lib/api-handlers.ts`, `landing/app/lib/input.ts`, `landing/app/components/WaitlistForm.tsx`, `landing/worker/index.ts`, `landing/worker/wrangler.jsonc`, `landing/tests/` |
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

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | - | - |
| 03 | ERD / 데이터 | No | N/A — 새 테이블·컬럼을 만들지 않음 | - | - |
| 04 | API Contract | Yes | Draft | - | - |
| 05 | DTO | Yes | Draft | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음. 요청 수용 조건만 추가 | - | - |
| 07 | Service | Yes | Draft | - | - |
| 08 | Controller | Yes | Draft | - | - |
| 09 | View / Client | Yes | Draft | - | - |
| 10 | Test | Yes | Draft | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

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
| Test | `cd landing && npm test` | 신규 테스트 포함 전체 통과 | 미실행 | Not Run |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run |
| Audit | `cd landing && npm audit --omit=dev --audit-level=high` | high 이상 0 | 미실행 | Not Run |
| Manual | 로컬 `npm run preview`에서 토큰 없이 등록 시도 | 서버가 거부 | 미실행 | Not Run |
| Manual | D1 `landing_events` 저장 행 조회로 토큰·식별자 부재 검산 | 0건 | 미실행 | Not Run |
| Manual | 375×812 뷰포트에서 방어 위젯 포함 폼 제출 흐름 | 제출 성공, 가로 넘침 없음 | 미실행 | Not Run |
| Security | `git diff`에서 시크릿·키 문자열 검색 | 0건 | 미실행 | Not Run |

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
