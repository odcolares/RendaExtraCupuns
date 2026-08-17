import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { findVerificationToken } from "@/lib/tokens";

const INVALID_TOKEN_MESSAGE =
  "Link inválido ou expirado. Solicite um novo link.";

/**
 * POST /api/auth/reset-password
 *
 * Valida o token RAW (bcrypt.compare contra o hash armazenado, via
 * findVerificationToken — userId desconhecido no momento da busca, por isso
 * null), atualiza a senha com hash novo e APAGA o token (uso único — nunca
 * reutilizável). A nova senha NUNCA é enviada por e-mail.
 */
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const info = await findVerificationToken("reset", null, token);

    if (!info) {
      return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: info.userId },
      data: { password: hashedPassword },
    });

    // Uso único: apaga o(s) token(s) de reset do usuário após o uso.
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${info.userId}` },
    });

    return NextResponse.json(
      { message: "Senha atualizada! Agora você pode entrar." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset-password error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}