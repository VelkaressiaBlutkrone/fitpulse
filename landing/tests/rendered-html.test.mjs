import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test, { after, before } from "node:test";

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const wranglerCli = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const wranglerConfig = fileURLToPath(new URL("../dist/server/wrangler.json", import.meta.url));
const port = 43100 + (process.pid % 400);
const origin = `http://127.0.0.1:${port}`;

// Turnstile siteverify는 로컬 스텁으로 대체한다. WF-02 설계 결정 1에 따라
// 검증 엔드포인트를 환경변수로 주입해 테스트가 외부 네트워크에 의존하지 않게 한다.
const turnstileStubPort = port + 500;
const turnstileVerifyUrl = `http://127.0.0.1:${turnstileStubPort}/siteverify`;
const TEST_TURNSTILE_SECRET = "test-turnstile-secret";
const VALID_TURNSTILE_TOKEN = "valid-turnstile-token";
const EXPIRED_TURNSTILE_TOKEN = "expired-turnstile-token";

// 배포 플랫폼이 cron을 지원하지 않으므로 외부 스케줄러가 호출하는
// 정리 엔드포인트를 인증한다. TASK-0001 / WF-09 참조.
const TEST_MAINTENANCE_TOKEN = "test-maintenance-token";

// 확인 메일 발송 어댑터를 로컬 스텁으로 대체한다. 실제 SES 연동은 AWS
// 프로덕션 액세스 승인 후에 채운다. TASK-0001 / WF-03 참조.
const emailStubPort = port + 700;
const emailSendUrl = `http://127.0.0.1:${emailStubPort}/send`;
let emailStub;
let sentEmails = [];
let emailStubShouldFail = false;

function startEmailStub() {
  emailStub = createServer((incoming, response) => {
    let body = "";
    incoming.on("data", (chunk) => { body += chunk; });
    incoming.on("end", () => {
      if (emailStubShouldFail) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "provider_unavailable" }));
        return;
      }
      try {
        sentEmails.push(JSON.parse(body));
      } catch {
        sentEmails.push({ parseError: body });
      }
      response.writeHead(202, { "content-type": "application/json" });
      response.end(JSON.stringify({ accepted: true }));
    });
  });
  return new Promise((resolve) => emailStub.listen(emailStubPort, "127.0.0.1", resolve));
}

function stopEmailStub() {
  if (!emailStub) return Promise.resolve();
  return new Promise((resolve) => emailStub.close(resolve));
}

function confirmationLinkFrom(mail) {
  const target = mail?.confirmationUrl ?? "";
  return typeof target === "string" ? target : "";
}

let persistenceDirectory;
let server;
let serverOutput = "";
let registeredEmail = "";
let deduplicatedClientEventId = "";
let turnstileStub;
let turnstileStubCalls = [];

function startTurnstileStub() {
  turnstileStub = createServer((incoming, response) => {
    let body = "";
    incoming.on("data", (chunk) => { body += chunk; });
    incoming.on("end", () => {
      const params = new URLSearchParams(body);
      const token = params.get("response");
      turnstileStubCalls.push({ secret: params.get("secret"), token });

      const success =
        params.get("secret") === TEST_TURNSTILE_SECRET && token === VALID_TURNSTILE_TOKEN;
      const errorCode =
        token === EXPIRED_TURNSTILE_TOKEN ? "timeout-or-duplicate" : "invalid-input-response";

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(
        success
          ? { success: true, challenge_ts: new Date().toISOString(), hostname: "127.0.0.1" }
          : { success: false, "error-codes": [errorCode] },
      ));
    });
  });
  return new Promise((resolve) => turnstileStub.listen(turnstileStubPort, "127.0.0.1", resolve));
}

function stopTurnstileStub() {
  if (!turnstileStub) return Promise.resolve();
  return new Promise((resolve) => turnstileStub.close(resolve));
}

function waitlistPayload(overrides = {}) {
  return {
    email: `test-${Date.now()}@example.com`,
    consent: true,
    consentVersion: "prevalidation-v3",
    channelCode: "direct",
    company: "",
    turnstileToken: VALID_TURNSTILE_TOKEN,
    ...overrides,
  };
}

