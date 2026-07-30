import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Lock, Mail, Save, Shield, User } from "lucide-react";

import { getProfileAction, updateProfileAction, updatePasswordAction } from "@/actions/conta";

export default async function ContaPage(props: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getProfileAction();

  if (!user) {
    redirect("/login");
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  }

  const planLabel =
    user.tenant?.plan === "free"
      ? "Free"
      : user.tenant?.plan === "starter"
        ? "Starter"
        : user.tenant?.plan === "professional"
          ? "Professional"
          : "—";

  const statusLabel =
    user.tenant?.status === "active"
      ? "Ativo"
      : user.tenant?.status === "suspended"
        ? "Suspenso"
        : "Cancelado";

  const roleLabel = user.role === "admin" ? "Administrador" : "Cliente";

  return (
    <div className="space-y-6">
      {/* Feedback Messages */}
      {searchParams?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
          {searchParams.success}
        </div>
      )}
      {searchParams?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          {searchParams.error}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
          <p className="text-sm text-muted-foreground">{user.name} &middot; {user.email}</p>
        </div>
      </div>

      {/* Personal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize seu nome de exibição
          </CardDescription>
        </CardHeader>
        <form
          action={async (formData: FormData) => {
            "use server";
            try {
              await updateProfileAction(formData);
            } catch (e) {
              if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
                redirect(
                  `/conta?error=${encodeURIComponent(e.message)}`
                );
              }
              throw e;
            }
            redirect("/conta?success=Perfil+atualizado+com+sucesso");
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="pr-10"
                />
                <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" className="gap-2">
              <Save className="size-4" />
              Salvar
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Escolha uma senha forte e única
          </CardDescription>
        </CardHeader>
        <form
          action={async (formData: FormData) => {
            "use server";
            try {
              await updatePasswordAction(formData);
            } catch (e) {
              if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
                redirect(
                  `/conta?error=${encodeURIComponent(e.message)}`
                );
              }
              throw e;
            }
            redirect("/conta?success=Senha+alterada+com+sucesso");
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" className="gap-2">
              <Lock className="size-4" />
              Alterar Senha
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Detalhes da sua assinatura e conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="font-medium">{planLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  user.tenant?.status === "active" ? "default" : "secondary"
                }
              >
                {statusLabel}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Data de Cadastro</p>
              <p className="flex items-center gap-2 font-medium">
                <Calendar className="size-4 text-muted-foreground" />
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tipo de Usuário</p>
              <p className="flex items-center gap-2 font-medium">
                <Shield className="size-4 text-muted-foreground" />
                {roleLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
