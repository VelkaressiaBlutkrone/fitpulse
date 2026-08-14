# How to complete FitPulse B-00~B-05 authorization and evidence intake

Status: DRAFT GUIDE — DOES NOT GRANT EXECUTION AUTHORITY

Date: 2026-08-14

Applies to: Gate V0 preflight

External recruitment authorized: **NO**

Payment or deposit collection authorized: **NO**

## 결과

이 가이드를 끝내면 실제 담당자와 검토자가 제한 저장소에 B-00~B-05 승인 원문을 보관하고, Git에는 개인·계약·결제 정보를 노출하지 않는 불투명 승인 기록 ID만 남길 수 있다.

현재 저장소에서는 B-00~B-05의 실제 값을 확인할 수 없다. 따라서 모든 필드는 `UNVERIFIED`이며, [V0 측정 계획](./MEASURE-V0-20260814-001.md)은 문서 `DRAFT`, 실행 `BLOCKED` 상태다.

2026-08-14 사용자 입력으로 계약·예산 책임 모델이 **개인 프로젝트**라는 점과 다음 B-00 입력을 확인했다.

- 연구 착수·예산·외부 계약·결제 계정 직접 통제: `true`
- V0 총예산 상한: 500,000원
- 발효일: 2026-08-14
- 종료 조건: `GATE_V0_DECISION_ISSUED`
- 범위: 내부 조사, 상표 전문가 계약, 연구 저장소 계약, 참가자 모집·사례비, 환불 가능한 예약금 수집

이 입력은 서명 원문과 검증 기록을 대신하지 않는다. B-00은 계속 `UNVERIFIED`이며 B-02~B-04가 충족되기 전 참가자 모집·사례비·예약금 실행은 금지된다.

관련 문서:

- [프로젝트 문서 색인](../README.md)
- [V0·V1 브랜드 및 문제 검증 실행 계획](./fitpulse-v0-v1-brand-and-problem-validation-plan-20260814.md)
- [증거 게이트형 단계별 제품 프로그램](../design/fitpulse-evidence-gated-product-program-design-20260814.md)

## 1. 준비물

다음 항목은 이 저장소 밖에서 실제 권한자가 준비해야 한다.

1. 조직이 승인했거나 개인 사업 책임자가 직접 통제하는 제한 저장소
2. 승인 원문을 읽고 서명할 실제 위임권자
3. 역할별 담당자와 이해충돌을 검토할 수단
4. 계약·소비자 고지·세무와 상표 검토를 의뢰할 실제 경로
5. 승인 기록을 변경 불가능한 방식으로 식별할 불투명 ID 체계

이 가이드는 특정 클라우드, 폼, 결제 또는 법률 공급자를 승인하지 않는다. 무료 티어, 익숙한 도구 또는 저장소 소유권만으로 적합성을 추론하지 않는다.

## 2. 정보 경계부터 고정하기

### 제한 저장소에만 둘 정보

- 담당자의 이름, 연락처, 서명, 소속과 권한 근거 원문
- 계정 소유자, 공급자 계약, 저장 위치와 복구·암호화 세부 정보
- 예산 계정, 지급·결제·환불·세무 원문
- 상표 전문가의 이름·자격·연락처와 의견서 원문
- 접근 로그, 삭제 증명, 백업 위치와 복구키

### Git에 둘 수 있는 정보

- `AUTH-*`, `ROLE-*`, `DATA-*`, `CHANNEL-*`, `OFFER-*`, `TM-*` 형식의 불투명 기록 ID
- `UNVERIFIED`, `SUBMITTED`, `VERIFIED`, `REJECTED`, `EXPIRED` 상태
- 검토 완료 시각, 적용 범위, 유효기간과 비민감 비용 상한
- 역할 코드, 금지 겸임 검사 결과와 공개 가능한 판정
- 합성 자료 리허설의 통과·실패, 후보별 비민감 검색 요약

불투명 ID는 URL, 폴더명, 이메일, 이름, 전화번호, 공급자 계정 또는 결제 식별자를 인코딩하지 않는다.

## 3. 공통 상태 규칙

