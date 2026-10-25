/**
 * Seed - Cria um tenant de demonstracao completo no Turso.
 * Uso: npx ts-node scripts/seed-demo-tenant.ts
 */
import "dotenv/config";
 import * as path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../web/.env") });
const BCRYPT_HASH_SENHA123 = "$2b$10$ehemqhDBgBKWAodQAXJnd.xjQ.4ixauYBqbd.fOrJLqBM55hJpmj.";

async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = require("../web/node_modules/bcryptjs");
    return await (bcrypt as { hash: (pw: string, rounds: number) => Promise<string> }).hash(password, 10);
  } catch {
    if (password === "senha123") return BCRYPT_HASH_SENHA123;
    throw new Error("bcryptjs nao disponivel e hash nao computado para esta senha");
  }
}

async function seedTenant(prisma: any): Promise<any> {
  const demoTenantName = "Demo Condominio";
  let tenant = await prisma.tenant.findFirst({ where: { name: demoTenantName } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: demoTenantName, plan: "pro", status: "active" } });
    console.log("Tenant criado: " + tenant.id + " (" + tenant.name + ") - Plano: " + tenant.plan);
  } else {
    console.log("Tenant ja existe: " + tenant.id + " (" + tenant.name + ")");
  }
  return tenant;
}

async function seedChannels(prisma: any, tenant: any): Promise<void> {
  const whatsappChannel = await prisma.channel.upsert({
    where: { tenantId_platform_channelId: { tenantId: tenant.id, platform: "whatsapp", channelId: "whatsapp-demo-1" } },
    create: { tenantId: tenant.id, platform: "whatsapp", channelId: "whatsapp-demo-1", label: "WhatsApp Principal", isActive: true },
    update: { tenantId: tenant.id, platform: "whatsapp", channelId: "whatsapp-demo-1", label: "WhatsApp Principal", isActive: true },
  });
  console.log("Canal WhatsApp configurado: " + whatsappChannel.label);
  const telegramChannel = await prisma.channel.upsert({
    where: { tenantId_platform_channelId: { tenantId: tenant.id, platform: "telegram", channelId: "telegram-demo-1" } },
    create: { tenantId: tenant.id, platform: "telegram", channelId: "telegram-demo-1", label: "Telegram Demo", isActive: true },
    update: { tenantId: tenant.id, platform: "telegram", channelId: "telegram-demo-1", label: "Telegram Demo", isActive: true },
  });
  console.log("Canal Telegram configurado: " + telegramChannel.label);
}

async function seedConfig(prisma: any, tenant: any): Promise<void> {
  const source = await prisma.fonte.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "WhatsApp Clube Kotas" } },
    create: { tenantId: tenant.id, name: "WhatsApp Clube Kotas", url: "whatsapp://group/clube-kotas", isActive: true, lastChecked: new Date(), totalOffersFound: 0, totalOffersPublished: 0 },
    update: { tenantId: tenant.id, name: "WhatsApp Clube Kotas", url: "whatsapp://group/clube-kotas", isActive: true, lastChecked: new Date(), totalOffersFound: 0, totalOffersPublished: 0 },
  });
  console.log("Fonte configurada: " + source.name);
  await prisma.affiliateConfig.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, amazonTag: "demo-20", shopeeId: "123456", mlId: "ml88888888", aliexpressId: "CAYourAffiliateId123" },
    update: { tenantId: tenant.id, amazonTag: "demo-20", shopeeId: "123456", mlId: "ml88888888", aliexpressId: "CAYourAffiliateId123" }
  });
  console.log("Configuracao de afiliados configurada");
}

async function seedUser(prisma: any, tenant: any): Promise<void> {
  const testEmail = "admin@democond.com";
  const testPassword = "senha123";
  const hashedPassword = await hashPassword(testPassword);
  const user = await prisma.user.upsert({
    where: { email: testEmail },
    create: { name: "Administrador Demo", email: testEmail, password: hashedPassword, role: "admin", emailVerified: new Date(), consentAt: new Date(), tenantId: tenant.id },
    update: { name: "Administrador Demo", password: hashedPassword, role: "admin", emailVerified: new Date(), consentAt: new Date(), tenantId: tenant.id }
  });
  console.log("Usuario admin criado: " + user.id + " (" + user.email + ")");
  console.log("Credenciais de teste: " + testEmail + " / " + testPassword);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL nao definido - pulando seed.");
    process.exit(0);
  }
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const prisma = new PrismaClient({ adapter });
  try {
    const tenant = await seedTenant(prisma);
    await seedChannels(prisma, tenant);
    await seedConfig(prisma, tenant);
    await seedUser(prisma, tenant);
    console.log("Seed concluido com sucesso!");
    console.log("");
    console.log("Proximos passos:");
    console.log("  1. Inicie o bot: npm run dev:bot");
    console.log("  2. Acesse http://localhost:3000 para o painel web");
  } catch (err) {
    console.error("Seed falhou: " + (err as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Seed falhou: " + err.message);
  process.exit(1);
});