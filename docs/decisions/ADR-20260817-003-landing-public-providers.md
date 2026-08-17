# ADR-20260817-003: 랜딩 공개용 이메일 확인·발송 공급자와 남용 방어 수단

Status: **ACCEPTED — OWNER-DIRECTED**

Decision date: 2026-08-17

Applies to: `PREVALIDATION_LITE` 단계 랜딩의 외부 공개

Parent: TASK-0001 / WF-01

## 결정

소유자가 2026-08-17에 다음을 선택했다.

| 대상 | 결정 | 근거 |
|---|---|---|
| 남용 방어 | **Cloudflare Turnstile Free 플랜** | 무료, 서버 측 `siteverify`, 공식 테스트 키로 자동 테스트 가능, 기존 Cloudflare 스택과 일치 |
| 이메일 확인·발송 | **Amazon SES, 리전 `ap-northeast-2`(서울)** | 이메일 주소를 국내에서 처리해 개인정보 국외 이전을 피한다. 월 3,000건 기준 약 $0.48 |
| D1 데이터 위치 | ~~위치 힌트 `apac`~~ → **실행 불가. 2026-08-17 철회** | 아래 "D1 위치 결정 철회" 참조 |
| Brevo | **후보에서 제외** | 무료 한도와 데이터 호스팅 위치를 확인하지 못함 |
| Cloudflare Email Sending | **배제** | Beta이며 Workers Paid 전용. 이 계정은 Workers Free |

### 이 결정이 부여하는 것과 부여하지 않는 것

**부여한다**: WF-02(Turnstile 연동), WF-03(SES 연동), WF-07(D1 프로비저닝)의 구현 착수 권한.

**부여하지 않는다**: 랜딩 공개 권한. 실행 계획 104행의 조건들은 아직 확정되지 않았다. 아래 "잔여 미확인 항목"이 남아 있으며, 공개 판정은 WF-06에서 별도로 내린다.

### D1 위치 결정 철회 (2026-08-17)

WF-07 착수 중 이 결정의 전제가 틀렸음이 드러나 **"D1 위치 힌트 `apac`" 항목을 철회한다.**

이 랜딩은 OpenAI Sites 플랫폼에 배포되고 **D1을 플랫폼이 프로비저닝한다.** 근거는 다음과 같다.

- `landing/.openai/hosting.json` — `{ "project_id": "appgprj_...", "d1": "DB" }`
- `landing/vite.config.ts` 24~33행 — `database_id`를 플레이스홀더로 하드코딩하고 `migrations_dir`를 `dist/.openai/drizzle`로 지정
- `landing/build/sites-vite-plugin.ts` 27~42행 — `hosting.json`과 `drizzle/`를 `dist/.openai/`로 패키징

따라서 **우리가 D1을 만들지 않으므로 위치 힌트를 지정할 대상이 없다.** `landing/worker/wrangler.jsonc`의 플레이스홀더 `database_id`는 결함이 아니라 의도된 설계이며, Cloudflare 계정에 D1이 없는 것도 정상 상태다.

이 문서가 앞서 "쟁점 4 — 프로덕션 D1이 존재하지 않으며..."로 기록한 내용은 **오판이다.** 런타임 조회 결과만 보고 빌드 파이프라인을 확인하지 않은 것이 원인이다.

**대체 조치**: 데이터 위치·백업·처리 주체 확인 대상을 우리 Cloudflare 계정에서 **배포 플랫폼**으로 옮긴다. WF-07을 "배포 플랫폼의 데이터 처리 사실 확인"으로 재정의했다.

이로써 아래 "잔여 미확인 항목"의 **랜딩 호스팅 항목이 이 TASK에서 가장 중요한 미확인 항목**이 된다. 이메일이 저장되는 곳의 처리 주체와 국가를 모르면 개인정보 안내를 사실대로 쓸 수 없다.

### 선정에 따라 새로 생긴 선행 작업

