// 공개 트래픽 남용 방어. 클라이언트가 보낸 토큰을 서버에서만 검증한다.
// 검증 엔드포인트는 환경변수로 주입할 수 있으며, 기본값은 Cloudflare 실제 주소다.
// TASK-0001 / WF-02 설계 결정 1을 따른다.

export const DEFAULT_TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const MAX_TOKEN_LENGTH = 2048;

export type TurnstileConfig = {
  secretKey?: string;
  verifyUrl?: string;
};

export type TurnstileFailure =
  | "turnstile_required"
  | "turnstile_failed"
  | "verification_unavailable";

export type TurnstileResult = { ok: true } | { ok: false; error: TurnstileFailure };

// Worker 진입점과 Next 라우트가 같은 방식으로 설정을 읽도록 한곳에 모은다.
export function turnstileConfigFromEnv(source: unknown): TurnstileConfig {
  const record =
    typeof source === "object" && source !== null ? (source as Record<string, unknown>) : {};
  return {
    secretKey:
      typeof record.TURNSTILE_SECRET_KEY === "string" ? record.TURNSTILE_SECRET_KEY : undefined,
    verifyUrl:
      typeof record.TURNSTILE_VERIFY_URL === "string" ? record.TURNSTILE_VERIFY_URL : undefined,
  };
}

export function isWellFormedTurnstileToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_TOKEN_LENGTH;
}

export function statusForTurnstileFailure(error: TurnstileFailure) {
  // 시크릿 미설정과 공급자 장애는 운영 문제이므로 503, 토큰 문제는 403이다.
  return error === "verification_unavailable" ? 503 : 403;
}

export async function verifyTurnstileToken(
  token: unknown,
  config: TurnstileConfig,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  // 시크릿이 없으면 방어가 꺼진 채로 통과시키지 않는다(fail-closed).
  if (!config.secretKey) return { ok: false, error: "verification_unavailable" };
  if (!isWellFormedTurnstileToken(token)) return { ok: false, error: "turnstile_required" };

  const form = new URLSearchParams();
  form.set("secret", config.secretKey);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch(config.verifyUrl ?? DEFAULT_TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: form,
    });
  } catch {
    return { ok: false, error: "verification_unavailable" };
  }

  if (!response.ok) return { ok: false, error: "verification_unavailable" };

  let outcome: unknown;
  try {
    outcome = await response.json();
  } catch {
    return { ok: false, error: "verification_unavailable" };
  }

  const succeeded =
    typeof outcome === "object" &&
    outcome !== null &&
    (outcome as { success?: unknown }).success === true;

  // 공급자가 돌려준 error-codes는 응답으로 전달하지 않는다.
  return succeeded ? { ok: true } : { ok: false, error: "turnstile_failed" };
}
