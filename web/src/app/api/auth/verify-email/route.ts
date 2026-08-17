import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findVerificationToken } from "@/lib/tokens";

const INVALID_TOKEN_MESSAGE = "Link inválido ou expirado. Solicite um novo link.";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    const info = await findVerificationToken("verify", null, token);

    if (!info) {
      return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: info.userId },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${info.userId}` },
    });

    return NextResponse.json(
      { message: "Email verificado! Agora você pode entrar." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
