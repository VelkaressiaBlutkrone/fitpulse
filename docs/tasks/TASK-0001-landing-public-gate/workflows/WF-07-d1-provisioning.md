# WF-07: 배포 플랫폼의 데이터 처리 사실 확인

## Metadata

| Field | Value |
|---|---|
| Workflow ID | WF-07 |
| Parent Task | TASK-0001 |
| Parent Step | STEP-01 |
| Status | Review — 원문 대조 3건 Not Run |
| Owner | 개인사업자 본인 |
| Created At | 2026-08-17 |
| Updated At | 2026-08-17 |
| Base Branch | task/TASK-0001-landing-public-gate |
| Branch | workflow/TASK-0001-WF-07-d1-provisioning |
| Pull Request | 미생성 |
| Related Issue | N/A — 이슈 트래커를 사용하지 않음 |
| Dependencies | WF-01 |
| Affected Paths | `docs/decisions/ADR-20260817-003-landing-public-providers.md`, `docs/verification/`(신규), `landing/README.md` |
| Decision References | `ADR-20260817-003`, `ADR-20260814-002` |
| Rule References | `CLAUDE.md` 절대 조건 1·3·5, `docs/claude/04-validation-checklists.md` |

## Goal

대기자 이메일과 설문이 실제로 저장되는 데이터베이스의 **위치, 백업 보존, 처리 주체, 로그 보존**을 확인한다. 이 랜딩은 OpenAI Sites 플랫폼에 배포되며 D1을 플랫폼이 프로비저닝하므로, 확인 대상은 우리 Cloudflare 계정이 아니라 **배포 플랫폼**이다.

실행 계획 104행 조건 2("D1 및 호스팅 로그의 실제 처리 국가·수탁 범위·백업 보존")를 판정 가능한 상태로 만든다.

## 이 Workflow가 재정의된 경위

이 문서의 최초 판(2026-08-17)은 **"프로덕션 D1을 직접 생성한다"**였다. 그 전제는 틀렸다.

### 최초 판단과 그 오류

WF-01에서 `wrangler d1 info site-creator-d1`이 데이터베이스를 찾지 못했고, `landing/worker/wrangler.jsonc`의 `database_id`가 플레이스홀더(`00000000-0000-4000-8000-000000000000`)인 것을 근거로 **"프로덕션 D1이 없다"는 결함으로 판단**했다.

### 실제 사실

빌드 설정을 읽고 확인했다.

| 파일 | 확인 내용 |
|---|---|
| `landing/.openai/hosting.json` | `{ "project_id": "appgprj_...", "d1": "DB", "r2": null }` |
| `landing/vite.config.ts` 6~7·24~33행 | `database_name: "site-creator-d1"`, `database_id`를 `SITE_CREATOR_PLACEHOLDER_DATABASE_ID`로 **하드코딩**하고, `migrations_dir`를 `dist/.openai/drizzle`로 지정한다 |
| `landing/build/sites-vite-plugin.ts` 27~42행 | 빌드 종료 시 `.openai/hosting.json`과 `drizzle/`를 `dist/.openai/`로 패키징한다 |

즉 이 랜딩은 **OpenAI Sites 플랫폼 배포 패키지**를 만들며, D1은 그 플랫폼이 프로비저닝하고 마이그레이션도 플랫폼이 적용한다. 플레이스홀더 ID는 결함이 아니라 **의도된 설계**다. 빌드 시점에는 실제 D1 ID를 알 수 없다.

`landing/worker/wrangler.jsonc`는 빌드에 쓰이지 않는다. `package.json`의 `types:generate`·`types:check`가 타입 생성용으로만 참조한다.

**Cloudflare 계정의 D1 목록이 비어 있는 것은 결함이 아니라 정상 상태다.**

### 되돌린 조치

최초 판단에 따라 다음을 실행했고, 사실 확인 후 모두 되돌렸다.

| 실행한 것 | 되돌린 방법 | 결과 |
|---|---|---|
| `wrangler d1 create fitpulse-landing --location=apac` 로 D1 생성 (`cabbfb2c-f7c5-494f-84da-c8fb974fdcce`, APAC) | `wrangler d1 delete fitpulse-landing --skip-confirmation` | 삭제 확인됨. `d1 list`가 `[]` 반환 |
| `worker/wrangler.jsonc`의 `database_name`·`database_id` 변경 | `git checkout --` | 원래 값으로 복원 |
| `package.json`에 `db:migrate:remote` 추가 | `git checkout --` | 제거됨 |

생성한 데이터베이스에는 테이블과 데이터가 없었고(`num_tables: 0`), 어떤 배포와도 연결되지 않았으므로 데이터 손실은 없다.