async function wrangler(...args) {
  return execFileAsync(process.execPath, [wranglerCli, ...args], {
    cwd: projectRoot,
    env: { ...process.env, WRANGLER_WRITE_LOGS: "false" },
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function startServer() {
  serverOutput = "";
  server = spawn(process.execPath, [
    wranglerCli,
    "dev",
    "--config",
    wranglerConfig,
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--persist-to",
    persistenceDirectory,
    "--show-interactive-dev-session=false",
    "--var",
    `TURNSTILE_SECRET_KEY:${TEST_TURNSTILE_SECRET}`,
    "--var",
    `TURNSTILE_VERIFY_URL:${turnstileVerifyUrl}`,
    "--var",
    `MAINTENANCE_TOKEN:${TEST_MAINTENANCE_TOKEN}`,
    "--var",
    `EMAIL_SEND_URL:${emailSendUrl}`,
    "--log-level",
    "warn",
  ], {
    cwd: projectRoot,
    env: { ...process.env, WRANGLER_WRITE_LOGS: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`wrangler dev failed:\n${serverOutput}`);
    try {
      const response = await fetch(origin);
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // The production Worker has not bound the port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`wrangler dev timed out:\n${serverOutput}`);
}

before(async () => {
  await startTurnstileStub();
  await startEmailStub();
  persistenceDirectory = await mkdtemp(join(tmpdir(), "fitpulse-worker-test-"));
  await wrangler(
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    wranglerConfig,
    "--persist-to",
    persistenceDirectory,
  );
  await startServer();
});

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill();
  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

after(async () => {
  await stopServer();
  await stopTurnstileStub();
  await stopEmailStub();
  if (persistenceDirectory) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await rm(persistenceDirectory, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 4) throw error;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }
});

function request(path = "/", init) {
  return fetch(`${origin}${path}`, init);
}

function cookieFrom(response, name) {
  const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
  const values = getSetCookie ? getSetCookie() : [response.headers.get("set-cookie") ?? ""];
  for (const value of values) {
    const match = value.match(new RegExp(`(?:^|[,;]\\s*)${name}=([^;,]+)`));
    if (match) return `${name}=${match[1]}`;
  }
  return "";
}

async function queryDatabase(sql) {
  const { stdout } = await wrangler(
    "d1",
    "execute",
    "DB",
    "--local",
    "--config",
    wranglerConfig,
    "--persist-to",
    persistenceDirectory,
    "--command",
    sql,
    "--json",
  );
  const parsed = JSON.parse(stdout);
  return parsed[0]?.results ?? [];
}

test("renders the secured mobile-first demand validation landing", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);

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
  assert.match(html, /https:\/\/fitpulse-validation\.velkaressia\.chatgpt\.site\/fitpulse-social-card\.png/);
  assert.doesNotMatch(html, /의학적으로 안전|부상을 예방|회복을 보장/);
});

test("publishes the versioned privacy notice with deletion and log disclosure", async () => {
  const response = await request("/privacy");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /prevalidation-v3/);
  assert.match(html, /mailto:info@leva\.ai\.kr/);
  assert.match(html, /IP 주소/);
  assert.match(html, /등록 취소 및 데이터 삭제/);

  // 수탁자를 빠짐없이 밝힌다. WF-01·WF-02·WF-07에서 확인한 사실이다.
  assert.match(html, /OpenAI/);
  assert.match(html, /재위탁/);
  assert.match(html, /Cloudflare/);
  assert.match(html, /Amazon Web Services/);
  assert.match(html, /보안·안전 분류기/);

  // 불리한 사실을 감추지 않는다.
  assert.match(html, /저장 국가를 특정해 알려드릴 수 없습니다/);
  assert.match(html, /최대 30일 남을 수 있으며/);
  assert.match(html, /예약 작업\(cron\)을 지원하지 않아/);
  assert.match(html, /소유자 전용 검증 상태/);

  // 보유 기간이 landing-storage.ts 상수와 일치해야 한다.
  assert.match(html, /확인되지 않은 이메일은 14일/);
  assert.match(html, /최대 365일/);
  assert.match(html, /요청 제한 기록은 1시간/);

  // 실제보다 넓은 수집·활용을 허용하는 문구가 없어야 한다.
  assert.doesNotMatch(html, /마케팅 활용|제3자 제공|광고 목적/);
});

test("keeps the privacy notice aligned with retention constants in code", async () => {
  const [notice, storage] = await Promise.all([
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/landing-storage.ts", import.meta.url), "utf8"),
  ]);

  const pendingDays = storage.match(/PENDING_RETENTION_DAYS\s*=\s*(\d+)/)?.[1];
  const dataDays = storage.match(/DATA_RETENTION_DAYS\s*=\s*(\d+)/)?.[1];
  assert.ok(pendingDays && dataDays, "보존 상수를 읽어야 한다");

  assert.ok(
    notice.includes(`${pendingDays}일`),
    `안내가 미확인 보존 ${pendingDays}일을 명시해야 한다`,
  );
  assert.ok(
    notice.includes(`${dataDays}일`),
    `안내가 일반 보존 ${dataDays}일을 명시해야 한다`,
  );

  // 확인 토큰 만료도 미확인 보존 기간과 같아야 한다.
  assert.match(storage, new RegExp(`isoAfter\\(now, PENDING_RETENTION_DAYS\\)`));
});

test("rejects invalid and cross-site write requests before persistence", async () => {
  const missingConsent = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "person@example.com",
      consent: false,
      consentVersion: "prevalidation-v3",
    }),
  });
  assert.equal(missingConsent.status, 400);
  const invalidVisitorCookie = cookieFrom(missingConsent, "fitpulse_visitor");
  await missingConsent.json();

  const invalidEmail = await request("/api/waitlist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: invalidVisitorCookie,
    },
    body: JSON.stringify({
      email: "not-an-email",
      consent: true,
      consentVersion: "prevalidation-v3",
    }),
  });
  assert.equal(invalidEmail.status, 400);
  await invalidEmail.json();

  const crossSite = await request("/api/events", {
    method: "POST",
    headers: {
      "content-type": "text/plain",
      origin: "https://attacker.example",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({
      name: "landing_view",
      event_id: crypto.randomUUID(),
      properties: { page_version: "landing-v1", channel_code: "direct" },
    }),
  });
  assert.equal(crossSite.status, 403);
  await crossSite.json();
});