| 상태 | 의미 | 다음 행동 |
|---|---|---|
| `UNVERIFIED` | 원문 또는 실제 담당자를 확인하지 못함 | 외부 행동 금지 |
| `SUBMITTED` | 제한 저장소에 원문이 있지만 필수 검토가 끝나지 않음 | 검토만 허용 |
| `VERIFIED` | 지정 승인자가 원문·권한·범위를 확인하고 서명함 | 해당 범위 안의 다음 작업만 허용 |
| `REJECTED` | 권한·범위·통제가 요구사항을 충족하지 않음 | 대체 경로가 없으면 `STOP` |
| `EXPIRED` | 유효기간 또는 재검증 트리거가 지남 | 새 승인 전 사용 금지 |

자기 선언이나 Git 커밋은 `VERIFIED` 근거가 아니다. 각 기록에는 승인자, 승인 시각, 적용 범위, 유효기간 또는 무효화 트리거가 있어야 한다.

## 4. B-00 위임권한 기록하기

### 제한 저장소 필수 항목

| 필드 | 확인 내용 |
|---|---|
| 책임 주체 | 개인 프로젝트인지 조직 프로젝트인지와 계약 책임 주체 |
| 권한 보유자 | 연구 착수, 예산 사용, 외부 계약을 승인할 실제 사람 |
| 권한 근거 | 본인 책임 확인 또는 조직 위임·직무·결재 기록 |
| 허용 범위 | 내부 조사, 외부 전문가 의뢰, 참가자 모집, 사례비, 예약금 중 허용 항목 |
| 비용 상한 | 통화, 총액, 항목별 제한과 초과 승인 절차 |
| 시간 범위 | 발효 시각, 만료 시각과 중단 권한 |
| 서명 | 권한 보유자의 날짜가 포함된 승인 기록 |

### Git 투영 필드

~~~yaml
b00:
  status: UNVERIFIED
  input_state: COMPLETE_AWAITING_SIGNED_RECORD
  responsibility_model: INDIVIDUAL_PROJECT
  responsibility_model_confirmed_at: 2026-08-14
  authority_control_attested: true
  owner_attested_budget_cap_krw: 500000
  owner_attested_valid_from: 2026-08-14
  owner_attested_termination_trigger: GATE_V0_DECISION_ISSUED
  owner_attested_scope_codes:
    - INTERNAL_RESEARCH
    - TRADEMARK_EXPERT_CONTRACT
    - RESEARCH_STORE_CONTRACT
    - PARTICIPANT_RECRUITMENT_AND_INCENTIVE
    - REFUNDABLE_DEPOSIT_COLLECTION
  authorization_record_id: NOT_PROVIDED
  authority_basis_verified: false
  approved_scope_codes: []
  budget_cap_krw: null
  valid_from: null
  valid_until: null
  verified_at: null
~~~

범위 코드는 B-00에서 비용·계약 권한을 어디까지 위임하려는지 기록한다. 코드가 목록에 있다는 사실만으로 해당 행동이 실행 가능해지지 않는다. `PARTICIPANT_RECRUITMENT_AND_INCENTIVE`는 B-02·B-03, `REFUNDABLE_DEPOSIT_COLLECTION`은 B-02·B-04와 V0 `GO`가 추가로 필요하다.

### 개인 프로젝트 서명 원문 템플릿

아래 템플릿의 완료본은 Git이나 이 대화에 붙이지 않고 제한 저장소에 둔다.

~~~text
기록 ID: [제한 저장소의 불투명 ID]
책임 모델: 개인 프로젝트

본인은 FitPulse V0에 대해 연구 착수, 연구 예산,
외부 계약 및 결제 계정을 직접 통제합니다.

총예산 상한: 500,000원
발효일: 2026-08-14
종료 조건: GATE_V0_DECISION_ISSUED

허용 범위:
- 내부 조사
- 상표 전문가 계약
- 연구 저장소 계약
- 참가자 모집 및 사례비
- 환불 가능한 예약금 수집

본 승인은 B-02~B-05 및 GATE-V0의 별도 통과 조건을
면제하지 않으며, 해당 조건 전에는 외부 실행을 시작하지 않습니다.

책임자 식별정보: [제한 저장소에만 기록]
서명: [제한 저장소에만 기록]
서명 시각: [ISO 8601]
~~~

