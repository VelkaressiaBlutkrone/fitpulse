import { storeSurvey } from "../../../db/landing-storage";
import { parseSurveyInput } from "../../lib/input";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseSurveyInput(payload);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    await storeSurvey(parsed.value);
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.message === "waitlist_not_found" ? 404 : 503;
    return Response.json({ error: status === 404 ? "waitlist_not_found" : "storage_unavailable" }, { status });
  }
}
