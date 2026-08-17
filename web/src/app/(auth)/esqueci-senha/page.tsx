"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
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

const GENERIC_MESSAGE =
  "Se o email existir, enviaremos um link de recuperação.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || GENERIC_MESSAGE);
    } catch {
      setMessage(GENERIC_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative w-full shadow-lg overflow-hidden">
      {/* Brand gradient top border */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent" />
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient">
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl tracking-wide">
          Esqueceu sua senha?
        </CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link de recuperação
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          {message && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {message}
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
                Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar para o login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}