### 재발 방지

배포 대상과 빌드 파이프라인을 먼저 읽지 않고 런타임 조회 결과만으로 결함을 판단한 것이 원인이다. 인프라 관련 판단 전에는 `vite.config.ts`, 빌드 플러그인, 호스팅 설정을 먼저 확인한다.

## 이 재정의가 바꾸는 것

`ADR-20260817-003`의 **"D1 위치 힌트 `apac`" 결정은 실행할 수 없다.** 우리가 D1을 만들지 않으므로 위치 힌트를 지정할 대상이 없다. 데이터 위치는 OpenAI Sites 플랫폼이 결정한다.

이에 따라 WF-01의 미확인 항목 5(랜딩 호스팅의 실제 위치와 로그 보존)는 부차 항목이 아니라 **이 TASK에서 가장 중요한 미확인 항목**이 된다. 이메일과 설문이 저장되는 곳의 처리 주체·국가·보존 기간을 모르면 개인정보 안내를 사실대로 쓸 수 없고, 공개 GO를 낼 수 없다.

## Input

- `landing/.openai/hosting.json`, `landing/vite.config.ts`, `landing/build/sites-vite-plugin.ts`
- `ADR-20260817-003` — 재작성이 필요한 D1 위치 결정
- `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 86행 — "OpenAI Sites 검증 URL"
- OpenAI Sites 플랫폼의 데이터 처리·보존 문서 (확인 대상)

## Scope

### Included

- OpenAI Sites가 프로비저닝하는 D1의 **데이터 저장 국가 또는 리전** 확인
- 해당 D1의 **백업·복원 가능 기간**(Time Travel 상당) 확인
- **처리 주체와 수탁 관계** 확인 — 데이터 관리자가 소유자인지 플랫폼인지, 재수탁 구조가 어떠한지
- 플랫폼의 **접근 로그 보존 기간**과 로그에 포함되는 항목 확인
- 플랫폼이 **삭제 요청을 어떻게 처리**하는지, 우리 삭제 API 실행 후 실제 소멸 시점 확인
- 확인 결과를 `docs/verification/`에 출처·확인일과 함께 기록
- `ADR-20260817-003`의 D1 위치 결정 항목을 실제 통제 가능 범위에 맞게 갱신
- `landing/README.md`의 데이터 설명에 배포 구조 반영

### Excluded

- D1 직접 생성 — 이 배포 구조에서는 불가능하며 해서도 안 된다
- 자체 Cloudflare 배포로의 전환 — 별도 TASK
- 개인정보 안내 문구 갱신 — WF-04
- 공개 판정 — WF-06

## Preconditions

- `ADR-20260817-003`이 `ACCEPTED`다.
- OpenAI Sites 프로젝트(`appgprj_6a7eb67db9cc8191a4c1e64228b72504`)에 접근할 수 있다.

## Constraints

- **확인하지 못한 사실을 추정으로 채우지 않는다.** 플랫폼 문서에 없으면 `미확인 — 사유`로 남긴다.
- 플랫폼이 제공하는 값과 Cloudflare 일반 문서의 값을 혼동하지 않는다. Cloudflare D1의 Free 플랜 7일 Time Travel은 **우리 계정 기준**이며, 플랫폼이 프로비저닝한 D1에 그대로 적용된다는 보장이 없다.
- `project_id`는 저장소에 이미 있는 값이므로 추가 노출을 만들지 않되, 접근 토큰·자격증명은 기록하지 않는다.
- 확인되지 않은 상태에서 개인정보 안내에 저장 국가를 쓰지 않는다.

## Execution Checklist

| Order | Item | Applicable | Status | Evidence | Commit |
|---|---|---|---|---|---|
| 01 | 요구사항 정제 | Yes | Done | 배포 구조 확인으로 Workflow 재정의 | - |
| 02 | 보안 모델 | Yes | Draft | 처리 주체·수탁 관계 확인 예정 | - |
| 03 | ERD / 데이터 | No | N/A — 스키마를 변경하지 않는다 | - | - |
| 04 | API Contract | No | N/A — 계약 변경 없음 | - | - |
| 05 | DTO | No | N/A — 코드 변경 없음 | - | - |
| 06 | Domain | No | N/A — 코드 변경 없음 | - | - |
| 07 | Service | No | N/A — 코드 변경 없음 | - | - |
| 08 | Controller | No | N/A — 코드 변경 없음 | - | - |
| 09 | View / Client | No | N/A — 화면 변경 없음 | - | - |
| 10 | Test | No | N/A — 외부 플랫폼 사실 확인이며 자동 테스트 대상 코드 경로가 없다 | - | - |
| 11 | 문서 / HISTORY | Yes | In Progress | 이 문서 재작성 완료 | - |

## Expected Output

- `docs/verification/fitpulse-landing-platform-data-handling-YYYYMMDD.md`
  - 항목별 확인 결과와 출처, 확인일
  - 미확인 항목과 사유
  - 확인 방법 (플랫폼 문서 / 콘솔 화면 / 문의 회신)
- `ADR-20260817-003` 갱신 — D1 위치 결정을 실제 통제 가능 범위로 정정
- `landing/README.md` — 배포 구조와 데이터 저장 주체 반영
- 갱신된 이 문서와 HISTORY

## Validation

| Type | Command or Method | Expected | Actual | Status |
|---|---|---|---|---|
| Manual | 빌드 파이프라인 확인 (`vite.config.ts`, `sites-vite-plugin.ts`, `hosting.json`) | D1 프로비저닝 주체 특정 | OpenAI Sites 플랫폼이 프로비저닝함을 확인 | Passed |
| Manual | `wrangler d1 list` | 우리 계정에 랜딩용 D1이 없음이 정상임을 확인 | `[]` — 잘못 생성한 DB 삭제 후 확인 | Passed |
| Manual | 플랫폼의 데이터 저장 국가·리전 확인 | 출처와 함께 기록 | **레지던시 미지원 확인** — D1/R2 저장과 로그 포함. 위치 지정 불가 | Passed |
| Manual | 처리 주체·수탁 관계 확인 | 출처와 함께 기록 | 소유자 Controller / OpenAI Processor, 재수탁자가 보안·안전 분류기 실행 | Passed |
| Manual | Hosted Data 범위 확인 | 출처와 함께 기록 | 사용자 제공분 + 로그·사용·기기정보·쿠키 수집분 포함 | Passed |
| Manual | 삭제 요청 후 실제 소멸 시점 확인 | 출처와 함께 기록 | 삭제 요청 후 **내부 최대 30일** 보존 | Passed |
| Manual | 금지 데이터 제약 확인 | 출처와 함께 기록 | PHI·결제카드 처리 금지. 현재 설계와 충돌 없음 | Passed |
| Manual | 인용문의 **원문 대조** | 공식 문서에서 직접 확인 | 미실행 — `help.openai.com`·`openai.com`이 HTTP 403 반환 | **Not Run — 접근 차단** |
| Manual | 재수탁자 명단과 소재국 | 목록 확인 | 미실행 — 같은 사유 | **Not Run — 접근 차단** |
| Manual | 플랫폼 접근 로그의 보존 기간 | Sites 기준 확인 | 미실행 — Compliance Logs 30일이 Sites 로그에 적용되는지 불명 | **Not Run** |
| Document | `git diff --check` | 의도한 Markdown hard break 외 경고 없음 | 경고 0건 | Passed |

## Done When

- [ ] Workflow Scope 구현 완료
- [ ] 관련 테스트 작성 및 실행 — N/A, 외부 플랫폼 사실 확인이며 코드 변경이 없다
- [ ] 검증 명령과 결과 기록
- [ ] 보안·권한·예외 처리 검토 — 자격증명 미기록 확인
- [ ] 문서와 HISTORY 갱신
- [ ] CI — `docs/`만 변경하면 `N/A — 경로 미해당`으로 기록한다
- [ ] 해결되지 않은 리뷰 의견 없음
- [ ] Parent TASK Workflow Index 갱신
- [ ] 확인하지 못한 항목이 확인된 것처럼 기록되지 않았음

## Change History

| Date | Status | Commit | PR | Description |
|---|---|---|---|---|
| 2026-08-17 | Draft | - | - | Workflow 생성. WF-01에서 프로덕션 D1 부재가 확인되어 "D1 직접 생성"으로 정의 |
| 2026-08-17 | In Progress | - | - | 착수 중 배포 구조를 확인해 전제 오류를 발견. 생성한 D1을 삭제하고 코드 변경을 되돌린 뒤, Workflow를 "배포 플랫폼의 데이터 처리 사실 확인"으로 재정의 |
| 2026-08-17 | Review | - | - | 플랫폼 데이터 처리 사실 5건 확인. **레지던시 미지원**, 소유자 Controller / OpenAI Processor, Hosted Data에 로그·기기정보 포함, 삭제 후 30일 내부 보존, PHI·결제카드 금지. 이에 따라 ADR의 SES 서울 선택 근거 중 "국외 이전 회피"를 철회. 원문 대조 3건은 403으로 Not Run |
