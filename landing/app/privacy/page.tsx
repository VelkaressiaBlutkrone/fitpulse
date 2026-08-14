import Link from "next/link";

export default function PrivacyNotice() {
  return (
    <main className="privacy-page">
      <Link className="privacy-back" href="/">← 랜딩으로 돌아가기</Link>
      <p className="eyebrow dark"><span /> PRIVACY NOTICE DRAFT</p>
      <h1>개인정보 안내<br /><small>공개 전 초안</small></h1>
      <p className="privacy-lead">
        이 문서는 로컬 검증용 초안입니다. 공개 배포 전 실제 운영 연락처, 호스팅 위치와
        저장 공급자를 확인해 최종본으로 교체합니다.
      </p>
      <section>
        <h2>수집 항목</h2>
        <p>필수 항목은 이메일 주소, 동의 안내 버전과 동의 시각입니다. 선택 설문은 운동 빈도, 사용 기기, 현재 기록 방식, 다음 중량 결정 방식과 인터뷰 안내 수신 의향만 받습니다.</p>
      </section>
      <section>
        <h2>수집하지 않는 항목</h2>
        <p>첫 검증에서는 이름, 전화번호, 통증, 부상, 수술, 수면, 심박 등 건강·의료정보와 결제 정보를 수집하지 않습니다.</p>
      </section>
      <section>
        <h2>이용 목적과 기간</h2>
        <p>출시 알림, 초기 테스트 안내와 비식별 수요 분석에만 이용합니다. 이메일은 정식 출시 후 6개월 또는 철회 시까지 보관하는 기준으로 설계했습니다.</p>
      </section>
      <section>
        <h2>삭제와 문의</h2>
        <p>공개 전 실제 삭제 요청 연락처와 처리 절차를 이 위치에 명시합니다. 해당 정보가 없는 상태에서는 이 페이지를 공개 모집에 사용하지 않습니다.</p>
      </section>
    </main>
  );
}
