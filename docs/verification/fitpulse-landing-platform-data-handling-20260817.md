# 배포 플랫폼 데이터 처리 사실 확인 — ChatGPT Sites

Status: 확인 완료 — 일부 항목 원문 미확인

Date: 2026-08-17

Parent: TASK-0001 / WF-07

## 확인 대상

`landing/`은 ChatGPT Sites(OpenAI)에 배포되며 D1을 플랫폼이 프로비저닝한다. 대기자 이메일과 설문이 저장되는 곳의 처리 주체·위치·보존을 확인한다.

## 확인 방법과 한계

- 방법: 웹 검색으로 OpenAI 공식 도움말과 정책 문서를 조회
- **한계**: `help.openai.com`과 `openai.com/policies`가 직접 조회 시 **HTTP 403**을 반환해 원문을 열지 못했다. 아래 내용은 검색 결과에 인용된 문구를 근거로 하며, **원문 대조는 하지 못했다.** 공개 판정 전에 소유자가 원문을 직접 확인해야 한다.
- 확인일: 2026-08-17

## 확인된 사실

### 1. 데이터 레지던시 — 미지원

> "ChatGPT Sites does not support data residency or inference residency at launch, including deployed Sites, Site code, **D1/R2 data and file storage**, artifacts, and **logs**."

