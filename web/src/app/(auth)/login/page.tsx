"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, ArrowRight, MailCheck, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/auth-form-wrapper";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const EMAIL_NOT_VERIFIED_MESSAGE =
  "Verifique seu email antes de entrar. Enviamos um link para o seu email.";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email", "");

  async function onSubmit(data: LoginFormData) {
    setNeedsVerification(false);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.code === EMAIL_NOT_VERIFIED_MESSAGE) {
          setNeedsVerification(true);
          toast.error(result.code);
        } else {
          toast.error("Email ou senha inválidos.");
        }
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
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
        toast.error("Erro ao reenviar o link. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao reenviar o link. Tente novamente.");
    }
  }

  return (
    <Card className="relative w-full shadow-lg overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent" />
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient">
          <LogIn className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl tracking-wide">Entrar</CardTitle>
        <CardDescription>Acesse seu painel de afiliados</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="focus-visible:ring-brand-primary placeholder:text-muted-foreground/50 pl-10"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <PasswordInput
            id="password"
            showToggle
            error={errors.password?.message}
            {...register("password")}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer gap-2"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <Globe className="size-4" />
            Entrar com Google
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