`authorization_record_id`만으로는 충분하지 않다. R-PRIVACY 또는 지정 검토자가 제한 저장소에서 원문과 Git 투영값이 같은지 확인해야 한다.

### 통과 조건

- 연구·예산·계약 세 권한의 보유 범위가 각각 확인된다.
- 비용과 시간 상한이 숫자와 시각으로 기록된다.
- 허용하지 않은 외부 행동은 명시적으로 금지된다.
- 승인 ID와 서명이 존재한다.

## 5. B-01 역할과 독립성 기록하기

### 최소 배정

V0에는 최소 네 석이 필요하다.

1. `R-SPONSOR`
2. `R-PRODUCT/R-EVIDENCE`
3. `R-USER`
4. `R-PRIVACY`

V1 본 조사 전에는 별도 `R-VERIFY`를 추가한다. `R-VERIFY`는 본 조사 30명의 주 인터뷰어를 겸할 수 없고, `R-USER`는 실제 대상 사용자를 대표해야 한다.

### 제한 저장소 필수 항목

- 역할별 실제 담당자, 연락 경로, 수락 서명과 배정 기간
- 역할 수행 근거와 필요한 전문성
- 겸임 역할, 이해충돌과 완화 조치
- 부재·철회 때 대체 담당자 지정 방식
- 거부권과 최종 승인 범위

### Git 투영 예시

~~~yaml
b01:
  status: UNVERIFIED
  role_assignment_record_id: NOT_PROVIDED
  assignments:
    R-SPONSOR: NOT_ASSIGNED
    R-PRODUCT: NOT_ASSIGNED
    R-EVIDENCE: NOT_ASSIGNED
    R-USER: NOT_ASSIGNED
    R-PRIVACY: NOT_ASSIGNED
    R-VERIFY: NOT_ASSIGNED
    R-FINANCE: NOT_ASSIGNED
  minimum_four_seats_met: false
  prohibited_dual_roles_found: null
  verified_at: null
~~~

실제 이름 대신 역할 배정 레코드 안에서만 해석되는 담당자 ID를 쓴다.

### 통과 조건

- 최소 네 석과 각 책임 수락이 확인된다.
- `R-USER`의 실제 사용자 대표성이 기록된다.
- 같은 증거의 유일한 수집자와 유일한 검증자가 한 사람이 아니다.
- V1 본 조사 전 독립 검증자 확보 조건이 일정에 포함된다.

## 6. B-02 연구 저장소와 삭제 경로 기록하기

### 공급자·데이터 맵

선택한 각 서비스에 대해 다음 실제 값을 제한 저장소에서 확인한다.

| 범주 | 필수 값 |
|---|---|
| 공급자 | 법인·서비스명, 계약·계정 소유자, 약관·처리계약 버전 |
| 위치 | 운영·복제·백업 처리 국가와 데이터 영역 |
| 자료 | 연락처, 동의, 녹취, 화면 공유, 내보내기 원본, 매핑 키별 저장 위치 |
| 접근 | 역할별 읽기·내보내기·수정·삭제·복구 권한과 다중인증 여부 |
| 보호 | 전송·보관 보호 방식, 키·복구 권한, 감사 로그 |
| 수명주기 | 보존기간, 철회·종료 삭제, 백업 순환 최대기한, 파생자료 재생성 방식 |
| 사고 | 침해·오발송·권한 오류의 연락·격리·통지·종료 절차 |
| 재위탁 | 실제 재위탁자, 처리 국가, 확인일과 변경 통지 경로 |

공급자 문서에서 처리 국가·재위탁·삭제 동작을 확인할 수 없으면 `VERIFIED`로 표시하지 않는다.

### 합성 자료 삭제 리허설

실제 참가자 자료를 넣기 전에 식별정보처럼 생겼지만 실제 사람이 아닌 합성 레코드로 다음 순서를 실행한다.

1. 연락처 저장소와 연구 원자료 저장소에 서로 다른 합성 레코드를 만든다.
2. 신원 매핑 키를 별도 저장소에 만들고 승인 역할만 연결할 수 있게 한다.
3. 허용 역할이 읽기·내보내기·삭제를 수행할 수 있는지 확인한다.
4. 비허용 역할의 읽기·내보내기·복구 시도가 거부되는지 확인한다.
5. 철회 요청을 모사해 운영본, 복제본, 파생표와 매핑 키를 삭제한다.
6. 백업에서 복구를 모사한 뒤 철회 목록이 먼저 재적용되는지 확인한다.
7. 삭제 실행자와 별도 검증자가 잔존 여부를 확인한다.
8. Git에는 테스트 ID, 시각, 결과와 불투명 삭제 증명 ID만 남긴다.