1. **AWS 프로덕션 액세스 승인 신청.** SES 샌드박스는 수신자 주소 사전 검증을 요구해 대기자 발송에 쓸 수 없다. 승인 대기 기간이 공개 일정에 포함된다.
2. **프로덕션 D1 생성.** `wrangler d1 create <name> --location=apac`으로 생성한다. 위치는 생성 후 변경할 수 없다.
3. **생성 후 실제 배치 위치 확인.** 위치 힌트는 보장이 아니므로 `wrangler d1 info`로 확인한 결과를 개인정보 안내의 근거로 쓴다.

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
| 데이터 위치 지정 | 생성 시 `wrangler d1 create <name> --location=<hint>`로 지정한다. 허용 값은 `wnam`, `enam`, `weur`, `eeur`, **`apac`**, `oc` 6개 광역 리전이다 | `https://developers.cloudflare.com/d1/configuration/data-location/` |
| 위치 변경 가능 여부 | **생성 후 변경할 수 없다** | 같은 출처 |
| 위치 보장 여부 | 힌트는 **선호일 뿐 보장되지 않는다**. D1은 선호에 "지연시간 기준으로 가장 가까운 가능한 위치"에 배치한다. 미지정 시 생성 요청 위치에 가까운 곳에 자동 배치한다 | 같은 출처 |
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
| 요금 | **Free 플랜 무료**. 계정당 위젯 20개, 위젯당 호스트네임 10개, **siteverify 요청 무제한**, 분석 조회 7일 | `https://developers.cloudflare.com/turnstile/plans/` |
| Enterprise | 위젯 무제한, 위젯당 호스트네임 200개, 분석 30일, `ephemeral_id`·오프라벨·호스트네임 와일드카드. 가격은 영업 문의 | 같은 출처 |

랜딩은 위젯 1개, 호스트네임 1~2개 규모이므로 Free 플랜 한도 안에 충분히 들어간다. 실행 계획 104행의 조건 3 중 "남용 방어" 부분은 **비용 0원으로 충족 가능**하다.

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
| 단가 | 월 0~1,000만 건 구간 **1,000건당 $0.16**. 첨부파일은 GB당 $0.12 추가 | `https://aws.amazon.com/ses/pricing/` |
| 신규 계정 크레딧 | AWS 신규 고객에게 최대 $200 프리 티어 크레딧. 계정 생성 후 **6개월간 사용 가능**, 12개월 내 소진 조건 | 같은 출처 |
| 서울(ap-northeast-2) 리전 지원 | **지원함**. API `email.ap-northeast-2.amazonaws.com`, SMTP `email-smtp.ap-northeast-2.amazonaws.com`, 수신 및 피드백 엔드포인트도 제공 | `https://docs.aws.amazon.com/general/latest/gr/ses.html` |
| 기본 할당량 | 리전당 24시간 200건, 초당 1건. 둘 다 상향 신청 가능 | 같은 출처 |

**대기자 등록에는 샌드박스를 쓸 수 없다.** 대기자 이메일은 사전에 알 수 없는 임의 주소이므로 수신자 검증 요구를 충족할 수 없다. SES를 채택하려면 **프로덕션 액세스 승인이 선행 조건**이며, 승인에 걸리는 기간이 공개 일정에 영향을 준다.

**서울 리전 지원은 이 조사에서 가장 중요한 발견이다.** `ap-northeast-2`를 선택하면 대기자 이메일 주소가 국내에서 처리되어, Resend 채택 시 필요한 국외 이전 고지를 아예 피할 수 있다. 초기 규모(월 3,000건)의 발송 비용은 약 $0.48로 예산에 영향이 없다.

### Cloudflare Email Service (이메일 발송 대안 C — 배제)

| 항목 | 확인 내용 | 출처 |
|---|---|---|
| 기능 | Workers `EMAIL` 바인딩 또는 REST API로 임의 외부 수신자에게 트랜잭션 메일 발송 | `https://developers.cloudflare.com/email-service/` |
| 제공 상태 | **Beta이며 Workers Paid 플랜 전용** | 같은 출처 |

**이 계정은 Workers Free이므로 사용할 수 없다.** 기존 Cloudflare 스택과 가장 잘 맞고 수탁자를 늘리지 않는다는 장점이 있으나, 플랜 제약으로 이번 단계에서는 배제한다. Workers Paid로 전환하면 재검토 대상이다.

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

### 프로덕션 D1 존재 여부

2026-08-17 소유자가 인증된 Wrangler로 실행한 결과다.

```text
$ npx wrangler d1 info site-creator-d1
✘ [ERROR] Couldn't find a D1 DB with name or binding 'site-creator-d1'
  in your config or the API.
```

