import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fitpulse-validation.velkaressia.chatgpt.site"),
  title: "다음 운동의 숫자를 정하는 코치 | FitPulse",
  description:
    "지난 운동 기록을 바탕으로 다음 중량과 반복 수를 제안하는 근력운동 코치를 준비하고 있습니다.",
  openGraph: {
    title: "다음 운동의 숫자를 정하는 코치 | FitPulse",
    description:
      "지난 운동 기록을 바탕으로 다음 중량과 반복 수를 제안하는 근력운동 코치를 준비하고 있습니다.",
    type: "website",
    images: [
      {
        url: "/fitpulse-social-card.png",
        width: 1672,
        height: 941,
        alt: "바벨 원판과 점진적 중량 증가 데이터를 표현한 FitPulse 미리보기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "다음 운동의 숫자를 정하는 코치 | FitPulse",
    description:
      "지난 운동 기록을 바탕으로 다음 중량과 반복 수를 제안하는 근력운동 코치를 준비하고 있습니다.",
    images: ["/fitpulse-social-card.png"],
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
