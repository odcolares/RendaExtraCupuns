/**
 * Seed — Cria usuário de teste (cliente@teste.com) + tenant no Turso.
 *
 * Idempotente: pode rodar múltiplas vezes sem efeito colateral.
 * Usado pelo CI para garantir que os testes de database tenham um tenant.
 *
 * Uso: npx ts-node scripts/seed-test-user.ts
 * Requer: DATABASE_URL e TURSO_AUTH_TOKEN no ambiente (ou .env)
 */

import "dotenv/config";
import path from "path";

// Tenta carregar dotenv do web/ (onde o .env com Turso costuma estar)
require("dotenv").config({ path: path.resolve(__dirname, "../web/.env") });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL não definido — pulando seed. Testes de database serão ignorados.");
    process.exit(0);
  }

  // Dynamic import para evitar crash se DATABASE_URL não estiver definida
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const { PrismaClient } = await import("../src/generated/prisma/client");

  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // Cria tenant de teste se não existir
    const tenantName = "Teste CI";
    let tenant = await prisma.tenant.findFirst({
      where: { name: tenantName },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          plan: "free",
          status: "active",
        },
      });
      console.log(`✅ Tenant criado: ${tenant.id} (${tenant.name})`);
    } else {
      console.log(`ℹ️  Tenant já existe: ${tenant.id} (${tenant.name})`);
    }

    // Cria usuário de teste se não existir
    const testEmail = "cliente@teste.com";
    let user = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Cliente Teste",
          email: testEmail,
          password: "seed-ci-placeholder", // não usado em testes
          role: "client",
          tenantId: tenant.id,
        },
      });
      console.log(`✅ Usuário criado: ${user.id} (${user.email})`);
    } else {
      console.log(`ℹ️  Usuário já existe: ${user.id} (${user.email})`);
    }

    console.log("✅ Seed concluído com sucesso.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Seed falhou:", err.message);
  process.exit(1);
});
