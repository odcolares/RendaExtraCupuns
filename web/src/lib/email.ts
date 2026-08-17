import { Resend } from "resend";

function createResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Return a dummy client that throws when used — allows build to proceed
    // (mesmo padrão de web/src/lib/stripe.ts)
    return undefined as unknown as Resend;
  }
  return new Resend(key);
}

export const resend = createResend();

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const DEFAULT_FROM = "RendaExtraCupuns <onboarding@resend.dev>";

/**
 * Envia um e-mail via Resend. Sem RESEND_API_KEY (dev), apenas loga o
 * conteúdo e resolve ok — nunca lança, nunca envia e-mail real.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: EmailPayload): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:dev] to=${to} subject=${subject}\n${html}`);
    return { ok: true };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? DEFAULT_FROM,
    to,
    subject,
    html,
  });

  if (error) throw error;
  return { ok: true };
}