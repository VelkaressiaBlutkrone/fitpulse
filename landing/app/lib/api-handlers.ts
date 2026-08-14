import {
  deleteWaitlistBySession,
  storeClientMetric,
  storeSurvey,
  storeWaitlist,
} from "../../db/landing-storage";
import { parseMetricInput, parseSurveyInput, parseWaitlistInput } from "./input";
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

export async function handleWaitlistPost(request: Request, db: D1Database) {
  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = parseWaitlistInput(body.payload);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const sessionToken = createSessionToken();
  if (parsed.value.bot) return acceptedResponse(request, sessionToken);

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

export function handleApiWrite(request: Request, db: D1Database) {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/events" && request.method === "POST") {
    return handleEventsPost(request, db);
  }
  if (pathname === "/api/survey" && request.method === "POST") {
    return handleSurveyPost(request, db);
  }
  if (pathname === "/api/waitlist" && request.method === "POST") {
    return handleWaitlistPost(request, db);
  }
  if (pathname === "/api/waitlist" && request.method === "DELETE") {
    return handleWaitlistDelete(request, db);
  }
  return Promise.resolve(json({ error: "method_not_allowed" }, 405));
}
