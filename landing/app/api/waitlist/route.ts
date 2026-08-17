import { env } from "cloudflare:workers";
import {
  handleWaitlistDelete,
  handleWaitlistPost,
} from "../../lib/api-handlers";
import { turnstileConfigFromEnv } from "../../lib/turnstile";

export function POST(request: Request) {
  return handleWaitlistPost(request, env.DB, turnstileConfigFromEnv(env));
}

export function DELETE(request: Request) {
  return handleWaitlistDelete(request, env.DB);
}
