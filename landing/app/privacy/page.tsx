import Link from "next/link";

export default function PrivacyNotice() {
  return (
    <main className="privacy-page">
      <Link className="privacy-back" href="/">← 랜딩으로 돌아가기</Link>
      <p className="eyebrow dark"><span /> PREVALIDATION PRIVACY NOTICE</p>
      <h1>개인정보 안내<br /><small>사전검증 페이지</small></h1>
      <p className="privacy-lead">
        FitPulse는 제품 개발 전 수요를 확인하는 데 필요한 정보만 수집합니다.
        이 안내는 현재 랜딩페이지와 대기자·선택 설문 흐름에 적용됩니다.
      </p>
      <section>
        <h2>수집 항목</h2>
        <p>필수 항목은 이메일 주소, 동의 안내 버전·시각, 유입 채널 코드입니다. 선택 설문은 운동 빈도, 사용 기기, 현재 기록 방식, 다음 중량 결정 방식과 인터뷰 안내 수신 의향만 받습니다. 방문·CTA·제출 여부와 페이지 버전은 이메일 없이 별도 이벤트로 기록합니다.</p>
      </section>
      <section>
        <h2>수집하지 않는 항목</h2>
        <p>첫 검증에서는 이름, 전화번호, 통증, 부상, 수술, 수면, 심박 등 건강·의료정보와 결제 정보를 수집하지 않습니다.</p>
      </section>
      <section>
        <h2>이용 목적과 기간</h2>
        <p>출시 알림, 초기 테스트 안내와 집계된 수요 분석에만 이용합니다. 이메일과 동의 기록은 정식 출시 후 6개월 또는 삭제 요청 시까지, 선택 설문과 행동 이벤트는 수집일로부터 12개월까지 보관한 뒤 삭제합니다.</p>
      </section>
      <section>
        <h2>처리 환경</h2>
        <p>랜딩페이지는 OpenAI Sites로 배포하며, 대기자·선택 설문·행동 이벤트 데이터는 Cloudflare D1에 저장합니다. 현재 별도의 광고 SDK나 제3자 방문 분석 도구는 사용하지 않습니다.</p>
      </section>
      <section>
        <h2>동의 거부</h2>
        <p>개인정보 수집·이용에 동의하지 않을 수 있습니다. 다만 이메일이 있어야 출시 알림을 보낼 수 있으므로, 동의하지 않으면 대기자 등록을 이용할 수 없습니다.</p>
      </section>
      <section>
        <h2>삭제와 문의</h2>
        <p>등록 철회, 저장 정보 확인 또는 삭제 요청은 <a href="mailto:info@leva.ai.kr">info@leva.ai.kr</a>로 보내주세요. 요청자 확인 후 해당 이메일과 연결된 선택 설문을 삭제합니다.</p>
      </section>
      <section>
        <h2>적용 범위</h2>
        <p>정식 서비스, 결제, 계정, 건강정보 또는 웨어러블 연동을 시작할 때는 그 시점의 실제 기능과 처리 환경을 기준으로 별도 개인정보처리방침을 마련합니다.</p>
      </section>
    </main>
  );
}
