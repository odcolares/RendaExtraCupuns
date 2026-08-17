import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { renderResetPasswordEmail } from "@/lib/email-templates";

const GENERIC_MESSAGE =
  "Se o email existir, enviaremos um link de recuperação.";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://web-gamma-hazel-30.vercel.app";

/**
 * POST /api/auth/forgot-password
 *
 * Anti-enumeração: responde SEMPRE 200 com mensagem genérica, tanto para
 * emails existentes quanto inexistentes — nunca revela se o email está
 * cadastrado. Se o usuário existe, gera um token de reset (expira em 1h,
 * padrão de createVerificationToken) e envia o link por e-mail.
 * Falha no envio de e-mail NUNCA falha a resposta (log e segue).
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: null, message: GENERIC_MESSAGE },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = await createVerificationToken(user.id, "reset");
      const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Redefina sua senha — Renda Extra Cupons",
          html: renderResetPasswordEmail(resetUrl),
        });
      } catch (emailError) {
        // Nunca revelar o estado do fluxo; logar apenas.
        console.error("Forgot-password email error:", emailError);
      }
    }

    return NextResponse.json(
      { error: null, message: GENERIC_MESSAGE },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot-password error:", error);
    // Mesmo em erro interno, resposta genérica (anti-enumeração).
    return NextResponse.json(
      { error: null, message: GENERIC_MESSAGE },
      { status: 200 }
    );
  }
}
