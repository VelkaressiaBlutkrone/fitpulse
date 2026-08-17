export const APPROVED_CHANNEL_CODES = [
  "direct",
  "other",
  "docs",
  "github",
  "community",
  "coach",
  "gym",
  "referral",
  "paid_search",
  "paid_social",
] as const;

export type ChannelCode = (typeof APPROVED_CHANNEL_CODES)[number];

export type WaitlistInput = {
  email: string;
  consentVersion: "prevalidation-v3";
  channelCode: ChannelCode;
  bot: boolean;
  // 서버에서만 검증한다. 형식과 유효성 판정은 turnstile 모듈이 담당한다.
  turnstileToken: unknown;
};

export type SurveyInput = {
  trainingFrequency: "four_plus" | "two_three" | "one_less";
  device: "galaxy" | "iphone" | "other";
  loggingMethod: "app" | "notes" | "paper" | "none";
  progressionMethod: "program" | "coach" | "feeling" | "repeat";
  interviewOptIn: boolean;
};

export type ClientMetricInput = {
  name: "landing_view" | "primary_cta_click";
  eventId: string;
  properties: {
    page_version: "landing-v1";
    channel_code?: ChannelCode;
    position?: "header" | "hero";
  };
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function normalizeChannelCode(value: unknown): ChannelCode {
  if (typeof value !== "string") return "direct";
  const normalized = value.trim().toLowerCase();
  return APPROVED_CHANNEL_CODES.includes(normalized as ChannelCode)
    ? (normalized as ChannelCode)
    : "other";
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function parseWaitlistInput(payload: unknown): Result<WaitlistInput> {
  if (!isRecord(payload)) return { ok: false, error: "invalid_payload" };
  if (!hasOnlyKeys(payload, [
    "email",
    "consent",
    "consentVersion",
    "channelCode",
    "company",
    "turnstileToken",
  ])) {
    return { ok: false, error: "unsupported_field" };
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const validEmail =
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  if (!validEmail) return { ok: false, error: "invalid_email" };
  if (payload.consent !== true) return { ok: false, error: "consent_required" };
  if (payload.consentVersion !== "prevalidation-v3") {
    return { ok: false, error: "invalid_consent_version" };
  }

  return {
    ok: true,
    value: {
      email,
      consentVersion: "prevalidation-v3",
      channelCode: normalizeChannelCode(payload.channelCode),
      bot: typeof payload.company === "string" && payload.company.trim().length > 0,
      turnstileToken: payload.turnstileToken,
    },
  };
}

const frequencies = ["four_plus", "two_three", "one_less"] as const;
const devices = ["galaxy", "iphone", "other"] as const;
const loggingMethods = ["app", "notes", "paper", "none"] as const;
const progressionMethods = ["program", "coach", "feeling", "repeat"] as const;

export function parseSurveyInput(payload: unknown): Result<SurveyInput> {
  if (!isRecord(payload)) return { ok: false, error: "invalid_payload" };
  if (!hasOnlyKeys(payload, ["trainingFrequency", "device", "loggingMethod", "progressionMethod", "interviewOptIn"])) {
    return { ok: false, error: "unsupported_field" };
  }

  if (!frequencies.includes(payload.trainingFrequency as SurveyInput["trainingFrequency"])) {
    return { ok: false, error: "invalid_training_frequency" };
  }
  if (!devices.includes(payload.device as SurveyInput["device"])) {
    return { ok: false, error: "invalid_device" };
  }
  if (!loggingMethods.includes(payload.loggingMethod as SurveyInput["loggingMethod"])) {
    return { ok: false, error: "invalid_logging_method" };
  }
  if (!progressionMethods.includes(payload.progressionMethod as SurveyInput["progressionMethod"])) {
    return { ok: false, error: "invalid_progression_method" };
  }
  if (typeof payload.interviewOptIn !== "boolean") {
    return { ok: false, error: "invalid_interview_opt_in" };
  }

  return { ok: true, value: payload as SurveyInput };
}

export function parseMetricInput(payload: unknown): Result<ClientMetricInput> {
  if (!isRecord(payload) || !hasOnlyKeys(payload, ["name", "event_id", "properties"])) {
    return { ok: false, error: "invalid_payload" };
  }
  if (payload.name !== "landing_view" && payload.name !== "primary_cta_click") {
    return { ok: false, error: "invalid_event" };
  }
  if (!isUuid(payload.event_id)) return { ok: false, error: "invalid_event_id" };
  if (!isRecord(payload.properties)) return { ok: false, error: "invalid_properties" };
  if (payload.properties.page_version !== "landing-v1") {
    return { ok: false, error: "invalid_page_version" };
  }

  const allowedProperties = payload.name === "landing_view"
    ? ["page_version", "channel_code"]
    : ["page_version", "channel_code", "position"];
  if (!hasOnlyKeys(payload.properties, allowedProperties)) {
    return { ok: false, error: "unsupported_property" };
  }

  const normalized: ClientMetricInput["properties"] = { page_version: "landing-v1" };
  if (payload.properties.channel_code !== undefined) {
    const channel = normalizeChannelCode(payload.properties.channel_code);
    if (channel !== payload.properties.channel_code) {
      return { ok: false, error: "invalid_channel_code" };
    }
    normalized.channel_code = channel;
  }

  if (payload.name === "primary_cta_click") {
    if (payload.properties.position !== "header" && payload.properties.position !== "hero") {
      return { ok: false, error: "invalid_position" };
    }
    normalized.position = payload.properties.position;
  }

  return {
    ok: true,
    value: {
      name: payload.name,
      eventId: payload.event_id,
      properties: normalized,
    },
  };
}
