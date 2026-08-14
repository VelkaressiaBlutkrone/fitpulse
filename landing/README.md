# FitPulse landing

제품 개발 전 수요를 확인하기 위한 모바일 우선 랜딩페이지다. 현재는 이메일 대기자, 비민감 선택 설문과 개인식별자가 없는 행동 이벤트만 다룬다.

## 로컬 실행

~~~powershell
npm ci
npm run dev
~~~

기본 로컬 주소는 `http://localhost:3000`이다.

## 검증

~~~powershell
npm test
npm run lint
~~~

`npm test`는 프로덕션 빌드 후 로컬 Cloudflare 런타임에서 렌더링, 입력 거부, 중복 등록, 설문 분리와 이벤트 개인정보 경계를 확인한다.

## 데이터

- `waitlist_entries`: 이메일과 동의 정보
- `survey_responses`: 고정 선택형 비민감 응답
- `landing_events`: 허용 목록 기반 행동 이벤트

로컬 개발 데이터는 `.wrangler/`에 저장되며 Git에 포함되지 않는다. 공개 배포 전에 실제 운영 연락처와 최종 개인정보 안내를 확정해야 한다.
