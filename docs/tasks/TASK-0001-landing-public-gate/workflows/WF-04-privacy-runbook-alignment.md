# WF-04: 개인정보 안내·삭제 런북 정합화

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-04 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-03 |
| Status | Draft |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-04-privacy-runbook-alignment |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-02, WF-03 |
| Affected Paths | `landing/app/privacy/page.tsx`, `landing/README.md`, `docs/runbooks/fitpulse-landing-data-deletion-retention.md`, `docs/verification/`(신규), `landing/tests/` |
| Decision References | `ADR-20260814-002` 최소 운영 기준, WF-01 산출 ADR |
| Rule References | `docs/README.md` 산출물 위치·저장 금지 정보, `docs/claude/04-validation-checklists.md` |

## Goal

`landing/app/privacy/page.tsx`가 명시하는 공급자, 수집 항목, 목적, 보유 기간, 삭제 방법을 WF-01에서 확정된 공급자 사실과 WF-02·WF-03 구현 이후의 실제 데이터 흐름에 일치시킨다. 삭제·보존 런북을 같은 기준으로 갱신하고, 삭제 흐름을 실제 실행해 검산 기록을 남긴다.

## Input

- WF-01 산출 ADR — 확정된 공급자, 데이터 처리 국가, 수탁 범위, 로그·백업 보존 기간
- WF-02 병합 결과 — 남용 방어 수단이 전송하는 방문자 정보 범위
- WF-03 병합 결과 — 확인 토큰 저장 항목과 확인 흐름
- `landing/db/schema.ts` — 실제 저장 테이블과 컬럼
- `landing/db/landing-storage.ts` — 실제 보존 기간 상수와 삭제 질의
- `docs/runbooks/fitpulse-landing-data-deletion-retention.md` — 현재 런북
- `landing/app/privacy/page.tsx` — 현재 안내 문구
- `landing/README.md` — 현재 데이터·보존 설명

## Scope

### Included

- 개인정보 안내의 수집 항목을 `landing/db/schema.ts` 실제 컬럼과 대조해 갱신
- 보유 기간을 `landing/db/landing-storage.ts`의 실제 상수(미확인 14일, 그 밖 365일)와 대조해 갱신
- 수탁자 목록에 이메일 발송 공급자와 남용 방어 공급자 추가, 처리 국가 명시
- Cloudflare D1·Workers 로그·백업 보존 기간 반영
- 삭제 요청 방법과 연락 경로를 실제 동작하는 것으로 갱신
- 삭제·보존 런북을 WF-02·WF-03 이후 구조에 맞게 갱신
- 삭제 흐름 실제 실행과 D1 검산, `docs/verification/`에 기록
- `landing/README.md`의 데이터 설명 갱신
- 안내 문구와 스키마의 불일치를 잡는 자동 테스트 검토

### Excluded

- 공급자 선정 — WF-01
- 방어·확인 흐름 구현 — WF-02, WF-03
- 비용 상한 문서 — WF-05
- 공개 GO/NO-GO 판정 — WF-06
- 법률 자문 의견서 작성 — 이 TASK 범위 밖

## Preconditions

- WF-01, WF-02, WF-03의 PR이 Task Branch에 병합되어 실제 데이터 흐름이 확정되었다.
- 로컬 `npm run preview` 환경에서 등록·확인·설문·삭제를 실행할 수 있다.

## Constraints

- 확인하지 않은 공급자 동작을 완료로 주장하지 않는다(`docs/README.md` 산출물 위치 규칙, `docs/runbooks/` 항목).
- 실제 참가자 이메일, 연락처, 삭제 요청 원문을 `docs/verification/`에 남기지 않는다. 검산은 건수와 상태로만 기록한다.
- 아직 개발 전 검증 단계임을 숨기지 않는다(`ADR-20260814-002` 최소 운영 기준).
- 랜딩 반응을 제품 적합성·결제 의사·법적 적합성으로 과장하지 않는다.
- 안내 문구가 구현보다 넓은 수집·활용을 허용하도록 쓰지 않는다. 실제 수집 항목만 적는다.
- 5명 미만 소수 셀을 문서에 남기지 않는다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Draft | - | - |
| 02 | 보안 모델 | Yes | Draft | - | - |
| 03 | ERD / 데이터 | No | N/A — 스키마를 변경하지 않고 대조만 수행 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 계층 변경 없음 | - | - |
| 06 | Domain | No | N/A — 도메인 규칙 변경 없음 | - | - |
| 07 | Service | No | N/A — 서비스 로직 변경 없음 | - | - |
| 08 | Controller | No | N/A — 라우트 변경 없음 | - | - |
| 09 | View / Client | Yes | Draft | - | - |
| 10 | Test | Yes | Draft | - | - |
| 11 | 문서 / HISTORY | Yes | Draft | - | - |

## Expected Output

- `landing/app/privacy/page.tsx` — 다음 항목이 실제 구현과 일치하도록 갱신
  - 수집 항목: `waitlist_entries`, `survey_responses`, `landing_events`, `request_rate_limits`의 실제 컬럼 기준
  - 목적: 대기자 안내, 비민감 수요 측정, 남용 방지
  - 보유 기간: 미확인 이메일 14일, 그 밖 365일, 요청 제한 기록 1시간
  - 수탁자: Cloudflare(호스팅·저장·로그), 이메일 발송 공급자, 남용 방어 공급자와 각 처리 국가
  - 삭제 방법: 실제 동작하는 경로와 연락 수단
- `docs/runbooks/fitpulse-landing-data-deletion-retention.md` — 갱신된 절차
- `docs/verification/fitpulse-landing-deletion-verification-YYYYMMDD.md` — 삭제 실행 검산 기록 (대상 건수, 실행 시각, 실행 후 잔존 건수)
- `landing/README.md` — 데이터 설명 갱신
- 추가 또는 갱신된 테스트: 안내 페이지가 명시한 보유 기간 값이 `landing-storage.ts` 상수와 일치하는지 확인
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Test | `cd landing && npm test` | 전체 통과 | 미실행 | Not Run |
| Lint | `cd landing && npm run lint` | 오류 0 | 미실행 | Not Run |
| Manual | 안내 페이지 수집 항목과 `landing/db/schema.ts` 컬럼 1:1 대조 | 불일치 0건 | 미실행 | Not Run |
| Manual | 안내 페이지 보유 기간과 `landing-storage.ts` 상수 대조 | 불일치 0건 | 미실행 | Not Run |
| Manual | 안내 페이지 수탁자 목록과 WF-01 ADR 대조 | 누락 0건 | 미실행 | Not Run |
| Manual | 등록 → 삭제 요청 실행 후 D1에서 대상 행 조회 | 대상 행 0건, 연결 설문도 0건 | 미실행 | Not Run |
| Manual | 삭제 후 `landing_events`에 잔존 이벤트가 개인식별자를 포함하지 않는지 확인 | 0건 | 미실행 | Not Run |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 미실행 | Not Run |
| Document | `docs/verification/` 기록에 실제 이메일·연락처 미포함 확인 | 0건 | 미실행 | Not Run |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토
- [ ] 문서와 HISTORY 갱신
- [ ] CI 통과
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신
- [ ] 삭제 흐름 실제 실행 검산 기록이 `docs/verification/`에 존재함

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성 |