### Git 투영 필드

~~~yaml
b02:
  status: UNVERIFIED
  data_map_record_id: NOT_PROVIDED
  access_matrix_record_id: NOT_PROVIDED
  retention_schedule_record_id: NOT_PROVIDED
  backup_deletion_record_id: NOT_PROVIDED
  synthetic_deletion_rehearsal_id: NOT_RUN
  rehearsal_result: NOT_RUN
  privacy_approval_id: NOT_PROVIDED
  verified_at: null
~~~

### 통과 조건

- 자료 유형마다 실제 저장 위치·접근자·보존·삭제가 연결된다.
- 연락처·원자료·매핑 키가 목적별로 분리된다.
- 비허용 접근 차단과 운영본·백업·파생자료 삭제 리허설이 모두 통과한다.
- 개인정보 검토자가 원문과 결과에 서명한다.

## 7. B-03 모집·사례비·예산 기록하기

### 제한 저장소 필수 항목

- 채널별 실제 운영 주체와 게시·연락 권한 증거
- 채널 코드, 유료·제휴·커뮤니티·지인 여부와 담당자
- 채널별 예산, 총예산, 중단 상한과 비용 승인자
- 사례비 금액, 지급 수단, 지급 시점과 지급 조건
- 파일럿·본 조사 모집 기간과 최대 연장 조건
- 무단 게시·QR·광고를 제거할 담당자와 연락 경로

사례비는 제품 의견과 무관하게 인터뷰 완료 조건으로 지급한다. 예약금과 같은 거래로 합치지 않는다.

### Git 투영 필드

~~~yaml
b03:
  status: UNVERIFIED
  recruitment_plan_record_id: NOT_PROVIDED
  approved_channel_codes: []
  channel_budget_cap_krw: null
  total_recruitment_budget_cap_krw: null
  participation_incentive_krw: null
  participation_incentive_method_code: NOT_PROVIDED
  pilot_recruitment_days: null
  main_recruitment_days: null
  recruitment_owner_role: NOT_ASSIGNED
  verified_at: null
~~~

### 통과 조건

- 각 채널의 사전 허가와 중단 방법이 확인된다.
- 사례비·채널비·예약금이 별도 항목으로 구분된다.
- 금액, 기간, 담당자와 총상한이 실제 값으로 채워진다.
- 승인되지 않은 채널 코드는 비활성 상태다.

## 8. B-04 약정 오퍼·환불·세무 기록하기

### 오퍼 필수 항목

~~~yaml
offer_version: REQUIRED
scope: REQUIRED
delivery_method: REQUIRED
pilot_duration_days: REQUIRED
price_krw: REQUIRED
deposit_krw: REQUIRED
payment_method: REQUIRED
refund_window_days: REQUIRED
refund_trigger: REQUIRED
commitment_observation_window_days: REQUIRED_AND_NOT_SHORTER_THAN_REFUND_WINDOW
participation_incentive_krw: REQUIRED
participation_incentive_payment_condition: INTERVIEW_COMPLETED_REGARDLESS_OF_PRODUCT_OPINION
service_start_condition: REQUIRED
contract_consumer_tax_review_id: REQUIRED
~~~

월 9,900원, 6개월 무료, 월 4,900원 또는 특정 출시일은 승인된 기본값이 아니다. 실제 값은 경제적 후원자와 계약·소비자·세무 검토자가 같은 오퍼 버전에 서명해야 한다.

### 제한 저장소 필수 항목

- 계약 주체와 결제 계정의 통제 주체
- 제공 범위, 기간, 시작 조건과 미제공 때 처리
- 가격·예약금, 결제 수단, 영수증·세무 처리
- 취소·환불 조건, 환불 창과 환불 실행 담당자
- 참가 사례비와 제품 예약금의 분리
- 데이터 철회가 약정·환불·법적 보존 기록에 미치는 영향
- 테스트 거래와 전액 환불 리허설 결과

