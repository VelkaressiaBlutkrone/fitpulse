import { env } from "cloudflare:workers";
import {
  handleWaitlistDelete,
  handleWaitlistPost,
} from "../../lib/api-handlers";
import { turnstileConfigFromEnv } from "../../lib/turnstile";
import { emailConfigFromEnv } from "../../lib/email";

export function POST(request: Request) {
  return handleWaitlistPost(
    request,
    env.DB,
    turnstileConfigFromEnv(env),
    emailConfigFromEnv(env),
  );
}

export function DELETE(request: Request) {
  return handleWaitlistDelete(request, env.DB);
}
