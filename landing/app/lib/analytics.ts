export const PAGE_VERSION = "landing-v1";

type EventName =
  | "landing_view"
  | "primary_cta_click"
  | "waitlist_submit"
  | "survey_complete"
  | "interview_opt_in";

type EventProperties = {
  pageVersion: string;
  channelCode?: string;
  position?: "header" | "hero";
};

export function trackEvent(name: EventName, properties: EventProperties) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("fitpulse:metric", { detail: { name, properties } }),
  );

  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, properties }),
    keepalive: true,
  }).catch(() => undefined);
}
