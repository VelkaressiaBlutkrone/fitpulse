# FitPulse 프로젝트 문서 색인

Status: ACTIVE INDEX

Updated: 2026-08-14

이 디렉터리는 FitPulse의 설계, 검증 계획, 결정과 검증 결과를 보관하는 작업 기준점이다. `wiki/`는 역사 자료와 GitHub Wiki 게시 작업공간이며, 신규 계획의 기본 저장 위치가 아니다.

## 현재 결론

- 제품 구현: **승인되지 않음**
- 외부 참가자 모집·연락: **승인되지 않음**
- 결제·예약금 수집: **승인되지 않음**
- 현재 허용 작업: B-00~B-05 실제 승인 근거 준비, 내부 문서 검토, 합성 자료를 사용한 저장·삭제 리허설 설계
- 현재 차단 원인: 실제 위임권자, 역할 배정, 승인 연구 저장소, 모집 조건, 약정 오퍼, 상표 전문가 검토 경로가 확인되지 않음

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
| [증거 게이트형 단계별 제품 프로그램](./design/fitpulse-evidence-gated-product-program-design-20260814.md) | Explanation / Reference | 전체 게이트, 문서 권위, 역할·데이터 경계 | 설계 기준 |
| [Android 자동 진행 코치 상품 검증 개정안](./design/fitpulse-android-progression-coach-validation-design-20260814.md) | Explanation | 대상 사용자와 단계별 상품 검증 방향 | 설계 기준 |
| [V0·V1 브랜드 및 문제 검증 실행 계획](./plans/fitpulse-v0-v1-brand-and-problem-validation-plan-20260814.md) | Reference / Explanation | V0·V1 판정 규칙과 전체 실행 순서 | 담당자 입력 대기 |
| [B-00~B-05 승인·증거 인수 방법](./plans/fitpulse-v0-authorization-evidence-intake-guide-20260814.md) | How-to | 민감정보를 Git에 넣지 않고 차단 필드를 제출·검증하는 방법 | 사용 가능 |
| [V0 측정 계획](./plans/MEASURE-V0-20260814-001.md) | Reference | V0 실행 단위, 검색·리허설·판정 계약 | 문서 `DRAFT`, 실행 `BLOCKED` |
| [V1 중립 연구 모집 페이지 계획](./plans/fitpulse-v1-research-recruitment-page-plan-20260814.md) | Reference / How-to | 제품·가격 비노출 모집 페이지 계약 | 실행 차단 |
| [V2 랜딩 수요 실험 계획](./plans/fitpulse-v2-landing-demand-experiment-plan-20260814.md) | Reference / Explanation | V1 `GO` 뒤의 메시지·오퍼 실험 | V1 전 실행 차단 |

## 산출물 위치

| 경로 | 허용 내용 | 금지 내용 |
|---|---|---|
| `docs/design/` | 제품·기술 설계와 근거 | 식별 가능한 원자료 |
| `docs/plans/` | 측정·실행 계획, 운영 방법 | 실제 연락처·서명·결제 식별자 |
| `docs/discovery/` | 비식별 증거 요약과 불투명 증거 ID | 참가자별 원문·5명 미만 소수 셀 |
| `docs/decisions/` | 승인된 게이트 결정과 ADR | 승인되지 않은 결론 위장 |
| `docs/verification/` | 재현 가능한 검사와 독립 검증 결과 | 원자료 사본 |
| `docs/reference/` | 안정적인 용어·감사 기준 | 현재 결정과 충돌하는 무표시 역사 내용 |

## Git에 저장하지 않는 정보

- 사람의 이름, 이메일, 전화번호, 서명과 신분·자격 증빙 원문
- 참가자 모집 대화, 동의서, 철회 요청, 녹음·영상·화면 공유
- 건강·운동 기록 원문, 실제 내보내기 파일과 신원 매핑 키
- 저장소 실경로, 접근 토큰, 복구키, 결제·계좌·세금 식별자
- 계약서·법률·세무 의견서 원문에 포함된 식별정보

Git에는 승인된 제한 저장소의 불투명한 기록 ID, 상태, 확인일, 적용 범위와 비민감 집계만 남긴다.

## 다음 작업

1. [승인·증거 인수 방법](./plans/fitpulse-v0-authorization-evidence-intake-guide-20260814.md)에 따라 B-00부터 순서대로 제한 저장소에 기록한다.
2. Git에는 개인 정보가 없는 승인 기록 ID와 상태만 [V0 측정 계획](./plans/MEASURE-V0-20260814-001.md)에 반영한다.
3. `MEASURE-V0`가 승인되기 전에는 외부 연락, 브랜드 구매, 결제 링크 생성 또는 참가자 자료 수집을 하지 않는다.
4. V0 실행 뒤 별도의 `docs/decisions/GATE-V0-<date>-<sequence>.md`로 `GO/LOOP/STOP`을 판정한다.
