# FitPulse 프로젝트 문서 색인

Status: ACTIVE INDEX

Updated: 2026-08-14

이 디렉터리는 FitPulse의 설계, 검증 계획, 결정과 검증 결과를 보관하는 작업 기준점이다. `wiki/`는 역사 자료와 GitHub Wiki 게시 작업공간이며, 신규 계획의 기본 저장 위치가 아니다.

## 현재 결론

- 현재 단계: **`PREVALIDATION_LITE` — 랜딩과 비민감 수요 데이터 수집 우선**
- 랜딩 구현·로컬 검증: **완료**. 프로덕션 Worker 통합 시험과 동등 브라우저 뷰포트 기능 QA 통과
- 랜딩 배포: **소유자 전용 검증본**. 외부 방문자와 허용 그룹 없음
- 랜딩 공개·대기자 모집: 이메일 확인·발송, 데이터 위치·백업 보존, 공개 남용 방어와 비용 중단 조건이 남아 **NO-GO**
- 제품·앱 구현: **아직 진행하지 않음**
- 결제·예약금 수집: **승인되지 않음**
- 건강·의료·웨어러블 데이터 수집과 개인화 추천: **승인되지 않음**
- 계약·예산 책임 모델: **개인사업자 1인 자체 검토** (`SOLE_PROPRIETOR_SELF_REVIEW`). 본인 통제·500,000원 상한·전체 B-00 범위·`GATE_V0_DECISION_ISSUED` 종료 조건 입력 완료
- 검증 보증 수준: **창업자 자체 검토**. 외부 역할 인력은 필수 배정하지 않으며 독립 검증 완료를 주장하지 않음
- B-00~B-05 상태: 서비스·사업 운영 전 참고 이력. 현재 랜딩 구현의 선행 차단 조건으로 사용하지 않음

## 문서 권위

같은 범위에서 문서가 충돌하면 다음 순서를 적용한다.

1. 루트 `CLAUDE.md`
2. 적용 범위와 발효 시점이 같은 최신 승인 `docs/decisions/`
3. 승인된 `docs/design/`
4. 해당 게이트에서 승인된 `docs/plans/`
5. `wiki/`의 게시본·역사 자료

`DRAFT` 문서는 승인된 결정이나 실행 권한을 만들지 않는다.

## 시작 위치

| 문서 | 종류 | 용도 | 현재 상태 |
|---|---|---|---|
| [세션 인계 문서 2026-08-17](./HANDOFF-20260817.md) | Handoff | 진행 상태, 차단 요인, 다음 작업 순서 | **다음 세션이 먼저 읽는다** |
| [랜딩 우선 사전 검증 결정](./decisions/ADR-20260814-002-prevalidation-lite-landing-first.md) | Decision | 현재 범위와 정식 문서 체계 재개 조건 | 승인됨; 현재 최우선 기준 |
| [랜딩·데이터 검증 실행 계획](./plans/fitpulse-landing-data-validation-execution-plan-20260814.md) | How-to / Plan | 랜딩 구현, 비민감 수집, 공개 전 체크 | 실행 중 |
| [랜딩 데이터 삭제·보존 런북](./runbooks/fitpulse-landing-data-deletion-retention.md) | Runbook | 직접 삭제, 자동 만료와 검산 절차 | 소유자 전용 검증에 적용 |
| [개인사업자 1인 자체 검토 거버넌스 결정](./decisions/ADR-20260814-001-sole-proprietor-self-review-governance.md) | Decision | V0~V2 역할 통합, 보증 수준과 주장 제한 | 승인됨; 실행 권한은 부여하지 않음 |
| [증거 게이트형 단계별 제품 프로그램](./design/fitpulse-evidence-gated-product-program-design-20260814.md) | Explanation / Reference | 전체 게이트, 문서 권위, 역할·데이터 경계 | 설계 기준 |
| [Android 자동 진행 코치 상품 검증 개정안](./design/fitpulse-android-progression-coach-validation-design-20260814.md) | Explanation | 대상 사용자와 단계별 상품 검증 방향 | 설계 기준 |
| [V0·V1 브랜드 및 문제 검증 실행 계획](./plans/fitpulse-v0-v1-brand-and-problem-validation-plan-20260814.md) | Reference / Explanation | 정식 검증 체계 재개 시 참고 | 현재 실행 기준 아님 |
| [B-00~B-05 승인·증거 인수 방법](./plans/fitpulse-v0-authorization-evidence-intake-guide-20260814.md) | Reference | 정식 서비스·사업 운영 전 증거 관리 참고 | 현재 랜딩의 차단 조건 아님 |
| [V0 측정 계획](./plans/MEASURE-V0-20260814-001.md) | Reference | 상세 사전 등록이 필요한 후속 실험 참고 | 현재 실행 기준 아님 |
| [V1 중립 연구 모집 페이지 계획](./plans/fitpulse-v1-research-recruitment-page-plan-20260814.md) | Reference | 후속 정성 연구 참고 | 현재 실행 기준 아님 |
| [V2 랜딩 수요 실험 계획](./plans/fitpulse-v2-landing-demand-experiment-plan-20260814.md) | Reference | 유료 약정·정식 실험 단계 참고 | 현재 실행 기준에서 대체됨 |

## 산출물 위치

| 경로 | 허용 내용 | 금지 내용 |
|---|---|---|
| `docs/design/` | 제품·기술 설계와 근거 | 식별 가능한 원자료 |
| `docs/plans/` | 측정·실행 계획, 운영 방법 | 실제 연락처·서명·결제 식별자 |
| `docs/discovery/` | 비식별 증거 요약과 불투명 증거 ID | 참가자별 원문·5명 미만 소수 셀 |
| `docs/decisions/` | 승인된 게이트 결정과 ADR | 승인되지 않은 결론 위장 |
| `docs/runbooks/` | 현재 구현과 일치하는 반복 운영·삭제 절차 | 확인되지 않은 공급자 동작을 완료로 주장 |
| `docs/verification/` | 재현 가능한 검사와 자체 검산 결과; 적용 시 별도 외부 검증 결과 | 원자료 사본 |
| `docs/reference/` | 안정적인 용어·감사 기준 | 현재 결정과 충돌하는 무표시 역사 내용 |

## Git에 저장하지 않는 정보

- 사람의 이름, 이메일, 전화번호, 서명과 신분·자격 증빙 원문
- 참가자 모집 대화, 동의서, 철회 요청, 녹음·영상·화면 공유
- 건강·운동 기록 원문, 실제 내보내기 파일과 신원 매핑 키
- 저장소 실경로, 접근 토큰, 복구키, 결제·계좌·세금 식별자
- 계약서·법률·세무 의견서 원문에 포함된 식별정보

Git에는 승인된 제한 저장소의 불투명한 기록 ID, 상태, 확인일, 적용 범위와 비민감 집계만 남긴다.

## 다음 작업

1. 이메일 확인·발송 공급자와 공개 트래픽 남용 방어를 선택한다.
2. 실제 데이터 처리 국가, 수탁 범위, 로그·백업 보존과 복구 후 삭제 재적용 절차를 확인한다.
3. 개인정보 안내와 [삭제·보존 런북](./runbooks/fitpulse-landing-data-deletion-retention.md)을 확인된 공급자 사실에 맞춘 뒤 공개 여부를 다시 판정한다.
4. 초기 100개 유효 방문의 기준선을 확인한 뒤 다음 실험과 A/B 테스트 여부를 결정한다.
5. 결제, 건강정보, 개인화 추천, 계정 또는 정식 서비스 단계에 진입할 때 실제 구조를 기준으로 정식 운영 문서를 다시 작성한다.
