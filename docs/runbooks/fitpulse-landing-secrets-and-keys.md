# 랜딩 공개 시 키·시크릿 등록 절차

Status: 준비 절차 — 일부 경로 미확인

Date: 2026-08-17

Parent: TASK-0001 (WF-02, WF-09 산출물의 운영 절차)

## 등록해야 하는 값 4개

| 값 | 쓰이는 곳 | 없으면 |
|---|---|---|
| `TURNSTILE_SITE_KEY` | 랜딩 페이지 위젯 렌더링 (공개 값) | 위젯이 표시되지 않아 사용자가 토큰을 얻지 못함 |
| `TURNSTILE_SECRET_KEY` | 서버 `siteverify` 검증 (비밀) | **모든 등록이 503으로 거부**(fail-closed) |
| `MAINTENANCE_TOKEN` | 정리 트리거 인증 (비밀) | 외부 스케줄러 경로가 막힘. 401 거부 |
| `LANDING_BASE_URL` | GitHub Actions가 호출할 주소 (비밀 아님) | 스케줄러 워크플로 실패 |

앞의 3개는 **Worker 런타임**에, `LANDING_BASE_URL`과 `MAINTENANCE_TOKEN`은 **GitHub 저장소 시크릿**에 등록한다. `MAINTENANCE_TOKEN`은 양쪽에 같은 값을 넣는다.

## 1. Turnstile 위젯 생성

공개 도메인이 확정된 뒤에 만든다. 위젯의 허용 호스트네임을 그 도메인으로 지정해야 한다.

### CLI

```powershell
cd landing
npx wrangler turnstile widget create "fitpulse-landing" `
  --domain <공개 도메인> `
  --mode managed `
  --json
```

- `--domain`은 필수이며 여러 번 지정하거나 쉼표로 나열할 수 있다
- `--mode`는 `managed`, `invisible`, `non-interactive` 중 하나다. 현재 클라이언트는 `data-appearance="interaction-only"`로 렌더링하므로 `managed`가 맞다
- `--region`은 **생성 후 변경할 수 없다.** 지정하지 않으면 기본값이 쓰인다
- `--ephemeral-id`, `--offlabel`, `--bot-fight-mode`는 Enterprise 전용이므로 쓰지 않는다
- 이 명령은 **alpha 단계**다. 실패하면 아래 대시보드 경로를 쓴다

출력 JSON에서 sitekey와 secret을 얻는다. **secret은 이때만 확인할 수 있으므로 즉시 보관한다.**

### 대시보드

Cloudflare 대시보드 → Turnstile → Add widget. 허용 호스트네임에 공개 도메인을 넣는다.

### 한도

Free 플랜은 계정당 위젯 20개, 위젯당 호스트네임 10개, `siteverify` 요청 무제한이다. 이 랜딩은 위젯 1개면 충분하다.

## 2. `MAINTENANCE_TOKEN` 생성

추측하기 어려운 임의 값이어야 한다.

```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

```bash
# Git Bash 등
openssl rand -base64 32
```

생성한 값을 Worker와 GitHub 양쪽에 **같은 값으로** 등록한다. 값이 다르면 스케줄러가 401을 받는다.

## 3. Worker 런타임에 주입 — **경로 미확인**

`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `MAINTENANCE_TOKEN`을 배포된 Worker의 환경변수로 넣어야 한다.

**`wrangler secret put`은 이 배포에 쓸 수 없다.** 그 명령은 우리 Cloudflare 계정의 Worker를 대상으로 하는데, 이 랜딩은 ChatGPT Sites 플랫폼이 자체 인프라에 배포한다(`docs/verification/fitpulse-landing-platform-data-handling-20260817.md` 참조).

확인된 것은 다음까지다.

- Site 설정 경로: `chatgpt.com/sites` → 해당 Site → **More actions → Settings**
- OpenAI 지침: 시크릿 값을 프롬프트·첨부파일·Site 콘텐츠에 넣지 말고 **`.openai/hosting.json`에도 저장하지 말 것**

이 지침은 별도의 시크릿 관리 수단이 있음을 시사하지만, **Settings 화면에서 환경변수를 등록하는 정확한 절차는 확인하지 못했다.** `help.openai.com`이 HTTP 403을 반환해 원문을 열지 못했다.

### 소유자가 확인해야 할 것

- [ ] Site Settings에 환경변수 또는 시크릿 항목이 있는지
- [ ] 있다면 Worker 런타임의 `env`로 전달되는지 (우리 코드는 `env.TURNSTILE_SECRET_KEY` 형태로 읽는다)
- [ ] 없다면 대안 — 이 경우 Turnstile 검증과 정리 트리거를 현재 구조로 운영할 수 없으므로 설계를 다시 봐야 한다

**이 확인 전에는 공개할 수 없다.** 시크릿이 주입되지 않으면 fail-closed 설계에 따라 모든 등록이 503으로 거부된다.

### 코드가 읽는 이름

| 환경변수 | 읽는 위치 |
|---|---|
| `TURNSTILE_SITE_KEY` | `landing/app/page.tsx` — 위젯 sitekey |
| `TURNSTILE_SECRET_KEY` | `landing/app/lib/turnstile.ts` — `siteverify` 호출 |
| `TURNSTILE_VERIFY_URL` | 같은 파일. **설정하지 않는다.** 기본값이 Cloudflare 실제 주소이며 테스트에서만 덮어쓴다 |
| `MAINTENANCE_TOKEN` | `landing/worker/index.ts` → `handleMaintenancePurge` |

## 4. GitHub 저장소 시크릿 등록

### CLI

```powershell
gh secret set LANDING_BASE_URL --body "https://<공개 도메인>"
gh secret set MAINTENANCE_TOKEN --body "<3단계에서 만든 값>"
```

### 웹

저장소 → Settings → Secrets and variables → Actions → New repository secret.

### 확인

```powershell
gh secret list
```

값은 표시되지 않고 이름과 갱신일만 나온다. 등록 후 워크플로를 수동 실행해 동작을 확인한다.

```powershell
gh workflow run retention-purge.yml
gh run list --workflow=retention-purge.yml --limit 1
```

**공개 전에는 이 워크플로가 실패하는 것이 정상이다.** 소유자 전용 상태에서는 외부에서 접근할 수 없다.

## 5. 등록 후 확인

| 확인 | 방법 | 기대 |
|---|---|---|
| 위젯 렌더링 | 공개 페이지 HTML에서 `cf-turnstile`과 `data-sitekey` 검색 | 둘 다 존재 |
| 등록 흐름 | 실제 브라우저에서 위젯을 풀고 제출 | 202 |
| 방어 동작 | 토큰 없이 API 직접 호출 | 403 `turnstile_required` |
| 시크릿 주입 | 위와 동일 | 503 `verification_unavailable`이 나오면 **시크릿 미주입** |
| 정리 트리거 | `gh workflow run retention-purge.yml` | 202 |

## 금지 사항

- 실제 secret key와 `MAINTENANCE_TOKEN`을 저장소에 커밋하지 않는다. `landing/.dev.vars`는 gitignore 대상이다
- 토큰을 질의 문자열로 보내지 않는다. 서버가 거부하며, 접근 로그와 Referer에 남는다
- `.openai/hosting.json`에 시크릿을 넣지 않는다 (OpenAI 지침)
- 테스트용 공개 키(`1x...`, `2x...`)를 운영에 쓰지 않는다. 항상 통과 또는 항상 거부하므로 방어가 되지 않는다
