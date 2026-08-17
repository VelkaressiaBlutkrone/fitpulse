"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { normalizeChannelCode } from "../lib/input";
import { landingViewEventId, PAGE_VERSION, trackEvent } from "../lib/analytics";

type Stage = "waitlist" | "survey" | "complete" | "deleted";
type BusyAction = "waitlist" | "survey" | "delete" | null;
type MessageKind = "status" | "error";

function currentChannelCode() {
  if (typeof window === "undefined") return "direct";
  return normalizeChannelCode(
    new URLSearchParams(window.location.search).get("utm_source") ?? "direct",
  );
}

export function TrackedCta({
  className,
  href,
  position,
  children,
}: {
  className: string;
  href: string;
  position: "header" | "hero";
  children: React.ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => trackEvent("primary_cta_click", {
        page_version: PAGE_VERSION,
        position,
      })}
    >
      {children}
    </a>
  );
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string) => void };
  }
}

export function WaitlistForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [stage, setStage] = useState<Stage>("waitlist");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<MessageKind>("status");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);
  const [interviewOptIn, setInterviewOptIn] = useState(false);
  const [channelCode] = useState(currentChannelCode);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    trackEvent(
      "landing_view",
      { page_version: PAGE_VERSION, channel_code: channelCode },
      landingViewEventId(),
    );
  }, [channelCode]);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [turnstileSiteKey]);

  function showError(nextMessage: string) {
    setMessageKind("error");
    setMessage(nextMessage);
    requestAnimationFrame(() => messageRef.current?.focus());
  }

  function showStatus(nextMessage: string) {
    setMessageKind("status");
    setMessage(nextMessage);
  }

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    setBusy("waitlist");
    showStatus("");
    const form = new FormData(formElement);
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        consent: form.get("consent") === "on",
        consentVersion: "prevalidation-v3",
        channelCode,
        company: String(form.get("company") ?? ""),
        // Turnstile 위젯이 폼에 심는 hidden input이다. 서버가 이 값을 검증한다.
        turnstileToken: String(form.get("cf-turnstile-response") ?? ""),
      }),
    }).catch(() => null);
    setBusy(null);

    if (!response?.ok) {
      // 403은 사람 확인 실패다. 위젯 토큰은 1회용이므로 재시도 전에 초기화한다.
      if (response?.status === 403) {
        window.turnstile?.reset();
        showError("사람 확인에 실패했습니다. 확인란을 다시 진행한 뒤 시도해 주세요.");
        return;
      }
      showError("등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setStage("survey");
    showStatus("확인 메일을 보냈습니다. 메일의 링크를 눌러야 신청이 완료됩니다.");
  }

  async function submitSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    setBusy("survey");
    const form = new FormData(formElement);
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        trainingFrequency: String(form.get("trainingFrequency") ?? ""),
        device: String(form.get("device") ?? ""),
        loggingMethod: String(form.get("loggingMethod") ?? ""),
        progressionMethod: String(form.get("progressionMethod") ?? ""),
        interviewOptIn,
      }),
    }).catch(() => null);
    setBusy(null);

    if (!response?.ok) {
      showError("설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setStage("complete");
    showStatus("설문까지 접수했습니다. 감사합니다.");
  }

  async function deleteRegistration() {
    setBusy("delete");
    const response = await fetch("/api/waitlist", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => null);
    setBusy(null);

    if (!response?.ok) {
      showError("삭제하지 못했습니다. 잠시 후 다시 시도하거나 개인정보 문의처로 연락해 주세요.");
      return;
    }

    setStage("deleted");
    showStatus("이 브라우저에서 접수한 이메일과 연결 설문을 삭제했습니다.");
  }

  if (stage === "survey") {
    return (
      <div className="form-card">
        <p className="form-step">STEP 2 · 선택</p>
        <h3>네 가지만 더 알려주세요.</h3>
        <p className="form-description">어떤 첫 버전을 만들지 정하는 비민감 선택 설문입니다.</p>
        <form className="survey-form" onSubmit={submitSurvey}>
          <label>주간 근력운동 빈도
            <select name="trainingFrequency" required defaultValue="">
              <option value="" disabled>선택해 주세요</option>
              <option value="four_plus">주 4회 이상</option>
              <option value="two_three">주 2~3회</option>
              <option value="one_less">주 1회 이하</option>
            </select>
          </label>
          <label>주로 쓰는 기기
            <select name="device" required defaultValue="">
              <option value="" disabled>선택해 주세요</option>
              <option value="galaxy">Galaxy / Android</option>
              <option value="iphone">iPhone</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label>현재 기록 방식
            <select name="loggingMethod" required defaultValue="">
              <option value="" disabled>선택해 주세요</option>
              <option value="app">운동 기록 앱</option>
              <option value="notes">메모·스프레드시트</option>
              <option value="paper">종이 기록</option>
              <option value="none">기록하지 않음</option>
            </select>
          </label>
          <label>다음 중량 결정 방식
            <select name="progressionMethod" required defaultValue="">
              <option value="" disabled>선택해 주세요</option>
              <option value="program">정해진 프로그램</option>
              <option value="coach">트레이너 지시</option>
              <option value="feeling">그날의 감</option>
              <option value="repeat">지난 중량 반복</option>
            </select>
          </label>
          <label className="check-row optional-check">
            <input
              name="interviewOptIn"
              type="checkbox"
              checked={interviewOptIn}
              onChange={(event) => setInterviewOptIn(event.currentTarget.checked)}
            />
            <span>30분 사용자 인터뷰 안내도 받고 싶습니다.</span>
          </label>
          <button className="submit-button" type="submit" disabled={busy !== null}>
            {busy === "survey" ? "저장 중…" : "선택 설문 보내기"}
          </button>
        </form>
        <p
          className={`form-message${messageKind === "error" ? " form-error" : ""}`}
          role={messageKind === "error" ? "alert" : "status"}
          aria-live="polite"
          ref={messageRef}
          tabIndex={-1}
        >{message}</p>
        <button className="delete-button" type="button" onClick={deleteRegistration} disabled={busy !== null}>
          등록 취소 및 데이터 삭제
        </button>
      </div>
    );
  }

  if (stage === "complete" || stage === "deleted") {
    return (
      <div className="form-card success-card" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <p className="form-step">{stage === "deleted" ? "DATA DELETED" : "RESPONSE SAVED"}</p>
        <h3>{stage === "deleted" ? "삭제를 처리했습니다." : "참여해 주셔서 감사합니다."}</h3>
        <p>{message}</p>
        {stage === "complete" && (
          <button className="delete-button" type="button" onClick={deleteRegistration} disabled={busy !== null}>
            {busy === "delete" ? "삭제 중…" : "등록 취소 및 데이터 삭제"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="form-card">
      <p className="form-step">STEP 1 · 필수</p>
      <h3>출시 알림 신청</h3>
      <p className="form-description">이메일 한 개만 받습니다. 결제 정보는 요구하지 않습니다.</p>
      <form onSubmit={submitWaitlist}>
        <label className="field-label" htmlFor="waitlist-email">이메일</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={emailInvalid || undefined}
          aria-describedby="waitlist-email-help waitlist-form-message"
          onInvalid={() => setEmailInvalid(true)}
          onInput={() => setEmailInvalid(false)}
        />
        <span className="field-help" id="waitlist-email-help">출시 안내를 받을 주소를 입력해 주세요.</span>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="company">회사명</label>
          <input id="company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="check-row" htmlFor="waitlist-consent">
          <input
            id="waitlist-consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={consentInvalid || undefined}
            aria-describedby="waitlist-consent-copy waitlist-form-message"
            onInvalid={() => setConsentInvalid(true)}
            onChange={() => setConsentInvalid(false)}
          />
          <span id="waitlist-consent-copy">
            <b>개인정보 수집·이용에 동의합니다.</b><br />
            이메일 · 출시 알림 및 초기 테스트 안내 · 확인 전 14일, 확인 후 최대 12개월
          </span>
        </label>
        {turnstileSiteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-appearance="interaction-only"
            data-language="ko"
          />
        ) : null}
        <button className="submit-button" type="submit" disabled={busy !== null}>
          {busy === "waitlist" ? "등록 중…" : "출시 알림 신청하기"}
        </button>
      </form>
      <p
        id="waitlist-form-message"
        className={`form-message${messageKind === "error" ? " form-error" : ""}`}
        role={messageKind === "error" ? "alert" : "status"}
        aria-live="polite"
        ref={messageRef}
        tabIndex={-1}
      >{message}</p>
      <Link className="privacy-link" href="/privacy">개인정보 안내 보기 →</Link>
    </div>
  );
}