`landing/worker/wrangler.jsonc`가 선언한 `database_name: "site-creator-d1"`에 해당하는 **D1 데이터베이스가 Cloudflare 계정에 존재하지 않는다.** `database_id`가 플레이스홀더였던 것은 값을 안 채운 것이 아니라 **가리킬 대상이 없었기 때문**이다.

## 이 조사에서 드러난 네 가지 쟁점

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

### 쟁점 4 — 프로덕션 D1이 존재하지 않으며, 위치는 생성 시 한 번만 정할 수 있다

`site-creator-d1`은 Cloudflare 계정에 없다. 따라서 지금까지의 모든 검증은 로컬 D1(`--local`, `.wrangler/`)에서만 이뤄졌고, **원격 D1의 실제 데이터 위치·백업·처리 국가는 검증된 적이 없다.**

이는 두 가지를 뜻한다.

**(1) 기존 체크 항목 일부를 승계할 수 없다.** `docs/plans/fitpulse-landing-data-validation-execution-plan-20260814.md` 88행은 "실제 분석 공급자와 수집 속성 확인 — Cloudflare D1의 1차 이벤트"로 체크되어 있으나, 그 시점에 원격 D1은 존재하지 않았다. 90행이 "로컬 프로덕션 Worker와 격리 D1 통합 시험"으로 로컬임을 밝힌 것과 달리, 88행은 원격 D1에서 확인한 것처럼 읽힌다. WF-06에서 이 항목을 **미확인으로 되돌리고 재판정**해야 한다.

**(2) 데이터 위치를 지금 결정해야 한다.** 위치 힌트는 생성 시에만 지정할 수 있고 이후 변경이 불가능하다. 잘못 만들면 데이터베이스를 새로 만들어 이전해야 한다.

동시에 **위치 힌트는 보장이 아니다.** `apac`을 지정해도 D1은 "지연시간 기준으로 가장 가까운 가능한 위치"에 배치하며, 그것이 한국이라는 보장은 없다. 따라서 개인정보 안내에 "데이터는 한국에 저장됩니다"라고 쓸 수 없다. 쓸 수 있는 것은 다음 수준이다.

- 지정한 선호 리전(`apac` 등)
- 생성 후 실제 배치된 위치를 `wrangler d1 info`로 확인한 결과와 확인일
- 위치가 Cloudflare의 배치 정책에 따라 결정되며 보장되지 않는다는 사실

WF-01은 D1을 생성하지 않는다. 생성은 위치 결정이 확정된 뒤 별도로 수행하며, 어느 Workflow가 담당할지는 소유자 결정 후 정한다.

## 후보 비교

### 이메일 확인·발송

| 항목 | Resend | Amazon SES | Brevo | Cloudflare Email |
|---|---|---|---|---|
| 사용 가능 여부 | 가능 | 가능 | 가능 | **불가 — Workers Paid 전용 Beta** |
| 데이터 저장 국가 | **미국** — 발송 리전 선택과 무관 | **리전 선택 가능. 서울 `ap-northeast-2` 지원** | **미확인** | 해당 없음 |
| 무료 한도 | 일 100 / 월 3,000 | 신규 계정 $200 크레딧 6개월 | **미확인** | 해당 없음 |
| 단가 | 한도 초과 시 유료 | **1,000건당 $0.16** | **미확인** | 해당 없음 |
| 월 비용 (월 3,000건) | 0원 | 약 $0.48 (크레딧 적용 시 0원) | 산출 불가 | 해당 없음 |
| 임의 수신자 발송 | 즉시 가능 | **샌드박스 불가** — 프로덕션 액세스 승인 후 가능 | 가능 | 해당 없음 |
| 착수 선행 조건 | 없음 | **AWS 프로덕션 액세스 승인 대기** | 없음 | Workers Paid 전환 |
| Workers 연동 | 공식 문서 있음 | REST/SMTP. Workers 전용 문서 미확인 | REST. Workers 전용 문서 미확인 | `EMAIL` 바인딩 |
| 중복 방지 | `idempotencyKey` | 미확인 | 미확인 | 미확인 |
| 속도 제한 | 팀당 초당 10건 | 기본 초당 1건 (상향 가능) | 시간당 6,000회 배치 | 해당 없음 |

이제 비교가 성립한다. 핵심 축은 **데이터 저장 국가**와 **착수 속도**의 맞교환이다.