### Git 투영 필드

~~~yaml
b04:
  status: UNVERIFIED
  offer_record_id: NOT_PROVIDED
  offer_version: NOT_PROVIDED
  contract_consumer_tax_review_id: NOT_PROVIDED
  payment_rehearsal_id: NOT_RUN
  refund_rehearsal_id: NOT_RUN
  real_payment_link_enabled: false
  verified_at: null
~~~

### 통과 조건

- 오퍼 필수 항목에 `REQUIRED`, `TBD`, 빈값이 없다.
- 결제와 환불을 실제 담당자가 테스트하고 별도 검증자가 확인한다.
- 환불 관찰창이 환불 가능 기간보다 짧지 않다.
- 오퍼 승인 전 실제 결제 링크가 생성·노출되지 않는다.

## 9. B-05 상표 전문가·검색 범위 기록하기

### 제한 저장소 필수 항목

- 한국 상표 검토를 수행할 전문가의 자격·업무 범위·이해충돌 확인
- 의뢰 예산, 의뢰 방식, 예상 응답일과 담당자
- 허용 도메인 패턴 목록과 필수 공식 계정 플랫폼
- 후보별 검색표, 관련 지정상품·서비스와 전문가 의견서
- 최소 한 후보의 한국 V0 단계 서면 예비 진행 의견

### 검색 계약

1. 후보별 정확명, 공백·하이픈 변형, 한글·영문·통용 로마자 표기와 발음 유사어를 기록한다.
2. 한국 Google Play, App Store와 일반 웹에서 활성 피트니스·건강 앱·서비스를 확인한다.
3. KIPRIS 상표 상세검색에서 상표명, 상태, 상품분류·유사군과 계획서가 지정한 9류·42류 관련 결과를 기록한다.
4. WIPO Global Brand Database는 해외 후보 보존을 위한 보조 검색으로 사용한다. WIPO도 국가·지역 관청 검색과 전문가 상담을 함께 고려하라고 안내하므로 한국 V0 판정을 대신하지 않는다.
5. 도메인과 핸들은 B-05에 등록된 패턴·플랫폼만 확인하며 V0 조사만으로 구매하지 않는다.
6. 결과를 “사용 가능”으로 표현하지 않고 “등록된 질의에서 명백한 충돌 미발견” 또는 전문가의 제한된 의견으로 기록한다.

공식 검색 경로:

