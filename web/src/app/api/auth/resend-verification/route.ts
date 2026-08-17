import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { renderVerifyEmail } from "@/lib/email-templates";

const DEFAULT_APP_URL = "https://web-gamma-hazel-30.vercel.app";
const GENERIC_RESPONSE = { message: "Se o email existir, enviaremos um novo link." };

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Anti-enumeração: resposta idêntica para email desconhecido, verificado
    // ou não — o cliente nunca descobre se o email existe.
    if (typeof email === "string" && email.length > 0) {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.emailVerified === null) {
        try {
          const rawToken = await createVerificationToken(user.id, "verify");
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
          await sendEmail({
            to: user.email,
            subject: "Confirme seu e-mail — Renda Extra Cupons",
            html: renderVerifyEmail(`${appUrl}/verificar-email?token=${rawToken}`),
          });
        } catch (error) {
          console.error("Falha ao reenviar e-mail de verificação:", error);
        }
      }
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
