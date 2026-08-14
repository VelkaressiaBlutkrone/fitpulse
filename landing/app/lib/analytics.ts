import type { ChannelCode } from "./input";

export const PAGE_VERSION = "landing-v1" as const;

type EventName = "landing_view" | "primary_cta_click";

type EventProperties = {
  page_version: typeof PAGE_VERSION;
  channel_code?: ChannelCode;
  position?: "header" | "hero";
};

export function landingViewEventId() {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = `fitpulse:landing_view:${PAGE_VERSION}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export function trackEvent(
  name: EventName,
  properties: EventProperties,
  eventId = crypto.randomUUID(),
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("fitpulse:metric", { detail: { name, properties, eventId } }),
  );

  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, event_id: eventId, properties }),
    credentials: "same-origin",
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) throw new Error(`metric_${response.status}`);
    })
    .catch(() => {
      window.dispatchEvent(new CustomEvent("fitpulse:metric-error", { detail: { name } }));
    });
}
