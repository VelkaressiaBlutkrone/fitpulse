import { storeMetric } from "../../../db/landing-storage";
import { parseMetricInput } from "../../lib/input";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseMetricInput(payload);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    await storeMetric(parsed.value);
    return Response.json({ accepted: true }, { status: 202 });
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
