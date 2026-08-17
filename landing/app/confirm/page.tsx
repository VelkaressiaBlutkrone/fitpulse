import Link from "next/link";

// 확인 링크 처리 결과를 보여준다. 토큰은 이 주소에 실리지 않는다.
// 서버에서 렌더해 브라우저 이력과 Referer에 토큰이 남지 않게 한다.
// TASK-0001 / WF-03 참조.

const outcomes = {
  confirmed: {
    title: "이메일 확인이 끝났습니다",
    body: "출시 소식과 초기 테스트 초대를 이 주소로 보내드립니다. 개발 전 검증 단계이며 아직 제공되는 앱은 없습니다.",
    tone: "status" as const,
  },
  invalid: {
    title: "확인 링크를 사용할 수 없습니다",
    body: "링크가 만료되었거나 이미 사용되었습니다. 확인 전 신청은 14일 뒤 자동으로 삭제됩니다. 다시 신청해 주세요.",
    tone: "error" as const,
  },
  unavailable: {
    title: "지금은 확인을 처리할 수 없습니다",
    body: "일시적인 문제로 확인을 마치지 못했습니다. 잠시 후 메일의 링크를 다시 열어 주세요.",
    tone: "error" as const,
  },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const outcome = outcomes[status as keyof typeof outcomes] ?? outcomes.invalid;

  return (
    <main className="confirm-page">
      <section className="form-card">
        <p className="form-step">STEP 1 · 확인</p>
        <h1>{outcome.title}</h1>
        <p
          className={`form-message${outcome.tone === "error" ? " form-error" : ""}`}
          role={outcome.tone === "error" ? "alert" : "status"}
        >
          {outcome.body}
        </p>
        <p className="field-help">
          문의는 <a href="mailto:info@leva.ai.kr">info@leva.ai.kr</a>로 보내주세요.
        </p>
        <Link className="submit-button" href="/">
          랜딩으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
