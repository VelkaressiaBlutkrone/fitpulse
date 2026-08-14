import { env } from "cloudflare:workers";
import { handleSurveyPost } from "../../lib/api-handlers";

export function POST(request: Request) {
  return handleSurveyPost(request, env.DB);
}