- **Resend**: 즉시 착수 가능하나 이메일 주소가 미국에 저장된다. 국외 이전 고지가 필수다.
- **Amazon SES (`ap-northeast-2`)**: 국내 처리가 가능해 국외 이전 고지를 피할 수 있고 비용도 무시할 수준이나, 프로덕션 액세스 승인 대기가 공개 일정에 들어간다.
- **Brevo**: 저장 위치와 무료 한도를 확인하지 못했다. 요금·개인정보 페이지가 JavaScript로 렌더링되어 2회 시도 모두 본문을 가져오지 못했다. 확인 없이는 후보로 유지하지 않는다.
- **Cloudflare Email**: 플랜 제약으로 배제.

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
| 1 | ~~Turnstile 요금과 무료 한도~~ | **해소됨 — Free 플랜 무료, 위젯 20개, siteverify 무제한** | 완료 |
| 2 | ~~Cloudflare 계정 플랜~~ | **해소됨 — 2026-08-17 소유자 확인: Workers Free** | 완료 |
| 3 | ~~실제 D1 `database_id`~~ | **해소됨 — 데이터베이스가 존재하지 않음. 생성이 선행 작업으로 전환됨** | 완료 |
| 4 | ~~현재 D1의 실제 `location`~~ | **해소됨 — 존재하지 않으므로 생성 시 결정해야 함. 결정 자체가 신규 과제** | 완료 |
| 5 | 랜딩 호스팅의 실제 위치와 로그 보존 | `docs/plans/...execution-plan` 86행의 "OpenAI Sites 검증 URL"이 공개 시에도 유지되는지 불명 | 소유자 |
| 6 | ~~Amazon SES 단가·서울 리전 지원~~ | **해소됨 — 1,000건당 $0.16, `ap-northeast-2` 지원** | 완료 |
| 7 | Brevo 무료 플랜 일일 한도 | 요금 페이지가 JavaScript 렌더링이라 본문 조회 실패 (2회 시도) | 추가 조사 또는 후보 제외 |
| 8 | Brevo 데이터 호스팅 위치 | 개인정보처리방침 페이지가 JavaScript 렌더링이라 본문 조회 실패 (2회 시도) | 추가 조사 또는 후보 제외 |
| 9 | 선정 공급자의 수탁 계약(DPA) 체결 가능 여부와 조건 | 문서 조회 범위 밖 | 소유자 |
| 10 | 정상 방문 1회당 D1 행 쓰기 수 | 쟁점 3의 여유 계산에 필요. 코드 계측으로 산정 가능 | WF-05 |
| 11 | D1 생성 후 실제 배치된 위치 | 위치 힌트는 보장이 아니므로 생성 후 `wrangler d1 info`로 확인해야 함 | D1 생성 이후 |

**해소 6건, 잔여 5건.** 항목 5와 11이 남아 있는 한 실행 계획 104행의 조건 2("D1 및 호스팅 로그의 실제 처리 국가·수탁 범위·백업 보존")는 확정되지 않는다. 항목 7·8은 Brevo를 후보에서 제외하면 함께 해소된다.

## 권고안과 채택 결과

아래는 결정 시점의 권고이며, 2026-08-17 소유자 선택으로 항목 1·2·3이 채택되었다.

1. **남용 방어 — 확정 가능**: Cloudflare Turnstile Free 플랜. 무료이고, 서버 측 `siteverify`와 공식 테스트 키가 있어 WF-02의 자동 테스트 요구(AC-02)를 충족한다. 랜딩 규모는 위젯 20개·위젯당 호스트네임 10개 한도 안에 충분히 들어간다. Free 플랜에서 D1 한도 소진 공격을 막는 역할도 겸한다(쟁점 3). **미확인 항목 없음.**
2. **이메일 발송 — (a) 채택됨**: 두 선택지의 맞교환은 다음과 같았다.
   - **(a) Amazon SES `ap-northeast-2`**: 이메일 주소를 국내에서 처리해 **국외 이전 고지를 피할 수 있다.** 월 3,000건 기준 약 $0.48이고 신규 계정 크레딧으로 상쇄된다. 대가는 **AWS 프로덕션 액세스 승인 대기**이며, 승인 기간만큼 공개가 늦어진다.
   - **(b) Resend**: 즉시 착수 가능하고 Free 한도가 초기 규모를 덮는다. 대가는 **이메일 주소의 미국 저장**이며, 개인정보 안내에 국외 이전을 명시해야 한다.

   Brevo는 저장 위치와 무료 한도를 확인하지 못했으므로, 추가 조사를 하지 않는 한 후보에서 제외할 것을 권한다. Cloudflare Email은 Workers Paid 전용 Beta라 배제한다.
