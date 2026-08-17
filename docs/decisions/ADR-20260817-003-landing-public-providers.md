# ADR-20260817-003: 랜딩 공개용 이메일 확인·발송 공급자와 남용 방어 수단

Status: **DRAFT — 소유자 선정 대기**

Decision date: 미정 — 소유자 선택 후 기입

Applies to: `PREVALIDATION_LITE` 단계 랜딩의 외부 공개

Parent: TASK-0001 / WF-01

이 문서는 `DRAFT`다. `docs/README.md` 32행에 따라 `DRAFT` 문서는 승인된 결정이나 실행 권한을 만들지 않는다. WF-02·WF-03·WF-05는 이 문서가 `ACCEPTED`가 되기 전에 착수하지 않는다.

## 배경

`docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 104행이 공개 전제로 요구하는 세 가지를 확정하기 위한 조사다.

1. 이메일 확인·발송 공급자
2. D1 및 호스팅 로그의 실제 처리 국가·수탁 범위·백업 보존
3. 공개 트래픽용 Turnstile 또는 동등한 남용 방어와 비용 중단 조건

## 확인 방법과 한계

- 확인 방법: Context7 MCP를 통한 공급자 공식 문서 조회
- 확인일: 2026-08-17
- 소유자 입력: 2026-08-17, Cloudflare 계정 플랜은 **Workers Free**로 확인됨
- **한계**: 이 조사는 공식 문서만 대조했다. 공급자 콘솔의 실제 계정 설정값과 요금 페이지는 확인하지 못했다. 소유자만 확인할 수 있는 항목은 아래 "소유자 확인 필요" 절에 분리했다.

## 확인된 사실

### Cloudflare D1

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 데이터 위치 지정 | 데이터베이스 생성 시 `wrangler d1 create <name> --location=<region>`로 지정한다 (예: `eu-central-1`) | `https://developers.cloudflare.com/d1/configuration/data-location` |
| 백업 보존 (Time Travel) | Free 7일 / Paid 30일. **이 계정은 Free이므로 7일** | `https://developers.cloudflare.com/d1/platform/limits` |
| 최대 DB 크기 | Free 500 MB / Paid 10 GB. **이 계정은 Free이므로 500 MB** | `https://developers.cloudflare.com/d1/platform/limits` |
| Free 플랜 한도 | 일 5,000,000 행 읽기, 일 100,000 행 쓰기, 총 저장 5 GB | `https://developers.cloudflare.com/workers/platform/pricing` |
| 한도 초과 동작 | Free 플랜에서 한도를 넘기면 **다음 날까지 데이터베이스가 읽기 전용**이 된다 | `https://developers.cloudflare.com/d1/platform/pricing` |

### Cloudflare Workers Logs

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 보존 기간 | Free 3일 / Paid 7일. **이 계정은 Free이므로 3일** | `https://developers.cloudflare.com/workers/observability/logs/workers-logs` |
| 포함 한도 | Free 일 200,000 로그 이벤트, Paid 월 20,000,000 | 같은 출처 |
| 초과 요금 | 100만 로그당 $0.60 (Paid) | 같은 출처 |
| Logpush | **Workers Paid 전용**. Free 플랜에서는 로그를 외부로 반출할 수 없다 | `https://developers.cloudflare.com/workers/platform/pricing` |

현재 `landing/worker/wrangler.jsonc`는 `observability.logs.enabled: true`, `head_sampling_rate: 0.1`, `traces.head_sampling_rate: 0.01`로 설정되어 있다.

### Cloudflare Turnstile (남용 방어 후보)

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 서버 측 검증 | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`에 `secret`, `response`를 전송해 검증한다. `remoteip`와 `idempotency_key`는 선택 | `https://developers.cloudflare.com/turnstile/get-started/server-side-validation` |
| 응답 필드 | `success`, `challenge_ts`, `hostname`, `error-codes`, `action`, `cdata`, `metadata`(`ephemeral_id` 포함) | 같은 출처 |
| 자동 테스트 | 항상 통과하는 공식 테스트 sitekey(`1x00000000000000000000AA`)와 테스트 secret key를 제공한다. 프로덕션 secret key는 더미 토큰을 거부한다 | `https://developers.cloudflare.com/turnstile/tutorials/excluding-turnstile-from-e2e-tests` |
| 방문자 데이터 전송 | 위젯이 Cloudflare로 방문자 신호를 전송한다. 응답 `metadata.ephemeral_id`는 방문자 식별에 쓰일 수 있는 값이다 | 같은 출처 |

