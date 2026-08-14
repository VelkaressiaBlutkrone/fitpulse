import Link from "next/link";
import { TrackedCta, WaitlistForm } from "./components/WaitlistForm";

const problems = [
  {
    number: "01",
    title: "지난 기록이 흩어집니다",
    body: "메모와 앱을 오가다 보면 지난번 무게와 반복 수를 찾는 일부터 운동이 시작됩니다.",
  },
  {
    number: "02",
    title: "증량 기준이 모호합니다",
    body: "성공했어도 몇 kg을 올릴지, 실패했으면 얼마나 낮출지 결국 감으로 정하게 됩니다.",
  },
  {
    number: "03",
    title: "기록이 다음 행동으로 이어지지 않습니다",
    body: "차트는 늘어나지만 오늘 바벨에 끼울 원판의 숫자는 직접 계산해야 합니다.",
  },
];

const steps = [
  ["기록", "한 손으로 세트의 중량·횟수·RPE를 빠르게 남깁니다."],
  ["판단", "최근 수행과 목표 달성 여부를 비교합니다."],
  ["제안", "다음 운동에서 시도할 숫자와 그 이유를 보여줍니다."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FitPulse 처음으로">
          <span className="brand-mark" aria-hidden="true">FP</span>
          <span>FitPulse</span>
          <span className="preview-tag">PREVIEW</span>
        </a>
        <TrackedCta className="header-cta" href="#waitlist" position="header">
          사전 알림
        </TrackedCta>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> FOR STRENGTH TRAINING</p>
          <h1>
            오늘 몇 kg을<br />
            들어야 할지 <em>알려주는</em><br />
            근력운동 코치
          </h1>
          <p className="hero-description">
            지난 운동의 중량, 반복 수와 RPE를 바탕으로<br className="desktop-break" />{" "}
            다음 운동의 목표를 제안하는 앱을 준비하고 있습니다.
          </p>
          <div className="hero-actions">
            <TrackedCta className="primary-button" href="#waitlist" position="hero">
              출시 알림 신청하기 <span aria-hidden="true">↗</span>
            </TrackedCta>
            <span className="build-notice">현재 개발 준비 중 · 결제 없음</span>
          </div>
          <dl className="signal-row">
            <div><dt>기준</dt><dd>지난 수행</dd></div>
            <div><dt>입력</dt><dd>중량 · 횟수 · RPE</dd></div>
            <div><dt>출력</dt><dd>다음 목표 + 근거</dd></div>
          </dl>
        </div>

        <div className="hero-visual" aria-label="개발 예정 화면 시안">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="phone-shell">
            <div className="phone-top"><span>9:41</span><span>● ●</span></div>
            <div className="mock-label">TODAY · PUSH A</div>
            <h2>벤치프레스</h2>
            <p className="mock-sub">다음 목표</p>
            <div className="weight-lockup"><strong>82.5</strong><span>kg</span></div>
            <div className="reason-card">
              <span className="reason-kicker">WHY THIS NUMBER</span>
              <p>최근 3회 목표 반복 달성</p>
              <div className="reason-track"><span /></div>
              <small>이전 80kg에서 2.5kg 증량</small>
            </div>
            <div className="set-list">
              <div><span>01</span><b>82.5 kg</b><em>× 5</em></div>
              <div><span>02</span><b>82.5 kg</b><em>× 5</em></div>
              <div className="set-next"><span>03</span><b>82.5 kg</b><em>READY</em></div>
            </div>
          </div>
          <div className="mock-stamp">개발 예정 화면</div>
        </div>
      </section>

      <section className="problem-section" aria-labelledby="problem-title">
        <div className="section-heading">
          <p className="eyebrow dark"><span /> THE GAP</p>
          <h2 id="problem-title">기록은 쌓이는데,<br />다음 숫자는 여전히 감으로.</h2>
        </div>
        <div className="problem-grid">
          {problems.map((problem) => (
            <article className="problem-card" key={problem.number}>
              <span className="problem-number">{problem.number}</span>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flow-section" aria-labelledby="flow-title">
        <div className="flow-intro">
          <p className="eyebrow"><span /> THE LOOP</p>
          <h2 id="flow-title">운동이 끝날 때마다<br />다음 계획이 선명해집니다.</h2>
          <p>거창한 채팅보다, 다음 세트에서 바로 쓸 수 있는 숫자에 집중합니다.</p>
        </div>
        <ol className="flow-list">
          {steps.map(([title, body], index) => (
            <li key={title}>
              <span className="flow-index">0{index + 1}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
              <span className="flow-arrow" aria-hidden="true">→</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="waitlist-section" id="waitlist" aria-labelledby="waitlist-title">
        <div className="waitlist-copy">
          <p className="eyebrow dark"><span /> EARLY ACCESS</p>
          <h2 id="waitlist-title">첫 운동을 함께<br />설계해 주세요.</h2>
          <p>
            출시 소식과 초기 테스트 초대를 보내드립니다. 아직 만들어지지 않은 앱이며,
            지금은 결제 정보를 받지 않습니다.
          </p>
          <ul>
            <li>출시 알림 외 광고 메일 없음</li>
            <li>언제든 등록 취소·삭제 요청 가능</li>
            <li>첫 설문에서 건강정보를 묻지 않음</li>
          </ul>
        </div>
        <WaitlistForm />
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <h2 id="faq-title">확인해 두면 좋은 것</h2>
        <div className="faq-list">
          <details><summary>지금 바로 사용할 수 있나요?</summary><p>아니요. 현재는 개발 전 수요 검증 단계입니다. 실제 테스트 일정이 정해지면 신청자에게 먼저 안내합니다.</p></details>
          <details><summary>무료인가요?</summary><p>현재는 결제를 받지 않습니다. 가격과 무료 범위는 실제 사용 검증 이후 결정하며, 결정 전에는 확정된 것처럼 안내하지 않습니다.</p></details>
          <details><summary>어떤 데이터를 받나요?</summary><p>첫 단계에서는 이메일과 비민감 선택 설문만 받습니다. 부상, 통증, 수면, 심박 같은 건강정보는 수집하지 않습니다.</p></details>
          <details><summary>의료·재활 서비스를 제공하나요?</summary><p>아니요. FitPulse는 의료 진단, 치료 또는 재활 처방을 제공하지 않습니다.</p></details>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark" aria-hidden="true">FP</span><span>FitPulse</span></div>
        <p>개발 검증용 페이지 · 2026</p>
        <Link href="/privacy">개인정보 안내</Link>
      </footer>
    </main>
  );
}
