// 확인 메일 발송 어댑터.
//
// 공급자 종속 코드를 이 경계 안에만 둔다. 현재는 HTTP 엔드포인트로 위임하며,
// Amazon SES(ap-northeast-2) 직접 연동은 AWS 프로덕션 액세스 승인 후에 채운다.
// 승인 전에는 샌드박스가 수신자 사전 검증을 요구해 대기자 발송에 쓸 수 없다.
// TASK-0001 / WF-03 참조.

export type EmailConfig = {
  sendUrl?: string;
  apiKey?: string;
  from?: string;
};

export type ConfirmationEmail = {
  to: string;
  confirmationUrl: string;
};

export type SendResult = { sent: boolean; reason?: "not_configured" | "provider_error" };

const DEFAULT_FROM = "FitPulse <no-reply@invalid.example>";

export function emailConfigFromEnv(source: unknown): EmailConfig {
  const record =
    typeof source === "object" && source !== null ? (source as Record<string, unknown>) : {};
  return {
    sendUrl: typeof record.EMAIL_SEND_URL === "string" ? record.EMAIL_SEND_URL : undefined,
    apiKey: typeof record.EMAIL_API_KEY === "string" ? record.EMAIL_API_KEY : undefined,
    from: typeof record.EMAIL_FROM === "string" ? record.EMAIL_FROM : undefined,
  };
}

/**
 * 확인 메일을 보낸다.
 *
 * 발송 실패는 등록을 막지 않는다. 확인되지 않은 항목은 미확인 상태로 남고
 * 14일 뒤 보존 정리로 삭제된다. 호출자는 실패해도 같은 응답을 돌려주어
 * 이메일 존재 여부가 드러나지 않게 한다.
 */
export async function sendConfirmationEmail(
  mail: ConfirmationEmail,
  config: EmailConfig,
): Promise<SendResult> {
  if (!config.sendUrl) return { sent: false, reason: "not_configured" };

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;

  try {
    const response = await fetch(config.sendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: config.from ?? DEFAULT_FROM,
        to: mail.to,
        subject: "FitPulse 출시 알림 신청을 확인해 주세요",
        confirmationUrl: mail.confirmationUrl,
      }),
    });
    return response.ok ? { sent: true } : { sent: false, reason: "provider_error" };
  } catch {
    return { sent: false, reason: "provider_error" };
  }
}
