"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, MailCheck, LogIn, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VerifyStatus = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Link inválido ou expirado. Solicite um novo link.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Não foi possível verificar seu email.");
          return;
        }

        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Erro ao verificar seu email. Tente novamente.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Card className="relative w-full shadow-lg overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent" />
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient">
          {status === "success" ? (
            <MailCheck className="h-6 w-6 text-white" />
          ) : status === "error" ? (
            <AlertCircle className="h-6 w-6 text-white" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          )}
        </div>
        <CardTitle className="text-2xl tracking-wide">
          {status === "success"
            ? "Email verificado!"
            : status === "error"
              ? "Não foi possível verificar"
              : "Verificando seu email..."}
        </CardTitle>
        <CardDescription>
          {status === "success"
            ? "Agora você pode entrar."
            : status === "error"
              ? error
              : "Aguarde um instante."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status === "error" && (
          <p className="text-center text-sm text-muted-foreground">
            Se o link expirou, faça login e use a opção de reenvio.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Link
          href="/login"
          className={cn(buttonVariants({ className: "w-full cursor-pointer" }))}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Ir para o login
        </Link>
        {status === "success" && (
          <p className="text-sm text-muted-foreground text-center">
            Já pode acessar sua conta.{" "}
            <Link
              href="/login"
              className="group inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
            >
              Entrar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center">Carregando...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}