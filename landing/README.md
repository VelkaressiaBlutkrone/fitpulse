# FitPulse landing

제품 개발 전 수요를 확인하기 위한 모바일 우선 랜딩페이지다. 현재는 이메일 대기자, 비민감 선택 설문과 개인식별자가 없는 행동 이벤트만 다룬다.

현재 배포본은 **소유자 전용 사전 검증 상태**다. 이메일 확인·발송과 실제 데이터 처리 위치 확인이 끝나기 전에는 외부 공개하지 않는다.

## 로컬 실행

~~~powershell
npm ci
npm run dev
~~~

기본 로컬 주소는 `http://localhost:3000`이다.

빌드된 Cloudflare Worker와 로컬 D1을 함께 실행하려면 다음을 사용한다.

~~~powershell
npm run preview
~~~

## 검증

~~~powershell
npm test
npm run lint
npm audit --omit=dev
~~~

`npm test`는 프로덕션 빌드 후 로컬 Cloudflare 런타임에서 마이그레이션을 적용하고 렌더링, 보안 헤더, 입력 거부, 중복 등록, 세션 기반 설문·삭제, 이벤트 개인정보 경계, 요청 제한과 보존 기간 정리를 확인한다.

## 데이터

- `waitlist_entries`: 이메일과 동의 정보
- `survey_responses`: 고정 선택형 비민감 응답
- `landing_events`: 허용 목록 기반 행동 이벤트
- `request_rate_limits`: 브라우저 세션별 단기 요청 제한 기록

확인되지 않은 이메일은 14일, 그 밖의 대기자·설문·이벤트 데이터는 최대 365일 보관한다. 일일 예약 작업이 만료 데이터를 삭제하고, 같은 브라우저에서는 등록 직후 이메일과 연결 설문을 직접 삭제할 수 있다. 운영 절차는 [데이터 삭제·보존 런북](../docs/runbooks/fitpulse-landing-data-deletion-retention.md)을 따른다.

로컬 개발 데이터는 `.wrangler/`에 저장되며 Git에 포함되지 않는다. 공개 전에는 실제 운영 연락처, 이메일 확인 공급자, 데이터 처리 위치와 최종 개인정보 안내를 확정해야 한다.