3. **D1 생성이 선행 작업으로 추가되어야 한다**: 프로덕션 D1이 존재하지 않으므로 공개 전에 생성해야 한다. 위치는 생성 시 한 번만 정할 수 있고 변경이 불가능하므로, **이메일 공급자 결정과 함께 위치를 정한 뒤 생성**한다. `apac`을 지정해도 배치 위치는 보장되지 않으므로, 생성 후 실제 위치를 확인해 개인정보 안내에 반영한다.
4. **비용 관점**: Turnstile 0원, SES 약 $0.48/월 또는 Resend 0원. 어느 쪽이든 500,000원 상한(`ADR-20260814-001`)에 영향이 없다. 배분은 WF-05에서 정한다.
5. **WF-04 Scope 확대**: 쟁점 2(Time Travel 7일)로 삭제 안내 문구와 복원 후 삭제 재적용 절차를 추가한다. 반영 완료.
6. **WF-05 Scope 확대**: 쟁점 3(Free 플랜 읽기 전용 전환)은 비용이 아니라 가용성·의무 이행 위험이다. 한도 여유 계산, 접근 감지, 읽기 전용 시 대체 경로를 추가한다. 반영 완료.
7. **WF-06 판정 기준 강화**: 쟁점 4로 인해 실행 계획 88행의 기존 체크를 승계하지 않고 원격 D1에서 재확인한다.

## 잔여 미확인 항목

선정은 확정되었으나 다음이 남아 있다. 이 항목들이 남아 있는 한 **공개 GO를 결론으로 쓸 수 없다.**

- [x] Cloudflare 계정 플랜 — **Workers Free** (2026-08-17 확인)
- [x] 실제 D1 존재 여부 — **존재하지 않음** (2026-08-17 `wrangler d1 info` 확인)
- [x] Turnstile 요금 — **Free 플랜 무료** (2026-08-17 확인)
- [x] 이메일 공급자 — **Amazon SES `ap-northeast-2`** (2026-08-17 소유자 선택)
- [x] D1 생성 위치 — **`apac`** (2026-08-17 소유자 선택)
- [x] Brevo 처리 — **후보에서 제외** (2026-08-17 소유자 선택)
- [ ] **AWS 프로덕션 액세스 승인** — 신청·승인 전에는 대기자 발송 불가. WF-03 Precondition
- [ ] **D1 생성 후 실제 배치 위치** — `wrangler d1 info`로 확인. WF-07
- [ ] **AWS 수탁 계약(DPA) 조건** — 개인정보 안내의 수탁자 기재 근거. WF-04
- [ ] **SES `ap-northeast-2`의 로그·바운스 데이터 보존 기간** — 개인정보 안내의 보유 기간 근거. WF-04
- [ ] **랜딩 호스팅의 실제 위치와 로그 보존** — 실행 계획 86행의 "OpenAI Sites 검증 URL"이 공개 시에도 유지되는지 불명. WF-06

마지막 항목은 이번 조사에서 다루지 못했다. 이메일과 D1을 국내로 두어도 **호스팅과 그 접근 로그가 어디에 있는지 확정되지 않으면** 실행 계획 104행의 조건 2는 충족되지 않는다.

## 배제한 대안

| 대안 | 배제 이유 |
|---|---|
| 이메일 확인 없이 공개 | 실행 계획 104행이 공개 전제로 명시. 미확인 이메일 14일 삭제 로직(`landing/db/landing-storage.ts` 5행)이 확인 흐름을 전제로 이미 존재 |
| 남용 방어 없이 요청 제한만 사용 | 세션 기반 `request_rate_limits`는 분산 요청에 취약. 실행 계획 104행이 "Turnstile 또는 동등한 남용 방어"를 요구 |
| 자체 SMTP 서버 운영 | 도달률·운영 부담·보안 관리 비용이 검증 단계 규모에 맞지 않음 |

## 저장 금지 정보 확인

이 문서에는 계약서 원문, 서명, 결제·계좌 식별자, 실제 API 키, 저장소 실경로를 포함하지 않았다. 테스트용 공개 sitekey(`1x00000000000000000000AA`)는 Cloudflare가 문서에 공개한 값이며 비밀정보가 아니다.
