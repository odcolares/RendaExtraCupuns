"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getProfileAction() {
  const session = await requireAuth();
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      tenantId: true,
      tenant: {
        select: {
          name: true,
          plan: true,
          status: true,
        },
      },
    },
  });

  return user;
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireAuth();
  const userId = session.user.id;

  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Nome é obrigatório");

  await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  });

  revalidatePath("/conta");
  return { success: true };
}

export async function updatePasswordAction(formData: FormData) {
  const session = await requireAuth();
  const userId = session.user.id;

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword) throw new Error("Senha atual é obrigatória");
  if (!newPassword || newPassword.length < 6)
    throw new Error("Nova senha deve ter no mínimo 6 caracteres");
  if (newPassword !== confirmPassword)
    throw new Error("Nova senha e confirmação não conferem");

  // Verify current password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) throw new Error("Usuário não encontrado");

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) throw new Error("Senha atual incorreta");

  // Update password
  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  revalidatePath("/conta");
  return { success: true };
}
