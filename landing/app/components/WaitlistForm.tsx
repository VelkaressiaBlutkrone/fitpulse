"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PAGE_VERSION, trackEvent } from "../lib/analytics";

type SubmitState = "idle" | "submitting" | "success" | "error";

function currentChannelCode() {
  if (typeof window === "undefined") return "direct";
  const source = new URLSearchParams(window.location.search).get("utm_source") ?? "direct";
  return /^[a-z0-9_-]{1,40}$/i.test(source) ? source.toLowerCase() : "other";
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
      onClick={() => trackEvent("primary_cta_click", { pageVersion: PAGE_VERSION, position })}
    >
      {children}
    </a>
  );
}

export function WaitlistForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  const [surveyDone, setSurveyDone] = useState(false);
  const [channelCode] = useState(currentChannelCode);

  useEffect(() => {
    trackEvent("landing_view", { pageVersion: PAGE_VERSION, channelCode });
  }, [channelCode]);

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        consent: form.get("consent") === "on",
        consentVersion: "prevalidation-v1",
        channelCode,
        company: String(form.get("company") ?? ""),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      setMessage("등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const result = (await response.json()) as { waitlistId?: string };
    setWaitlistId(result.waitlistId ?? null);
    setState("success");
    setMessage("등록했습니다. 출시 일정이 정해지면 가장 먼저 알려드릴게요.");
    trackEvent("waitlist_submit", { pageVersion: PAGE_VERSION, channelCode });
  }

  async function submitSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!waitlistId) return;

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        waitlistId,
        trainingFrequency: String(form.get("trainingFrequency") ?? ""),
        device: String(form.get("device") ?? ""),
        loggingMethod: String(form.get("loggingMethod") ?? ""),
        progressionMethod: String(form.get("progressionMethod") ?? ""),
        interviewOptIn: form.get("interviewOptIn") === "on",
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setMessage("설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setSurveyDone(true);
    setMessage("설문까지 저장했습니다. 감사합니다.");
    trackEvent("survey_complete", { pageVersion: PAGE_VERSION });
    if (form.get("interviewOptIn") === "on") {
      trackEvent("interview_opt_in", { pageVersion: PAGE_VERSION });
    }
  }

  if (state === "success" && waitlistId && !surveyDone) {
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
            <input name="interviewOptIn" type="checkbox" />
            <span>30분 사용자 인터뷰 안내도 받고 싶습니다.</span>
          </label>
          <button className="submit-button" type="submit">선택 설문 보내기</button>
        </form>
        <p className="form-message" role="status">{message}</p>
      </div>
    );
  }

  if (surveyDone) {
    return (
      <div className="form-card success-card" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <p className="form-step">RESPONSE SAVED</p>
        <h3>참여해 주셔서 감사합니다.</h3>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="form-card">
      <p className="form-step">STEP 1 · 필수</p>
      <h3>출시 알림 신청</h3>
      <p className="form-description">이메일 한 개만 받습니다. 결제 정보는 요구하지 않습니다.</p>
      <form onSubmit={submitWaitlist} noValidate>
        <label className="field-label" htmlFor="waitlist-email">이메일</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="company">회사명</label>
          <input id="company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="check-row">
          <input name="consent" type="checkbox" required />
          <span>
            <b>개인정보 수집·이용에 동의합니다.</b><br />
            이메일 · 출시 알림 및 초기 테스트 안내 · 출시 후 6개월 또는 철회 시까지
          </span>
        </label>
        <button className="submit-button" type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "등록 중…" : "출시 알림 신청하기"}
        </button>
      </form>
      <p className="form-message" role="status" aria-live="polite">{message}</p>
      <Link className="privacy-link" href="/privacy">개인정보 안내 보기 →</Link>
    </div>
  );
}
