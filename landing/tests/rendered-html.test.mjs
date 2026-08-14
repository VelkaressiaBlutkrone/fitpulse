import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

const port = 43100 + (process.pid % 400);
const origin = `http://127.0.0.1:${port}`;
let server;
let serverOutput = "";

before(async () => {
  const cli = fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url));
  server = spawn(process.execPath, [cli, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: { ...process.env, WRANGLER_WRITE_LOGS: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`vinext dev failed:\n${serverOutput}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // Server has not bound the port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`vinext dev timed out:\n${serverOutput}`);
});

after(() => {
  server?.kill();
});

function request(path = "/", init) {
  return fetch(`${origin}${path}`, init);
}

test("renders the mobile-first demand validation landing", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="ko"/i);
  assert.match(html, /<title>다음 운동의 숫자를 정하는 코치 \| FitPulse<\/title>/i);
  assert.match(html, /오늘 몇 kg을<br\/>들어야 할지/);
  assert.match(html, /현재 개발 준비 중/);
  assert.match(html, /출시 알림 신청하기/);
  assert.match(html, /name="email"/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /개인정보 수집·이용/);
  assert.match(html, /개발 예정 화면/);
  assert.match(html, /fitpulse-social-card\.png/);
  assert.doesNotMatch(html, /의학적으로 안전|부상을 예방|회복을 보장/);
  await access(new URL("../public/fitpulse-social-card.png", import.meta.url));
});

test("rejects invalid waitlist submissions before persistence", async () => {
  const missingConsent = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "person@example.com",
      consent: false,
      consentVersion: "prevalidation-v1",
    }),
  });
  assert.equal(missingConsent.status, 400);

  const invalidEmail = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "not-an-email",
      consent: true,
      consentVersion: "prevalidation-v1",
    }),
  });
  assert.equal(invalidEmail.status, 400);
});

test("persists a waitlist entry once and keeps the optional survey separate", async () => {
  const payload = {
    email: `test-${Date.now()}@example.com`,
    consent: true,
    consentVersion: "prevalidation-v1",
    channelCode: "automated_test",
    company: "",
  };
  const first = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.match(firstBody.waitlistId, /^[0-9a-f-]{36}$/i);
  assert.equal(firstBody.duplicate, false);

  const duplicate = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(duplicate.status, 200);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.waitlistId, firstBody.waitlistId);
  assert.equal(duplicateBody.duplicate, true);

  const survey = await request("/api/survey", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      waitlistId: firstBody.waitlistId,
      trainingFrequency: "two_three",
      device: "galaxy",
      loggingMethod: "app",
      progressionMethod: "feeling",
      interviewOptIn: true,
    }),
  });
  assert.equal(survey.status, 201);
});

test("keeps personal data out of analytics event properties", async () => {
  const [analytics, form] = await Promise.all([
    readFile(new URL("../app/lib/analytics.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/WaitlistForm.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(analytics, /landing_view/);
  assert.match(analytics, /primary_cta_click/);
  assert.match(analytics, /waitlist_submit/);
  assert.doesNotMatch(analytics, /email|free.?text|health|injury/i);
  assert.doesNotMatch(form, /trackEvent\([^\n]*email/i);
  assert.doesNotMatch(form, /URLSearchParams\([^\n]*email/i);

  const piiEvent = await request("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "waitlist_submit",
      properties: { pageVersion: "landing-v1", email: "person@example.com" },
    }),
  });
  assert.equal(piiEvent.status, 400);
});
