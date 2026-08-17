import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { renderVerifyEmail } from "@/lib/email-templates";

const DEFAULT_APP_URL = "https://web-gamma-hazel-30.vercel.app";

export async function POST(request: Request) {
  try {
    const { name, email, password, consent } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    // LGPD — consentimento explícito (Lei 13.709/2018, art. 7º, I)
    if (consent !== true) {
      return NextResponse.json(
        {
          error:
            "Você precisa aceitar os termos de uso e a política de privacidade",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "client",
        consentAt: new Date(),
        tenant: {
          create: {
            name: `${name}'s Workspace`,
            plan: "free",
            status: "active",
            affiliateConfig: {
              create: {},
            },
          },
        },
      },
      include: {
        tenant: true,
      },
    });

    // C3 — verificação de e-mail: gera token e envia o link de confirmação.
    // Falha de e-mail NUNCA bloqueia o signup (o usuário já foi criado);
    // em dev sem RESEND_API_KEY o sendEmail apenas loga o link.
    try {
      const rawToken = await createVerificationToken(user.id, "verify");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
      await sendEmail({
        to: user.email,
        subject: "Confirme seu e-mail — Renda Extra Cupons",
        html: renderVerifyEmail(`${appUrl}/verificar-email?token=${rawToken}`),
      });
    } catch (error) {
      console.error("Falha ao enviar e-mail de verificação (signup):", error);
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