### Resend (이메일 발송 후보)

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| Free 플랜 한도 | **일 100건, 월 3,000건** (To·CC·BCC 각 수신자를 1건으로 계산) | `https://resend.com/docs/knowledge-base/account-quotas-and-limits` |
| 데이터 저장 위치 | 발송 리전을 선택해도 **계정 데이터, 메타데이터, 로그, API 기록은 모두 미국에 저장**된다 | `https://resend.com/docs/llms-full.txt` (Choosing a Region > Data Residency) |
| 발송 속도 제한 | 팀당 초당 10건. 초과 시 429 | `https://resend.com/docs/send-with-cloudflare-workers` |
| Workers 연동 | Workers `fetch` 핸들러에서 SDK 또는 REST 직접 호출로 발송 가능 | 같은 출처 |
| 중복 발송 방지 | `idempotencyKey` 지원 | `https://resend.com/docs/send-with-astro` |

### Amazon SES (이메일 발송 대안 A)

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 샌드박스 제한 | 24시간 200건, 초당 1건. **송신자와 수신자 주소를 모두 사전 검증해야 발송된다** | `https://docs.aws.amazon.com/ses/latest/dg/quotas.md` |
| 프로덕션 액세스 | 샌드박스 해제는 사용 사례를 명시해 별도 신청·승인을 거쳐야 한다 | `https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas-request-increase.md` |
| 리전 선택 | 리전별 엔드포인트를 사용한다 (예: `email-smtp.us-west-2.amazonaws.com`). 리전 선택으로 처리 위치를 통제할 수 있다 | `https://docs.aws.amazon.com/ses/latest/dg/send-using-smtp-programmatically.md` |
| 발송 방식 | SESv2 API 또는 SMTP | 같은 출처 |
| 무료 한도·단가 | **미확인** — 조회한 문서에 요금 정보 없음 | - |
| 서울(ap-northeast-2) 리전 지원 | **미확인** — 조회한 문서에서 리전 목록을 확인하지 못함 | - |

**대기자 등록에는 샌드박스를 쓸 수 없다.** 대기자 이메일은 사전에 알 수 없는 임의 주소이므로 수신자 검증 요구를 충족할 수 없다. SES를 채택하려면 **프로덕션 액세스 승인이 선행 조건**이며, 승인에 걸리는 기간이 공개 일정에 영향을 준다.

### Brevo (이메일 발송 대안 B)

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 발송 엔드포인트 | `POST https://api.brevo.com/v3/smtp/email`, `api-key` 헤더 인증 | `https://developers.brevo.com/docs/send-a-transactional-email` |
| 배치 한도 | 호출당 최대 1,000건, 시간당 6,000회 | `https://developers.brevo.com/docs/batch-send-transactional-emails` |
| 수신자 한도 | 요청당 총 2,000명, 버전당 99명 | `https://developers.brevo.com/reference/send-transac-email` |
| 무료 플랜 일일 한도 | **미확인** — 조회한 개발자 문서에 요금·플랜 정보 없음 | - |
| 데이터 호스팅 위치 | **미확인** — 조회한 개발자 문서에 데이터 레지던시 정보 없음 | - |

### 대안 조사의 한계

소유자 요청으로 대안 2개를 조사했으나, **선정에 필요한 두 가지 핵심 기준(데이터 저장 위치, 무료 한도)을 두 대안 모두에서 확인하지 못했다.** Context7가 조회한 개발자 문서에 요금·데이터 레지던시 페이지가 포함되지 않았기 때문이다.