출처: [Data residency and inference residency for ChatGPT](https://help.openai.com/en/articles/9903489-data-residency-and-inference-residency-for-chatgpt) (검색 인용, 원문 미확인)

**대기자 이메일이 저장되는 D1의 위치를 지정할 수 없고, 특정 국가에 저장된다고 보장할 수 없다.** 로그도 마찬가지다.

### 2. 책임 구조 — 소유자가 Controller, OpenAI가 Processor

> "OpenAI refers to personal data collected by ChatGPT Sites as **'Hosted Data'** because OpenAI hosts this personal data on behalf of the site owner, and OpenAI processes Hosted Data **as a Data Processor**."

> "If your Site collects or otherwise processes personal data from visitors, **you are responsible for deciding why and how that information is used** and for complying with applicable privacy and data-protection laws."

출처: [ChatGPT Sites Data Processing Addendum](https://openai.com/policies/chatgpt-sites-data-processing-addendum/), [Creating and managing ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites) (검색 인용, 원문 미확인)

개인정보 안내 작성과 법규 준수 책임은 **소유자**에게 있다. 이는 `ADR-20260814-001`의 개인사업자 1인 자체 검토 체계와 일치한다.

### 3. Hosted Data 범위 — 로그·기기정보·쿠키까지 포함

> "Hosted Data means any Personal Data which is collected by your ChatGPT Site after it is published. This includes Personal Data provided by end-users (such as text, images, videos or other content posted or uploaded) and personal data generated through end-users' use of your ChatGPT Site (such as **log data, usage data, device information and data collected through cookies** and similar technologies)."

출처: 같은 DPA (검색 인용, 원문 미확인)

우리가 D1에 저장하는 이메일·설문뿐 아니라 **플랫폼이 생성하는 로그·기기정보**도 Hosted Data다. 현재 개인정보 안내가 이를 다루는지 WF-04에서 대조해야 한다.

### 4. 재수탁자 — 콘텐츠 스캔 수행

> "The OpenAI Subprocessors listed may provide web hosting, infrastructure, content moderation and support services for ChatGPT Sites created web pages. Applicable subprocessors may **run security and safety classifiers on web pages and share results with OpenAI**."

출처: 같은 DPA, [OpenAI Sub-processor list](https://openai.com/policies/sub-processor-list/) (검색 인용, 원문 미확인)

**랜딩 페이지 내용이 재수탁자의 분류기를 거친다.** 수탁 구조가 2단(OpenAI → 재수탁자)이며, 재수탁자 목록은 별도 페이지에서 관리된다.

### 5. 금지 데이터 — PHI·결제카드

> "ChatGPT Sites must not process **Protected Health Information or payment-card data**. Additionally, if your Site processes other sensitive personal data, make sure the processing is within the visitor's reasonable expectations and obtain **express opt-in consent** when required."

출처: [Creating and managing ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites) (검색 인용, 원문 미확인)

`ADR-20260814-002`가 이미 건강·의료 응답과 결제를 제외 범위로 두었으므로 **현재 설계는 이 제약과 충돌하지 않는다.** 오히려 플랫폼 약관이 같은 경계를 요구한다.

### 6. 삭제 후 내부 보존 — 30일

> "Data is retained internally for **no greater than 30 days** following a deletion request."

> "Following expiry or termination of an agreement, OpenAI will, at your instruction, return or delete Hosted Data and existing copies, unless retention is required under applicable laws."

출처: 검색 인용 (원문 미확인)

우리 삭제 API가 D1 행을 지워도 **최대 30일간 플랫폼 내부에 남을 수 있다.** WF-01이 기록한 Cloudflare D1 Time Travel 7일은 우리 계정 기준이며, 여기에는 적용되지 않는다.

## 미확인 항목

| # | 항목 | 사유 |
|---|---|---|
| 1 | 위 인용문의 원문 대조 | `help.openai.com`·`openai.com`이 403 반환 |
| 2 | 재수탁자 명단과 각 소재국 | Sub-processor list 원문 미확인 |
| 3 | Hosted Data의 실제 저장 국가 | 레지던시 미지원이라 지정 불가. 실제 배치 국가는 공개되지 않음 |
| 4 | 플랫폼 접근 로그의 보존 기간 | Compliance Logs 30일은 별개 기능일 수 있어 Sites 로그에 적용되는지 불명 |
| 5 | Sites 이용 가능 플랜과 계약상 DPA 체결 상태 | 소유자 계정 확인 필요 |

## 이 확인이 TASK-0001에 미치는 영향

### 영향 1 — SES 서울 선택의 근거가 약해졌다

`ADR-20260817-003`은 Amazon SES `ap-northeast-2`를 선택하며 **"이메일 주소를 국내에서 처리해 국외 이전 고지를 피할 수 있다"**를 핵심 근거로 삼았다.

그러나 **대기자 이메일의 원본은 D1에 저장되고, 그 D1의 위치를 통제할 수 없다.** 발송 경로만 국내로 만들어도 저장은 국외일 수 있으므로, **국외 이전 고지는 어차피 필요하다.**

SES 서울 선택 자체는 여전히 유효하다(발송 경로의 수탁자를 하나 줄이고 비용도 낮다). 다만 "고지를 피할 수 있다"는 근거는 성립하지 않으므로 ADR을 정정한다.

### 영향 2 — 개인정보 안내에 반드시 들어가야 할 것

WF-04에서 다음을 반영한다.

- 수탁자: **OpenAI**(호스팅·저장, Processor)와 그 **재수탁자**, Amazon(이메일 발송), Cloudflare(Turnstile)
- **데이터 저장 국가를 특정할 수 없다는 사실**과 국외 이전 가능성
- Hosted Data에 로그·기기정보·쿠키 수집분이 포함된다는 사실
- 재수탁자가 페이지에 보안·안전 분류기를 실행한다는 사실
- 삭제 요청 후 **최대 30일** 내부 보존 가능성

### 영향 3 — 공개 판정 입력

실행 계획 104행 조건 2("D1 및 호스팅 로그의 실제 처리 국가·수탁 범위·백업 보존")는 **"처리 국가는 확정 불가, 수탁 범위는 2단 구조로 확인됨, 삭제 후 30일 보존"**으로 판정 가능하다. 다만 위 미확인 5건이 남아 있으므로 WF-06에서 이를 명시한 상태로 GO/NO-GO를 낸다.

## 소유자 확인 필요

- [ ] 위 인용문을 OpenAI 공식 문서 원문에서 대조
- [ ] Sub-processor list에서 재수탁자와 소재국 확인
- [ ] 워크스페이스의 Sites 이용 플랜과 DPA 체결 상태 확인
- [ ] 국외 이전 고지를 포함한 개인정보 안내로 공개할지, 아니면 데이터 위치를 통제할 수 있는 자체 배포로 전환할지 결정

## 저장 금지 정보 확인

이 문서에는 접근 토큰, 자격증명, 실제 참가자 데이터를 포함하지 않았다. `project_id`는 저장소의 `landing/.openai/hosting.json`에 이미 있는 값이며 여기에 다시 적지 않았다.