test("keeps duplicate registration private and authorizes survey and deletion by session", async () => {
  const email = `test-${Date.now()}@example.com`;
  registeredEmail = email;
  const payload = waitlistPayload({ email });
  const first = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(first.status, 202, `${await first.clone().text()}\n${serverOutput}`);
  const firstBody = await first.json();
  assert.deepEqual(firstBody, { accepted: true });
  assert.doesNotMatch(JSON.stringify(firstBody), /waitlistId|duplicate/i);
  const firstCookie = cookieFrom(first, "fitpulse_waitlist_session");
  assert.match(firstCookie, /^fitpulse_waitlist_session=/);
  assert.match(first.headers.get("set-cookie") ?? "", /HttpOnly/i);
  assert.match(first.headers.get("set-cookie") ?? "", /SameSite=Strict/i);

  const duplicate = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(duplicate.status, 202);
  assert.deepEqual(await duplicate.json(), firstBody);

  const survey = await request("/api/survey", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: firstCookie },
    body: JSON.stringify({
      trainingFrequency: "two_three",
      device: "galaxy",
      loggingMethod: "app",
      progressionMethod: "feeling",
      interviewOptIn: true,
    }),
  });
  assert.equal(survey.status, 202);
  assert.deepEqual(await survey.json(), { accepted: true });

  const deletion = await request("/api/waitlist", {
    method: "DELETE",
    headers: { cookie: firstCookie },
  });
  assert.equal(deletion.status, 202);
  assert.deepEqual(await deletion.json(), { accepted: true });

});