따라서 현재 비교표로는 **Resend와 대안을 데이터 저장 위치 기준으로 비교할 수 없다.** 이 상태에서 "비교 후 선정"을 주장하지 않는다.

## 이 조사에서 드러난 세 가지 쟁점

### 쟁점 1 — Resend는 이메일 주소를 미국에 저장한다

발송 리전을 EU로 선택해도 계정 데이터·로그·API 기록은 미국에 저장된다. 대기자 이메일 주소는 발송 요청에 포함되므로 **미국으로 이전된다**.

영향: 개인정보 안내에 국외 이전 사실, 이전 국가, 수탁자, 이전 항목을 명시해야 한다(WF-04). 이 사실을 적지 않고 공개하면 `ADR-20260814-002` 최소 운영 기준("실제 저장·분석 공급자, 수집 항목, 목적, 보유 기간, 삭제 요청 방법을 공개 시점의 개인정보 안내에 적는다")을 위반한다.

이 쟁점은 Resend 고유 문제가 아니다. 대안 공급자를 고를 때도 같은 항목을 확인해야 한다.

### 쟁점 2 — D1 Time Travel이 "삭제 후 복원 가능 기간"을 만든다

D1은 Free 7일, Paid 30일의 Time Travel 복원 기간을 제공한다. 즉 **직접 삭제를 실행해도 그 기간 동안은 삭제 이전 시점으로 복원할 수 있는 상태**가 남는다.

현재 `docs/runbooks/fitpulse-landing-data-deletion-retention.md`와 `landing/README.md`는 직접 삭제와 일일 만료 삭제를 설명하지만, Time Travel로 인한 잔존 가능 기간은 다루지 않는다.

영향:
- 개인정보 안내의 "삭제 방법"과 실제 소멸 시점이 어긋난다. WF-04에서 "삭제 요청 후 최대 N일 내 복원 불가 상태가 된다"로 정정해야 한다.
- `docs/README.md` 76행이 요구하는 "복구 후 삭제 재적용 절차"가 여기에 해당한다. Time Travel로 복원하면 삭제된 행이 되살아나므로, 복원 시 삭제를 다시 적용하는 절차가 런북에 있어야 한다.

이 쟁점은 이번 조사에서 새로 드러났다. WF-04의 Scope에 반영이 필요하다.

### 쟁점 3 — Free 플랜에서 D1 일일 한도 초과 시 등록이 중단된다

계정이 Workers Free로 확인되었으므로 D1 일일 한도는 5,000,000 행 읽기 / 100,000 행 쓰기다. **한도를 넘기면 다음 날까지 데이터베이스가 읽기 전용이 된다.**

영향: 읽기 전용 상태에서는 대기자 등록, 설문 저장, 이벤트 기록, 삭제 요청이 모두 실패한다. 공개 후 트래픽이 몰리거나 봇 요청이 유입되면 **수요 측정 자체가 중단되고, 삭제 요청도 처리할 수 없다.** 삭제 요청 불이행은 개인정보 처리 의무와 직결된다.

이는 비용 초과가 아니라 **가용성·의무 이행 위험**이므로, WF-05의 "비용 상한" 범위를 넘어선다. WF-05에서 다음을 다룬다.

- 정상 트래픽 1회 방문당 예상 행 쓰기 수 산정과 100,000 행 대비 여유 계산
- 한도 접근 감지 수단
- 읽기 전용 전환 시 사용자에게 표시할 상태와 삭제 요청 대체 경로
- 한도 소진을 노린 남용 요청 차단 (WF-02와 연계)

Free 플랜에서는 Logpush를 쓸 수 없으므로 로그 기반 상시 감시는 선택지가 아니다. Workers Logs 3일 보존 안에서 확인하거나 대시보드 수동 점검에 의존해야 한다.

## 후보 비교

### 이메일 확인·발송

