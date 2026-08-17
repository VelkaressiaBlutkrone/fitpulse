import {
  deleteWaitlistBySession,
  runRetentionPurge,
  storeClientMetric,
  storeSurvey,
  storeWaitlist,
} from "../../db/landing-storage";
import { parseMetricInput, parseSurveyInput, parseWaitlistInput } from "./input";
import {
  statusForTurnstileFailure,
  verifyTurnstileToken,
  type TurnstileConfig,
} from "./turnstile";
import {
  clearSessionCookie,
  createSessionToken,
  readCookie,
  sessionCookie,
  WAITLIST_SESSION_COOKIE,
} from "./session";

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function acceptedResponse(request: Request, token?: string) {
  const response = json({ accepted: true }, 202);
  if (token) {
    response.headers.append(
      "set-cookie",
      sessionCookie(WAITLIST_SESSION_COOKIE, token, request.url),
    );
  }
  return response;
}

async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false as const, response: json({ error: "json_required" }, 415) };
  }

  try {
    return { ok: true as const, payload: await request.json() as unknown };
  } catch {
    return { ok: false as const, response: json({ error: "invalid_json" }, 400) };
  }
}

export async function handleWaitlistPost(
  request: Request,
  db: D1Database,
  turnstile: TurnstileConfig,
) {
  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = parseWaitlistInput(body.payload);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const sessionToken = createSessionToken();
  // 허니팟에 걸린 요청은 조용히 수용한 척하고 저장하지 않는다.
  // siteverify 호출도 아껴 봇이 검증 한도를 소모하지 못하게 한다.
  if (parsed.value.bot) return acceptedResponse(request, sessionToken);

  const verification = await verifyTurnstileToken(
    parsed.value.turnstileToken,
    turnstile,
    request.headers.get("cf-connecting-ip"),
  );
  if (!verification.ok) {
    return json({ error: verification.error }, statusForTurnstileFailure(verification.error));
  }

  try {
    await storeWaitlist(db, parsed.value, sessionToken);
    return acceptedResponse(request, sessionToken);
  } catch {
    return json({ error: "storage_unavailable" }, 503);
  }
}

export async function handleWaitlistDelete(request: Request, db: D1Database) {
  const sessionToken = readCookie(request, WAITLIST_SESSION_COOKIE);

  try {
    if (sessionToken) await deleteWaitlistBySession(db, sessionToken);
  } catch {
    return json({ error: "storage_unavailable" }, 503);
  }

  const response = acceptedResponse(request);
  response.headers.append(
    "set-cookie",
    clearSessionCookie(WAITLIST_SESSION_COOKIE, request.url),
  );
  return response;
}

export async function handleSurveyPost(request: Request, db: D1Database) {
  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = parseSurveyInput(body.payload);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const sessionToken = readCookie(request, WAITLIST_SESSION_COOKIE);
  try {
    if (sessionToken) await storeSurvey(db, parsed.value, sessionToken);
    return acceptedResponse(request);
  } catch {
    return json({ error: "storage_unavailable" }, 503);
  }
}

export async function handleEventsPost(request: Request, db: D1Database) {
  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = parseMetricInput(body.payload);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    await storeClientMetric(db, parsed.value);
    return acceptedResponse(request);
  } catch {
    return json({ error: "storage_unavailable" }, 503);
  }
}

/**
 * 외부 스케줄러가 호출하는 보존 정리 트리거.
 *
 * 배포 플랫폼이 예약 작업을 지원하지 않아 필요하다. 토큰은 Authorization
 * 헤더로만 받는다. 질의 문자열로 받으면 접근 로그와 Referer에 남는다.
 * TASK-0001 / WF-09 참조.
 */
export async function handleMaintenancePurge(
  request: Request,
  db: D1Database,
  maintenanceToken?: string,
) {
  const provided = request.headers.get("authorization");
  const expected = maintenanceToken ? `Bearer ${maintenanceToken}` : undefined;

  // 토큰이 설정되지 않은 환경에서는 트리거를 열어두지 않는다.
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    await runRetentionPurge(db, { force: true });
    return json({ accepted: true }, 202);
  } catch {
    return json({ error: "storage_unavailable" }, 503);
  }
}

export function handleApiWrite(
  request: Request,
  db: D1Database,
  turnstile: TurnstileConfig,
) {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/events" && request.method === "POST") {
    return handleEventsPost(request, db);
  }
  if (pathname === "/api/survey" && request.method === "POST") {
    return handleSurveyPost(request, db);
  }
  if (pathname === "/api/waitlist" && request.method === "POST") {
    return handleWaitlistPost(request, db, turnstile);
  }
  if (pathname === "/api/waitlist" && request.method === "DELETE") {
    return handleWaitlistDelete(request, db);
  }
  return Promise.resolve(json({ error: "method_not_allowed" }, 405));
}
