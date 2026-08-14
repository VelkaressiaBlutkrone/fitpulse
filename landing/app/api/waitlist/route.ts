import { env } from "cloudflare:workers";
import {
  handleWaitlistDelete,
  handleWaitlistPost,
} from "../../lib/api-handlers";

export function POST(request: Request) {
  return handleWaitlistPost(request, env.DB);
}

export function DELETE(request: Request) {
  return handleWaitlistDelete(request, env.DB);
}
