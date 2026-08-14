import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { consumeRateLimit, purgeExpiredData } from "../db/landing-storage";
import { handleApiWrite } from "../app/lib/api-handlers";
import {
  createSessionToken,
  readCookie,
  sessionCookie,
  VISITOR_SESSION_COOKIE,
} from "../app/lib/session";

type ImagesBinding = {
  input(stream: ReadableStream): {
    transform(options: Record<string, unknown>): {
      output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
};

type WorkerEnv = Env & {
  ASSETS: Fetcher;
  IMAGES: ImagesBinding;
};

const API_LIMITS: Record<string, number> = {
  "/api/events": 30,
  "/api/survey": 10,
  "/api/waitlist": 5,
};

function jsonError(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function isSameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function discardRequestBody(request: Request) {
  try {
    const reader = request.body?.getReader();
    if (!reader) return;
    while (!(await reader.read()).done) {
      // Drain the stream so the runtime can safely reuse the connection.
    }
  } catch {
    // The body may already be closed by the runtime.
  }
}

function withSecurityHeaders(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  headers.set(
    "content-security-policy",
    "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  );
  headers.set("cross-origin-opener-policy", "same-origin");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("permissions-policy", "camera=(), geolocation=(), microphone=(), payment=()");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");

  if (new URL(request.url).protocol === "https:") {
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }
  if (new URL(request.url).pathname.startsWith("/api/")) {
    headers.set("cache-control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleApplicationRequest(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
) {
  const url = new URL(request.url);

  if (url.pathname === "/_vinext/image") {
    const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
    return handleImageOptimization(request, {
      fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
      transformImage: async (body, { width, format, quality }) => {
        const result = await env.IMAGES
          .input(body)
          .transform(width > 0 ? { width } : {})
          .output({ format, quality });
        return result.response();
      },
    }, allowedWidths);
  }

  const rateLimit = API_LIMITS[url.pathname];
  const isWrite = rateLimit !== undefined && (request.method === "POST" || request.method === "DELETE");
  if (!isWrite) return handler.fetch(request, env, ctx);

  if (!isSameOrigin(request)) {
    await discardRequestBody(request);
    return jsonError("cross_site_request", 403);
  }
  if (
    request.method === "POST" &&
    !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")
  ) {
    await discardRequestBody(request);
    return jsonError("json_required", 415);
  }

  const existingVisitorToken = readCookie(request, VISITOR_SESSION_COOKIE);
  const visitorToken = existingVisitorToken && /^[A-Za-z0-9_-]{43}$/u.test(existingVisitorToken)
    ? existingVisitorToken
    : createSessionToken();

  try {
    const allowed = await consumeRateLimit(env.DB, visitorToken, url.pathname, rateLimit);
    if (!allowed) {
      await discardRequestBody(request);
      return jsonError("rate_limit_exceeded", 429);
    }
  } catch {
    await discardRequestBody(request);
    return jsonError("storage_unavailable", 503);
  }

  const response = await handleApiWrite(request, env.DB);
  if (existingVisitorToken) return response;

  const headers = new Headers(response.headers);
  headers.append(
    "set-cookie",
    sessionCookie(VISITOR_SESSION_COOKIE, visitorToken, request.url),
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    try {
      return withSecurityHeaders(
        request,
        await handleApplicationRequest(request, env, ctx),
      );
    } catch (error) {
      console.error(JSON.stringify({
        message: "unhandled_request_error",
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : "unknown_error",
      }));
      return withSecurityHeaders(request, jsonError("internal_error", 500));
    }
  },

  async scheduled(_controller, env): Promise<void> {
    await purgeExpiredData(env.DB);
  },
} satisfies ExportedHandler<WorkerEnv>;
