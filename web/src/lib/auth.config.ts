import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "@auth/core/errors";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { NextAuthConfig } from "next-auth";

// Mensagem distinta de bloqueio por e-mail não verificado (C3). Com
// `throw new Error(...)` o NextAuth v5 (beta.31) mascararia a mensagem como
// `error=Configuration` no cliente; por isso o bloqueio usa uma subclasse de
// CredentialsSignin com `code` próprio — a UI de login recebe a mensagem exata
// em `result.code` e exibe o botão de reenvio.
export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Verifique seu email antes de entrar. Enviamos um link para o seu email.";

class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED_MESSAGE;
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("Credenciais inválidas.");
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
          throw new Error("Credenciais inválidas.");
        }

        // C3 — e-mail não verificado bloqueia o login (mensagem distinta para
        // a UI mostrar o reenvio de verificação).
        if (user.emailVerified === null) {
          throw new EmailNotVerifiedError(EMAIL_NOT_VERIFIED_MESSAGE);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.tenantId = (user as unknown as { tenantId: string | null }).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as Record<string, unknown>;
        user.id = token.id;
        user.role = token.role;
        user.tenantId = token.tenantId;
      }
      return session;
    },
  },
};