- [KIPRIS 상표 상세검색 도움말](https://www.kipris.or.kr/khome/board/help/searchByRights.do?tab=trademark)
- [KIPRIS 검색 공통 기능](https://www.kipris.or.kr/khome/board/help/basic.do)
- [WIPO Global Brand Database](https://www.wipo.int/en/web/global-brand-database)

### Git 투영 필드

~~~yaml
b05:
  status: UNVERIFIED
  trademark_review_route_id: NOT_PROVIDED
  expert_engagement_record_id: NOT_PROVIDED
  budget_cap_krw: null
  allowed_domain_patterns: []
  required_handle_platform_codes: []
  preliminary_review_ids: []
  countable_candidate_count: 0
  verified_at: null
~~~

### 통과 조건

- 전문가 자격·범위·예산·의뢰 경로가 실제 기록으로 확인된다.
- 도메인 패턴과 필수 공식 계정 플랫폼이 사전 등록된다.
- 후보별 검색 질의·확인일·근거 ID와 위험 등급이 존재한다.
- 최소 한 후보에 서면 예비 검토 결과가 있다.

## 10. Git-safe 제출 묶음

실제 담당자는 제한 저장소에 원문을 만든 뒤 아래 값만 프로젝트 문서 담당자에게 전달한다.

~~~yaml
intake_version: B00-B05-20260814-001
jurisdiction: KR
private_record_system_id: NOT_PROVIDED
b00_authorization_record_id: NOT_PROVIDED
b01_role_assignment_record_id: NOT_PROVIDED
b02_data_lifecycle_record_id: NOT_PROVIDED
b03_recruitment_record_id: NOT_PROVIDED
b04_offer_review_record_id: NOT_PROVIDED
b05_trademark_route_record_id: NOT_PROVIDED
statuses:
  B-00: UNVERIFIED
  B-01: UNVERIFIED
  B-02: UNVERIFIED
  B-03: UNVERIFIED
  B-04: UNVERIFIED
  B-05: UNVERIFIED
verified_at: null
expires_at: null
scope_codes: []
~~~

다음 값은 이 묶음에 넣지 않는다: 이름, 이메일, 전화번호, 서명, 실제 저장소 URL, 공급자 계정, 접근 토큰, 결제 식별자, 계약·법률·세무 의견 원문.

## 11. 제출 후 검증

| 검사 ID | 실패 조건 | 통과 조건 |
|---|---|---|
| `INTAKE-001` | B-00 ID는 있지만 권한 근거·서명·상한을 제한 저장소에서 찾을 수 없음 | 원문과 Git 투영값 일치 |
| `INTAKE-002` | 최소 네 석 미배정 또는 금지 겸임 존재 | 역할·독립성 검사 통과 |
| `INTAKE-003` | 자료 유형 하나라도 저장·접근·보존·삭제 경로 없음 | 전체 데이터 맵 완결 |
| `INTAKE-004` | 합성 자료가 운영본·백업·파생자료 중 하나에 잔존 | 삭제 리허설 전부 통과 |
| `INTAKE-005` | 무단 채널, 빈 예산·사례비·기간 또는 담당자 없음 | B-03 실제 값·허가 증거 완결 |
| `INTAKE-006` | 오퍼에 빈 필드 또는 결제·환불 리허설 미실행 | B-04 승인·리허설 완결 |
| `INTAKE-007` | 전문가 원문 없이 상표 후보를 계수 | 해당 후보 계수 0 |
| `INTAKE-008` | Git 투영값에 PII·저장소 URL·결제 식별자 포함 | 금지 패턴 0건 |
| `INTAKE-009` | 승인 만료 또는 범위 밖 행동 | 상태 `EXPIRED`, 해당 행동 차단 |
| `INTAKE-010` | 제한 저장소 원문과 Git ID가 연결되지 않음 | `SUBMITTED` 이하, V0 승인 금지 |

모든 검사는 승인자와 별도 검증자가 각각 확인한다. 한 명만 있는 개인 프로젝트라면 외부 검증자를 확보하지 못한 항목을 독립 검증 완료로 표시하지 않는다.

## 12. 문제 해결

### 실제 담당자를 아직 정하지 못한 경우

B-01을 `UNVERIFIED`로 유지한다. 역할명을 임의의 사람 이름이나 AI로 채우지 않는다. V0 문서 검토 외 작업은 시작하지 않는다.

### 연구 저장소 공급자가 처리 국가나 삭제 방식을 공개하지 않는 경우

B-02를 `REJECTED`로 표시하고 확인 가능한 공급자를 다시 평가한다. “업계 표준일 것”이라는 가정으로 통과시키지 않는다.

### 예약금을 받을 계약 주체가 없는 경우

B-04를 `UNVERIFIED` 또는 `REJECTED`로 유지하고 실제 결제를 받지 않는다. 클릭·설문·구두 의향을 실제 약정으로 바꾸어 세지 않는다.

### 상표 전문가를 확보하지 못한 경우

검색 결과는 후보 탐색 자료로만 남기고 계수 가능한 출시 후보는 0개다. 브랜드명으로 도메인·UI·스토어 자산을 구매하거나 공개하지 않는다.

## 13. 완료 확인

이 가이드의 완료는 B-00~B-05가 자동 승인됐다는 뜻이 아니다. 다음이 모두 참일 때만 [V0 측정 계획](./MEASURE-V0-20260814-001.md)을 `IN_REVIEW`로 올릴 수 있다.

- B-00의 실제 위임 기록과 유효한 서명이 있다.
- B-01 최소 역할 배정과 금지 겸임 검사가 끝났다.
- B-02 데이터 맵과 합성 자료 삭제 리허설이 통과했다.
- B-03 채널·예산·사례비·기간이 승인됐다.
- B-04 동일 오퍼 버전과 계약·소비자·세무 검토가 완료됐다.
- B-05 전문가 경로와 최소 한 후보의 서면 예비 검토가 있다.
- Git-safe 제출 묶음에 금지 정보가 없다.
