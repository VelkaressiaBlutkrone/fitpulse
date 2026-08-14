# Repository instructions

## 절대 조건 — 모든 작업에 예외 없이 적용

아래 다섯 가지는 이 저장소의 어떤 작업에도 우선하는 최상위 규칙이다. 개별 지시가 이를 명시적으로 면제하지 않는 한 항상 따른다.

### 1. 추측·예상 금지

- 코드·설정·동작·의존성을 추측하지 않는다. 모르면 파일을 읽고 명령을 실행해 사실을 확인한 뒤 행동한다.
- "아마 ~일 것이다", "보통 ~하다" 같은 가정에 기반한 변경·답변·커밋을 금지한다.
- 확인이 불가능하면 진행을 멈추고 묻는다. 모르는 것을 아는 척하지 않는다.

### 2. 테스트 코드 우선 (Test-First)

- 모든 기능 추가·수정은 실패하는 테스트를 먼저 작성하고, 그 테스트를 통과시키는 최소 구현을 작성한다.
- 테스트 없는 구현 변경을 금지한다. 변경 후에는 반드시 테스트를 실행해 통과를 눈으로 확인한다.
- 구체적 테스트·검증 명령은 아래 "빌드·테스트" 절을 따른다.

### 3. 문제 발생 시 코드 분석 우선

- 버그·테스트 실패·예상 밖 동작이 생기면 추측으로 고치지 않는다. 먼저 관련 코드·로그·스택 트레이스를 읽어 근본 원인을 규명한다.
- 증상만 덮는 임시방편을 금지한다. 원인을 설명할 수 있을 때만 수정한다.

### 4. 신규 작업은 무조건 신규 브랜치

- 모든 신규 작업은 시작 전 `develop`에서 새 작업 브랜치(`feat/*`, `fix/*`, `chore/*`, `docs/*`)를 분기해 그 위에서 진행한다.
- `develop`, `main` 등 공유·통합 브랜치에서 직접 작업하지 않는다.
- 여러 세션이 동시에 작업할 때 파일 관리 충돌을 예방하도록 미커밋 변경을 공유 브랜치 작업 트리에 방치하지 않는다.

### 5. 결과를 자화자찬하지 않는다 — 항상 검증·테스트로 확인

- 작업 결과를 스스로 칭찬하거나 과신하지 않는다. "완료했다", "문제없다"는 검증·테스트로 확인한 근거가 있을 때만 말한다.
- 당장 문제가 없어 보여도 모든 작업은 엄격하게 검증·테스트해 결과를 확인한다. 검증되지 않은 성공·완료를 보고하지 않는다.

## 빌드·테스트

- 명령 실행 전 실제 모듈 경로와 빌드 설정 파일을 읽어 해당 명령이 현재 저장소에 적용되는지 확인한다. 확인할 수 없으면 실행하거나 대체 명령을 추측하지 않는다.
- 백엔드: Wiki 배포 가이드에 명시된 검증 명령은 `./gradlew test`이다.
- 모바일 앱: Wiki 배포 가이드에 명시된 검증 명령은 `flutter analyze`와 `flutter test`이다.
- 관리자 웹: Wiki 배포 가이드에는 `npm run build`만 명시되어 있다. 테스트 명령은 실제 `package.json`의 scripts를 확인한 뒤 사용한다.
- 문서 변경: 최소한 `git diff --check`를 실행하고, 문서가 참조하는 로컬 경로와 파일의 존재 여부를 확인한다.
- 현재 구현 또는 빌드 설정 파일이 없는 단계에서는 실행할 수 없는 빌드·테스트를 통과했다고 보고하지 않는다.

## Document placement

- Keep repository-level control files that must live at the root, such as `CLAUDE.md`, in the repository root.
- Store design documents, plans, specifications, reviews, reports, and other project documentation under `docs/` unless a tool or platform requires a specific root-level path.
- Treat `wiki/` as the source material and publication workspace for the GitHub Wiki, not as the default location for new implementation-planning artifacts.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