| 항목 | Resend | Amazon SES | Brevo |
|---|---|---|---|
| 무료 한도 | 일 100 / 월 3,000 | **미확인** (샌드박스는 24시간 200건이나 사용 불가) | **미확인** |
| 데이터 저장 국가 | **미국** — 발송 리전 선택과 무관 | 리전 선택 가능. 서울 리전 지원 여부 **미확인** | **미확인** |
| 임의 수신자 발송 | 가능 | **샌드박스에서 불가** — 프로덕션 액세스 승인 필요 | 가능 |
| 착수 선행 조건 | 없음 | **AWS 프로덕션 액세스 승인** | 없음 |
| Workers 연동 | 공식 문서 있음 | REST/SMTP. Workers 전용 문서 미확인 | REST. Workers 전용 문서 미확인 |
| 중복 방지 | `idempotencyKey` | 미확인 | 미확인 |
| 속도 제한 | 팀당 초당 10건 | 샌드박스 초당 1건 | 시간당 6,000회 배치 |
| 월 비용 (초기 규모) | 0원 — Free 한도 내 | 산출 불가 — 단가 미확인 | 산출 불가 — 한도 미확인 |

**세 후보 중 데이터 저장 국가를 확정한 것은 Resend뿐이며, 그 결론은 "미국 저장"이다.** SES와 Brevo는 저장 위치를 확인하지 못해 Resend보다 낫다고도 못하다고도 말할 수 없다. 이 표는 아직 선정 근거로 충분하지 않다.

### 남용 방어

| 항목 | Cloudflare Turnstile | 자체 구현 (요청 제한 강화) |
|---|---|---|
| 서버 측 검증 | 가능 — `siteverify` | 가능 |
| 자동 테스트 | 공식 테스트 키 제공 | 별도 구현 필요 |
| 방문자 데이터 외부 전송 | 있음 — Cloudflare로 전송 | 없음 |
| 기존 스택 적합성 | 높음 — 이미 Cloudflare 사용 중 | 높음 |
| 봇 방어 강도 | 높음 | 낮음 — 분산 요청에 취약 |
| 요금 | **미확인** | 0원 |

현재 `landing/db/schema.ts` 55~63행의 `request_rate_limits`가 세션별 단기 요청 제한을 이미 구현하고 있다. Turnstile은 이를 대체하지 않고 보완한다.

## 미확인 항목

| # | 항목 | 사유 | 확인 주체 |
|---|---|---|---|
| 1 | Turnstile 요금과 무료 한도 | 공식 문서 조회에서 요금 정보를 찾지 못함 | 소유자 또는 추가 조사 |
| 2 | ~~Cloudflare 계정 플랜~~ | **해소됨 — 2026-08-17 소유자 확인: Workers Free** | 완료 |
| 3 | 실제 D1 `database_id` | `landing/worker/wrangler.jsonc`의 값이 `00000000-0000-4000-8000-000000000000` 플레이스홀더 | 소유자 |
| 4 | 현재 D1 데이터베이스의 실제 `location` | 생성 시 지정된 리전을 확인하지 못함. `wrangler d1 info`로 확인 가능 | 소유자 |
| 5 | 랜딩 호스팅의 실제 위치와 로그 보존 | `docs/plans/...execution-plan` 86행의 "OpenAI Sites 검증 URL"이 공개 시에도 유지되는지 불명 | 소유자 |
| 6 | Amazon SES 무료 한도·단가, 서울 리전 지원 여부 | 조회한 문서에 요금·리전 목록 없음 | 추가 조사 |
| 7 | Brevo 무료 플랜 일일 한도 | 조회한 개발자 문서에 요금 정보 없음 | 추가 조사 |
| 8 | Brevo 데이터 호스팅 위치 | 조회한 개발자 문서에 데이터 레지던시 정보 없음 | 추가 조사 |
| 9 | 선정 공급자의 수탁 계약(DPA) 체결 가능 여부와 조건 | 문서 조회 범위 밖 | 소유자 |
| 10 | 정상 방문 1회당 D1 행 쓰기 수 | 쟁점 3의 여유 계산에 필요. 코드 계측으로 산정 가능 | WF-05 |

