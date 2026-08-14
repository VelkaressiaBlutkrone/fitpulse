import { env } from "cloudflare:workers";
import { handleEventsPost } from "../../lib/api-handlers";

export function POST(request: Request) {
  return handleEventsPost(request, env.DB);
}