test("rejects waitlist registration without a server-verified abuse defense token", async () => {
  turnstileStubCalls = [];

  const missingToken = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(waitlistPayload({ turnstileToken: undefined })),
  });
  assert.equal(missingToken.status, 403, `${await missingToken.clone().text()}\n${serverOutput}`);
  const missingCookie = cookieFrom(missingToken, "fitpulse_visitor");
  const missingBody = await missingToken.json();
  assert.deepEqual(missingBody, { error: "turnstile_required" });
  assert.equal(
    turnstileStubCalls.length,
    0,
    "토큰이 없으면 siteverify를 호출하지 않아야 한다",
  );

  const forgedToken = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: missingCookie },
    body: JSON.stringify(waitlistPayload({ turnstileToken: "forged-token" })),
  });
  assert.equal(forgedToken.status, 403, `${await forgedToken.clone().text()}\n${serverOutput}`);
  assert.deepEqual(await forgedToken.json(), { error: "turnstile_failed" });

  const expiredToken = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: missingCookie },
    body: JSON.stringify(waitlistPayload({ turnstileToken: EXPIRED_TURNSTILE_TOKEN })),
  });
  assert.equal(expiredToken.status, 403);
  const expiredBody = await expiredToken.json();
  assert.deepEqual(expiredBody, { error: "turnstile_failed" });

  // Cloudflare가 반환한 error-codes 원문을 그대로 노출하지 않는다.
  assert.doesNotMatch(JSON.stringify(expiredBody), /timeout-or-duplicate|error-codes/);

  // 서버가 실제로 시크릿을 실어 siteverify를 호출했는지 확인한다.
  assert.equal(turnstileStubCalls.length, 2);
  assert.ok(turnstileStubCalls.every((call) => call.secret === TEST_TURNSTILE_SECRET));
  assert.deepEqual(
    turnstileStubCalls.map((call) => call.token),
    ["forged-token", EXPIRED_TURNSTILE_TOKEN],
  );
});

test("accepts registration when the abuse defense token verifies server-side", async () => {
  turnstileStubCalls = [];
  const accepted = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(waitlistPayload({ email: `verified-${Date.now()}@example.com` })),
  });
  assert.equal(accepted.status, 202, `${await accepted.clone().text()}\n${serverOutput}`);
  assert.deepEqual(await accepted.json(), { accepted: true });
  assert.equal(turnstileStubCalls.length, 1);
  assert.equal(turnstileStubCalls[0].token, VALID_TURNSTILE_TOKEN);
});

test("keeps the honeypot silent without spending a siteverify call", async () => {
  turnstileStubCalls = [];
  const honeypot = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(waitlistPayload({
      email: `bot-${Date.now()}@example.com`,
      company: "Acme Corp",
    })),
  });
  assert.equal(honeypot.status, 202);
  assert.deepEqual(await honeypot.json(), { accepted: true });
  assert.equal(
    turnstileStubCalls.length,
    0,
    "허니팟에 걸린 요청은 siteverify를 호출하지 않아야 한다",
  );
});

test("deduplicates client metrics and rejects client-authored conversions or PII", async () => {
  const eventId = crypto.randomUUID();
  deduplicatedClientEventId = eventId;
  const validEvent = {
    name: "landing_view",
    event_id: eventId,
    properties: { page_version: "landing-v1", channel_code: "direct" },
  };
  const first = await request("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validEvent),
  });
  assert.equal(first.status, 202);
  assert.deepEqual(await first.json(), { accepted: true });
  const visitorCookie = cookieFrom(first, "fitpulse_visitor");

  const duplicate = await request("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: visitorCookie },
    body: JSON.stringify(validEvent),
  });
  assert.equal(duplicate.status, 202, `${await duplicate.clone().text()}\n${serverOutput}`);
  assert.deepEqual(await duplicate.json(), { accepted: true });

  const conversion = await request("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: visitorCookie },
    body: JSON.stringify({
      name: "waitlist_submit",
      event_id: crypto.randomUUID(),
      properties: { page_version: "landing-v1" },
    }),
  });
  assert.equal(conversion.status, 400);
  await conversion.json();

  const piiEvent = await request("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: visitorCookie },
    body: JSON.stringify({
      name: "landing_view",
      event_id: crypto.randomUUID(),
      properties: {
        page_version: "landing-v1",
        channel_code: "direct",
        email: "person@example.com",
      },
    }),
  });
  assert.equal(piiEvent.status, 400);
  await piiEvent.json();

});

