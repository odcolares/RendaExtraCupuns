"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, LogIn, ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mesma string de web/src/lib/auth.config.ts (EMAIL_NOT_VERIFIED_MESSAGE) —
// chega aqui via `result.code` do signIn (subclasse de CredentialsSignin).
const EMAIL_NOT_VERIFIED_MESSAGE =
  "Verifique seu email antes de entrar. Enviamos um link para o seu email.";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setNeedsVerification(false);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.code === EMAIL_NOT_VERIFIED_MESSAGE) {
          setError(result.code);
          setNeedsVerification(true);
        } else {
          setError("Email ou senha inválidos.");
        }
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendMessage("Se o email existir, enviaremos um novo link.");
      } else {
        setError("Erro ao reenviar o link. Tente novamente.");
      }
    } catch {
      setError("Erro ao reenviar o link. Tente novamente.");
    }
  }

  return (
    <Card className="relative w-full shadow-lg overflow-hidden">
      {/* Brand gradient top border */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent" />
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient">
          <LogIn className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl tracking-wide">Entrar</CardTitle>
        <CardDescription>Acesse seu painel de afiliados</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {needsVerification && (
            <div className="flex flex-col gap-2 rounded-md bg-brand-primary/10 p-3 text-sm">
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={handleResendVerification}
              >
                <MailCheck className="mr-2 h-4 w-4" />
                Reenviar e-mail de verificação
              </Button>
              {resendMessage && (
                <p className="text-center text-muted-foreground">{resendMessage}</p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="focus-visible:ring-brand-primary placeholder:text-muted-foreground/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              className="focus-visible:ring-brand-primary placeholder:text-muted-foreground/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Não tem conta?{" "}
            <Link
              href="/signup"
              className="group inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
            >
              Cadastre-se
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
