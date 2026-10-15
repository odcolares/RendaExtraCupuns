"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, UserPlus, ArrowRight, Globe, Mail, Lock, User } from "lucide-react";
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

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  consent: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar os Termos de Uso e Política de Privacidade",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "Mínimo 6 caracteres", valid: password.length >= 6 },
    { label: "Contém letra", valid: /[a-zA-Z]/.test(password) },
    { label: "Contém número", valid: /[0-9]/.test(password) },
  ];

  const strength = checks.filter((c) => c.valid).length;
  const colors = ["bg-gray-300", "bg-amber-400", "bg-emerald-500"];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colors[Math.min(strength, 2)]}`}
            style={{ width: `${(strength / 3) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {["Fraca", "Média", "Forte"][Math.min(strength - 1, 2)] || "Fraca"}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-1"
          >
            <span className={check.valid ? "text-emerald-500" : "text-muted-foreground/30"}>
              {check.valid ? "✓" : "•"}
            </span>
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "free";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch("password", "");

  async function onSubmit(data: SignupFormData) {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          consent: true,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao criar conta.");
        return;
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.");
    }
  }

  return (
    <Card className="relative w-full shadow-lg overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent" />
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl tracking-wide">Criar Conta</CardTitle>
        <CardDescription>
          {selectedPlan !== "free"
            ? `Você está assinando o plano ${selectedPlan}`
            : "Comece grátis, cancele quando quiser"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root?.message && (
            <p className="text-xs text-destructive">{errors.root.message}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <Input
                id="name"
                placeholder="Seu nome"
                className="focus-visible:ring-brand-primary placeholder:text-muted-foreground/50 pl-10"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                <Lock className="size-4" />
              </div>
              <PasswordInput
                id="password"
                showToggle
                className="pl-10 pr-10"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
            <PasswordStrength password={password} />
          </div>
          <div className="flex items-start gap-2">
            <input
              id="consent"
              type="checkbox"
              {...register("consent")}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-brand-primary"
            />
            <Label
              htmlFor="consent"
              className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
            >
              Li e aceito os{" "}
              <Link
                href="/termos"
                target="_blank"
                className="text-primary underline underline-offset-2 hover:text-brand-primary cursor-pointer"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                className="text-primary underline underline-offset-2 hover:text-brand-primary cursor-pointer"
              >
                Política de Privacidade
              </Link>
            </Label>
          </div>
          {errors.consent && (
            <p className="text-xs text-destructive">{errors.consent.message}</p>
          )}
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
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer gap-2"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <Globe className="size-4" />
            Criar conta com Google
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="group inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
            >
              Entrar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center">Carregando...</div>}>
      <SignupForm />
    </Suspense>
  );
}