test("enforces a per-session write limit", async () => {
  let visitorCookie = "";
  let lastStatus = 0;
  for (let index = 0; index < 31; index += 1) {
    const response = await request("/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(visitorCookie ? { cookie: visitorCookie } : {}),
      },
      body: JSON.stringify({
        name: "landing_view",
        event_id: crypto.randomUUID(),
        properties: { page_version: "landing-v1", channel_code: "direct" },
      }),
    });
    visitorCookie ||= cookieFrom(response, "fitpulse_visitor");
    lastStatus = response.status;
    await response.json();
  }
  assert.equal(lastStatus, 429);
});

test("uses native form validation and exposes accessible server errors", async () => {
  const [analytics, form] = await Promise.all([
    readFile(new URL("../app/lib/analytics.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/WaitlistForm.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(analytics, /waitlist_submit|survey_complete|interview_opt_in/);
  assert.doesNotMatch(analytics, /email|free.?text|health|injury/i);
  assert.doesNotMatch(form, /<form[^>]+noValidate/);
  assert.match(form, /aria-invalid/);
  assert.match(form, /aria-describedby/);
  assert.match(form, /role=.*alert/);
  assert.match(form, /checked=\{interviewOptIn\}/);
  assert.match(form, /setInterviewOptIn\(event\.currentTarget\.checked\)/);
  assert.doesNotMatch(form, /interviewOptIn:\s*form\.get/);
  assert.match(form, /consentVersion:\s*"prevalidation-v3"/);
  assert.doesNotMatch(form, /trackEvent\([^\n]*email/i);
  assert.doesNotMatch(form, /URLSearchParams\([^\n]*email/i);

  // 폼이 서버가 검증하는 토큰을 실제로 전달하는지 확인한다.
  assert.match(form, /turnstileToken:\s*String\(form\.get\("cf-turnstile-response"\)/);
  assert.match(form, /className="cf-turnstile"/);
  assert.match(form, /data-sitekey=\{turnstileSiteKey\}/);
  // 403(사람 확인 실패)은 일반 오류와 구분해 안내하고 위젯을 초기화한다.
  assert.match(form, /response\?\.status === 403/);
  assert.match(form, /window\.turnstile\?\.reset\(\)/);
  // 시크릿 키가 클라이언트 번들에 들어가지 않는다.
  assert.doesNotMatch(form, /TURNSTILE_SECRET/);
});

test("sends a confirmation link and verifies the entry exactly once", async () => {
  sentEmails = [];
  const email = `confirm-${Date.now()}@example.com`;
  const register = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(waitlistPayload({ email })),
  });
  assert.equal(register.status, 202, `${await register.clone().text()}\n${serverOutput}`);
  await register.json();

  assert.equal(sentEmails.length, 1, "확인 메일이 한 번 발송되어야 한다");
  const mail = sentEmails[0];
  assert.equal(mail.to, email);

  const link = confirmationLinkFrom(mail);
  assert.match(link, /\/api\/waitlist\/confirm\?token=/);

  const confirmPath = link.slice(link.indexOf("/api/"));
  const confirmed = await request(confirmPath, { method: "GET", redirect: "manual" });
  assert.equal(confirmed.status, 302, `${await confirmed.clone().text()}\n${serverOutput}`);
  // 토큰이 최종 주소에 남지 않아야 브라우저 이력과 Referer로 새지 않는다.
  const location = confirmed.headers.get("location") ?? "";
  assert.doesNotMatch(location, /token=/);
  await confirmed.arrayBuffer();

  // 같은 링크를 다시 열면 소비된 토큰이므로 확인 성공으로 처리하지 않는다.
  const reused = await request(confirmPath, { method: "GET", redirect: "manual" });
  assert.equal(reused.status, 302);
  assert.match(reused.headers.get("location") ?? "", /\/confirm\?status=invalid/);
  await reused.arrayBuffer();

  const rows = await queryDatabase(
    `SELECT verified_at IS NOT NULL AS verified, confirmation_token_hash IS NULL AS token_cleared
     FROM waitlist_entries WHERE email = '${email}'`,
  );
  assert.deepEqual(rows, [{ verified: 1, token_cleared: 1 }]);

  const events = await queryDatabase(
    "SELECT count(*) AS count FROM landing_events WHERE event_name = 'waitlist_confirm'",
  );
  assert.deepEqual(events, [{ count: 1 }], "확인 이벤트는 한 번만 기록되어야 한다");
});

test("rejects forged confirmation tokens", async () => {
  const forged = await request("/api/waitlist/confirm?token=not-a-real-token", {
    method: "GET",
    redirect: "manual",
  });
  assert.equal(forged.status, 302);
  assert.match(forged.headers.get("location") ?? "", /\/confirm\?status=invalid/);
  await forged.arrayBuffer();

  const missing = await request("/api/waitlist/confirm", { method: "GET", redirect: "manual" });
  assert.equal(missing.status, 302);
  assert.match(missing.headers.get("location") ?? "", /\/confirm\?status=invalid/);
  await missing.arrayBuffer();
});

test("keeps registration successful and private when sending fails", async () => {
  sentEmails = [];
  emailStubShouldFail = true;
  const email = `sendfail-${Date.now()}@example.com`;
  const register = await request("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(waitlistPayload({ email })),
  });
  emailStubShouldFail = false;

  // 발송 실패가 등록을 막지 않는다. 미확인으로 남고 14일 뒤 삭제된다.
  assert.equal(register.status, 202, `${await register.clone().text()}\n${serverOutput}`);
  const body = await register.json();
  assert.deepEqual(body, { accepted: true });
  assert.doesNotMatch(JSON.stringify(body), /mail|send|smtp|provider/i);
});

test("excludes unverified entries from the waitlist count", async () => {
  const counts = await queryDatabase(
    `SELECT
      (SELECT count(*) FROM waitlist_entries WHERE verified_at IS NOT NULL) AS verified,
      (SELECT count(*) FROM waitlist_entries WHERE verified_at IS NULL) AS unverified`,
  );
  assert.ok(counts[0].verified >= 1, "확인된 항목이 있어야 한다");
  assert.ok(counts[0].unverified >= 1, "미확인 항목이 있어야 비교가 성립한다");

  const summary = await request("/api/waitlist/summary", { method: "GET" });
  assert.equal(summary.status, 200, `${await summary.clone().text()}\n${serverOutput}`);
  const payload = await summary.json();
  assert.equal(
    payload.verified,
    counts[0].verified,
    "집계는 확인된 항목만 센다",
  );
  // 집계 응답이 이메일이나 내부 ID를 노출하지 않는다.
  assert.doesNotMatch(JSON.stringify(payload), /@|token|id/i);
});

test("keeps confirmation tokens out of stored events", async () => {
  const leaks = await queryDatabase(
    `SELECT count(*) AS count FROM landing_events
     WHERE properties_json LIKE '%token%' OR event_key LIKE '%token%'`,
  );
  assert.deepEqual(leaks, [{ count: 0 }]);
});

test("rejects unauthenticated retention purge triggers", async () => {
  const noToken = await request("/api/maintenance/purge", { method: "POST" });
  assert.equal(noToken.status, 401, `${await noToken.clone().text()}\n${serverOutput}`);
  assert.deepEqual(await noToken.json(), { error: "unauthorized" });

  const wrongToken = await request("/api/maintenance/purge", {
    method: "POST",
    headers: { authorization: "Bearer not-the-token" },
  });
  assert.equal(wrongToken.status, 401);
  assert.deepEqual(await wrongToken.json(), { error: "unauthorized" });

  // 토큰을 질의 문자열로 받지 않는다. 로그·Referer 유출 경로를 만들지 않기 위함이다.
  const queryToken = await request(
    `/api/maintenance/purge?token=${TEST_MAINTENANCE_TOKEN}`,
    { method: "POST" },
  );
  assert.equal(queryToken.status, 401);
  await queryToken.json();
});

test("purges expired data when an authenticated trigger runs", async () => {
  const stale = "2020-01-01T00:00:00.000Z";
  await queryDatabase(`
    INSERT INTO waitlist_entries
      (id, email, consent_version, consented_at, verified_at, channel_code, management_token_hash, created_at)
      VALUES ('wf09-expired', 'wf09-expired@example.com', 'prevalidation-v2', '${stale}', NULL, 'direct', 'wf09-expired-token', '${stale}');
    INSERT INTO landing_events (id, event_name, event_key, properties_json, created_at)
      VALUES ('wf09-expired-event', 'landing_view', 'wf09:expired', '{}', '${stale}');
  `);

  const purge = await request("/api/maintenance/purge", {
    method: "POST",
    headers: { authorization: `Bearer ${TEST_MAINTENANCE_TOKEN}` },
  });
  assert.equal(purge.status, 202, `${await purge.clone().text()}\n${serverOutput}`);
  assert.deepEqual(await purge.json(), { accepted: true });

  const remaining = await queryDatabase(`SELECT
    (SELECT count(*) FROM waitlist_entries WHERE id = 'wf09-expired') AS expired_waitlist,
    (SELECT count(*) FROM landing_events WHERE id = 'wf09-expired-event') AS expired_event`);
  assert.deepEqual(remaining, [{ expired_waitlist: 0, expired_event: 0 }]);
});

test("records purge runs so request-time cleanup does not repeat every write", async () => {
  const runs = await queryDatabase(
    "SELECT name, last_run_at FROM maintenance_runs WHERE name = 'retention_purge'",
  );
  assert.equal(runs.length, 1, "정리 실행 시각이 기록되어야 한다");
  assert.ok(
    typeof runs[0].last_run_at === "number" && runs[0].last_run_at > 0,
    "last_run_at이 기록되어야 한다",
  );
});

test("scopes the abuse defense origin in the content security policy", async () => {
  const response = await request();
  const policy = response.headers.get("content-security-policy") ?? "";
  await response.arrayBuffer();

  assert.match(policy, /script-src [^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(policy, /frame-src https:\/\/challenges\.cloudflare\.com/);
  // 방어 출처를 허용해도 나머지 지시문은 좁게 유지한다.
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /connect-src 'self'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
});

test("persists only authoritative, deduplicated rows and enforces the survey foreign key", async () => {
  await stopServer();

  const metricRows = await queryDatabase(
    "SELECT event_name, count(*) AS count FROM landing_events WHERE event_name IN ('waitlist_submit','waitlist_confirm','survey_complete','interview_opt_in') GROUP BY event_name ORDER BY event_name",
  );
  // waitlist_submit 4건 = 세션별 등록 1 + Turnstile 통과 1 + 확인 흐름 1 + 발송 실패 1.
  // 허니팟 요청은 저장되지 않으므로 집계에 포함되지 않는다.
  // waitlist_confirm은 확인 흐름 테스트에서 1건만 기록된다.
  assert.deepEqual(metricRows, [
    { event_name: "interview_opt_in", count: 1 },
    { event_name: "survey_complete", count: 1 },
    { event_name: "waitlist_confirm", count: 1 },
    { event_name: "waitlist_submit", count: 4 },
  ]);

  const remaining = await queryDatabase(
    `SELECT
      (SELECT count(*) FROM waitlist_entries WHERE email = '${registeredEmail.replaceAll("'", "''")}') AS waitlist_count,
      (SELECT count(*) FROM survey_responses) AS survey_count`,
  );
  assert.deepEqual(remaining, [{ waitlist_count: 0, survey_count: 0 }]);

  const clientRows = await queryDatabase(
    `SELECT count(*) AS count FROM landing_events WHERE event_key = 'client:${deduplicatedClientEventId}'`,
  );
  assert.deepEqual(clientRows, [{ count: 1 }]);

  // 남용 방어 토큰이 어떤 저장 행에도 남지 않아야 한다.
  const tokenLeak = await queryDatabase(`SELECT
    (SELECT count(*) FROM landing_events
      WHERE properties_json LIKE '%turnstile%'
         OR properties_json LIKE '%${VALID_TURNSTILE_TOKEN}%'
         OR event_key LIKE '%${VALID_TURNSTILE_TOKEN}%') AS event_leaks,
    (SELECT count(*) FROM waitlist_entries
      WHERE management_token_hash LIKE '%${VALID_TURNSTILE_TOKEN}%'
         OR channel_code LIKE '%${VALID_TURNSTILE_TOKEN}%') AS waitlist_leaks`);
  assert.deepEqual(tokenLeak, [{ event_leaks: 0, waitlist_leaks: 0 }]);

  // 허니팟에 걸린 요청은 저장되지 않는다.
  const honeypotRows = await queryDatabase(
    "SELECT count(*) AS count FROM waitlist_entries WHERE email LIKE 'bot-%@example.com'",
  );
  assert.deepEqual(honeypotRows, [{ count: 0 }]);

  const foreignKeys = await queryDatabase("PRAGMA foreign_key_list('survey_responses')");
  assert.ok(foreignKeys.some((row) =>
    row.table === "waitlist_entries" && row.from === "waitlist_id" && row.on_delete === "CASCADE"
  ));

  const currentTimestamp = new Date().toISOString();
  await queryDatabase(`
    INSERT INTO waitlist_entries
      (id, email, consent_version, consented_at, verified_at, channel_code, management_token_hash, created_at)
      VALUES
      ('retention-pending', 'expired-pending@example.com', 'prevalidation-v2', '2020-01-01T00:00:00.000Z', NULL, 'direct', 'retention-pending-token', '2020-01-01T00:00:00.000Z'),
      ('retention-verified', 'expired-verified@example.com', 'prevalidation-v2', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', 'direct', 'retention-verified-token', '2020-01-01T00:00:00.000Z'),
      ('retention-current', 'current@example.com', 'prevalidation-v2', '${currentTimestamp}', NULL, 'direct', 'retention-current-token', '${currentTimestamp}');
    INSERT INTO survey_responses
      (id, waitlist_id, training_frequency, device, logging_method, progression_method, interview_opt_in, created_at, updated_at)
      VALUES ('retention-survey', 'retention-verified', 'two_three', 'galaxy', 'app', 'feeling', 0, '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z');
    INSERT INTO landing_events
      (id, event_name, event_key, properties_json, created_at)
      VALUES ('retention-event', 'landing_view', 'retention:event', '{}', '2020-01-01T00:00:00.000Z');
    INSERT INTO request_rate_limits (id, key, window_start)
      VALUES ('retention-rate', 'retention:key', 1);
  `);

  await startServer();
  const scheduled = await request("/cdn-cgi/local/scheduled");
  assert.equal(scheduled.status, 200);
  await scheduled.arrayBuffer();
  await stopServer();

  const retentionRows = await queryDatabase(`SELECT
    (SELECT count(*) FROM waitlist_entries WHERE id IN ('retention-pending', 'retention-verified')) AS expired_waitlists,
    (SELECT count(*) FROM waitlist_entries WHERE id = 'retention-current') AS current_waitlists,
    (SELECT count(*) FROM survey_responses WHERE id = 'retention-survey') AS expired_surveys,
    (SELECT count(*) FROM landing_events WHERE id = 'retention-event') AS expired_events,
    (SELECT count(*) FROM request_rate_limits WHERE id = 'retention-rate') AS expired_rate_rows`);
  assert.deepEqual(retentionRows, [{
    expired_waitlists: 0,
    current_waitlists: 1,
    expired_surveys: 0,
    expired_events: 0,
    expired_rate_rows: 0,
  }]);
});
