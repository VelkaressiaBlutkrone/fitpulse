import { storeWaitlist } from "../../../db/landing-storage";
import { parseWaitlistInput } from "../../lib/input";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "json_required" }, { status: 415 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseWaitlistInput(payload);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  if (parsed.value.bot) return Response.json({ accepted: true }, { status: 202 });

  try {
    const result = await storeWaitlist(parsed.value);
    return Response.json(
      { waitlistId: result.id, duplicate: !result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