**미확인 항목 3·4·5가 남아 있는 한 실행 계획 104행의 조건 2("D1 및 호스팅 로그의 실제 처리 국가·수탁 범위·백업 보존")는 확정되지 않는다.** 항목 6·7·8이 남아 있는 한 이메일 공급자 선정을 "비교 후 선정"으로 기록할 수 없다.

## 권고안

소유자 결정을 전제로 한 제안이며, 이 문서가 `ACCEPTED`가 되기 전에는 실행 권한이 없다.

1. **남용 방어**: Cloudflare Turnstile. 이미 Cloudflare 스택을 쓰고 있고, 서버 측 `siteverify`와 공식 테스트 키가 있어 WF-02의 자동 테스트 요구(AC-02)를 충족할 수 있다. Free 플랜에서 D1 한도 소진 공격을 막는 역할도 겸한다(쟁점 3). 요금은 확인 후 확정한다.
2. **이메일 발송**: **결정 보류.** 세 후보 중 데이터 저장 위치를 확정한 것은 Resend뿐이고 그 답이 "미국"이다. SES·Brevo는 저장 위치를 확인하지 못해 비교가 성립하지 않는다. 다음 둘 중 하나를 소유자가 선택해야 한다.
   - (a) 미확인 항목 6·7·8을 추가 조사해 비교표를 완성한 뒤 선정한다.
   - (b) Resend를 채택하되 **미국 저장·국외 이전 사실을 개인정보 안내에 명시**하는 것을 조건으로 하고, 대안 조사를 하지 않았음을 이 ADR에 남긴다.

   Amazon SES는 프로덕션 액세스 승인이 선행 조건이므로, 채택 시 공개 일정에 승인 대기 기간을 반영해야 한다.
3. **비용 관점**: Turnstile·Resend 모두 초기 규모에서 0원으로 예상되나 Turnstile 요금이 미확인이다. 500,000원 상한(`ADR-20260814-001`) 내 배분은 WF-05에서 정한다.
4. **WF-04 Scope 확대**: 쟁점 2(Time Travel 7일)로 인해 삭제 안내 문구와 복원 후 삭제 재적용 절차를 WF-04에 추가한다. 반영 완료.
5. **WF-05 Scope 확대**: 쟁점 3(Free 플랜 읽기 전용 전환)은 비용이 아니라 가용성·의무 이행 위험이다. WF-05에 한도 여유 계산, 접근 감지, 읽기 전용 시 대체 경로를 추가한다.

## 소유자 확인 필요

다음을 확인해야 이 문서를 `ACCEPTED`로 전환할 수 있다.

- [x] Cloudflare 계정 플랜 — **Workers Free** (2026-08-17 확인)
- [ ] 실제 D1 `database_id`와 `location` — `wrangler d1 info <DB>`로 확인 가능
- [ ] 랜딩 공개 시 사용할 호스팅과 그 데이터 위치·로그 보존
- [ ] Turnstile 요금 확인
- [ ] 이메일 공급자: 권고안 2의 (a) 추가 조사 / (b) Resend 조건부 채택 중 선택
- [ ] 선정 공급자의 수탁 계약 조건 확인

## 배제한 대안

| 대안 | 배제 이유 |
|---|---|
| 이메일 확인 없이 공개 | 실행 계획 104행이 공개 전제로 명시. 미확인 이메일 14일 삭제 로직(`landing/db/landing-storage.ts` 5행)이 확인 흐름을 전제로 이미 존재 |
| 남용 방어 없이 요청 제한만 사용 | 세션 기반 `request_rate_limits`는 분산 요청에 취약. 실행 계획 104행이 "Turnstile 또는 동등한 남용 방어"를 요구 |
| 자체 SMTP 서버 운영 | 도달률·운영 부담·보안 관리 비용이 검증 단계 규모에 맞지 않음 |

## 저장 금지 정보 확인

이 문서에는 계약서 원문, 서명, 결제·계좌 식별자, 실제 API 키, 저장소 실경로를 포함하지 않았다. 테스트용 공개 sitekey(`1x00000000000000000000AA`)는 Cloudflare가 문서에 공개한 값이며 비밀정보가 아니다.
