export type WaitlistInput = {
  email: string;
  consentVersion: "prevalidation-v1";
  channelCode: string;
  bot: boolean;
};

export type SurveyInput = {
  waitlistId: string;
  trainingFrequency: "four_plus" | "two_three" | "one_less";
  device: "galaxy" | "iphone" | "other";
  loggingMethod: "app" | "notes" | "paper" | "none";
  progressionMethod: "program" | "coach" | "feeling" | "repeat";
  interviewOptIn: boolean;
};

export type MetricInput = {
  name:
    | "landing_view"
    | "primary_cta_click"
    | "waitlist_submit"
    | "survey_complete"
    | "interview_opt_in";
  properties: {
    pageVersion: string;
    channelCode?: string;
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

function channelCode(value: unknown) {
  if (typeof value !== "string" || !/^[a-z0-9_-]{1,40}$/i.test(value)) return "direct";
  return value.toLowerCase();
}

export function parseWaitlistInput(payload: unknown): Result<WaitlistInput> {
  if (!isRecord(payload)) return { ok: false, error: "invalid_payload" };
  if (!hasOnlyKeys(payload, ["email", "consent", "consentVersion", "channelCode", "company"])) {
    return { ok: false, error: "unsupported_field" };
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const validEmail =
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  if (!validEmail) return { ok: false, error: "invalid_email" };
  if (payload.consent !== true) return { ok: false, error: "consent_required" };
  if (payload.consentVersion !== "prevalidation-v1") {
    return { ok: false, error: "invalid_consent_version" };
  }

  return {
    ok: true,
    value: {
      email,
      consentVersion: "prevalidation-v1",
      channelCode: channelCode(payload.channelCode),
      bot: typeof payload.company === "string" && payload.company.trim().length > 0,
    },
  };
}

const frequencies = ["four_plus", "two_three", "one_less"] as const;
const devices = ["galaxy", "iphone", "other"] as const;
const loggingMethods = ["app", "notes", "paper", "none"] as const;
const progressionMethods = ["program", "coach", "feeling", "repeat"] as const;

export function parseSurveyInput(payload: unknown): Result<SurveyInput> {
  if (!isRecord(payload)) return { ok: false, error: "invalid_payload" };
  if (!hasOnlyKeys(payload, ["waitlistId", "trainingFrequency", "device", "loggingMethod", "progressionMethod", "interviewOptIn"])) {
    return { ok: false, error: "unsupported_field" };
  }

  if (typeof payload.waitlistId !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.waitlistId)) {
    return { ok: false, error: "invalid_waitlist_id" };
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

const metricNames = [
  "landing_view",
  "primary_cta_click",
  "waitlist_submit",
  "survey_complete",
  "interview_opt_in",
] as const;

export function parseMetricInput(payload: unknown): Result<MetricInput> {
  if (!isRecord(payload) || !hasOnlyKeys(payload, ["name", "properties"])) {
    return { ok: false, error: "invalid_payload" };
  }
  if (!metricNames.includes(payload.name as MetricInput["name"])) {
    return { ok: false, error: "invalid_event" };
  }
  if (!isRecord(payload.properties)) return { ok: false, error: "invalid_properties" };
  if (!hasOnlyKeys(payload.properties, ["pageVersion", "channelCode", "position"])) {
    return { ok: false, error: "unsupported_property" };
  }
  if (payload.properties.pageVersion !== "landing-v1") {
    return { ok: false, error: "invalid_page_version" };
  }

  const normalized: MetricInput["properties"] = { pageVersion: "landing-v1" };
  if (payload.properties.channelCode !== undefined) {
    if (channelCode(payload.properties.channelCode) !== payload.properties.channelCode) {
      return { ok: false, error: "invalid_channel_code" };
    }
    normalized.channelCode = payload.properties.channelCode;
  }
  if (payload.properties.position !== undefined) {
    if (payload.properties.position !== "header" && payload.properties.position !== "hero") {
      return { ok: false, error: "invalid_position" };
    }
    normalized.position = payload.properties.position;
  }

  return {
    ok: true,
    value: { name: payload.name as MetricInput["name"], properties: normalized },
  };
}
