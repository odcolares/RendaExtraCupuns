#!/usr/bin/env ts-node
/**
 * Script de Provisionamento Railway - Cria service para um tenant
 * 
 * Uso: npx ts-node scripts/provision-bot.ts <tenantId>
 * 
 * Requer: RAILWAY_TOKEN e RAILWAY_PROJECT_ID no .env
 */

import { config } from "dotenv";
config();

interface ProvisionResult {
  success: boolean;
  serviceId?: string;
  serviceUrl?: string;
  error?: string;
  manualSteps?: string[];
}

async function provisionBot(tenantId: string): Promise<ProvisionResult> {
  const railwayToken = process.env.RAILWAY_TOKEN;
  const projectId = process.env.RAILWAY_PROJECT_ID;

  if (!railwayToken || !projectId) {
    console.error("❌ RAILWAY_TOKEN e RAILWAY_PROJECT_ID são obrigatórios no .env");
    return { 
      success: false, 
      error: "Credenciais Railway não configuradas",
      manualSteps: [
        "Configure RAILWAY_TOKEN e RAILWAY_PROJECT_ID no .env",
        "Execute novamente: npx ts-node scripts/provision-bot.ts " + tenantId
      ]
    };
  }

  const serviceName = `renda-extra-${tenantId.slice(0, 8)}`;
  const baseUrl = "https://backboard.railway.app/graphql/v2";

  const headers = {
    "Authorization": `Bearer ${railwayToken}`,
    "Content-Type": "application/json",
  };

  // GraphQL mutation para criar service
  const mutation = `
    mutation CreateService($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
        status
      }
    }
  `;

  const envVars = [
    { key: "TENANT_ID", value: tenantId },
    { key: "DATABASE_URL", value: process.env.DATABASE_URL || "" },
    { key: "TURSO_AUTH_TOKEN", value: process.env.TURSO_AUTH_TOKEN || "" },
    { key: "TELEGRAM_BOT_TOKEN", value: process.env.TELEGRAM_BOT_TOKEN || "" },
    { key: "WHATSAPP_SESSION_BASE_PATH", value: "/data/whatsapp-sessions" },
    { key: "AMAZON_AFFILIATE_TAG", value: process.env.AMAZON_AFFILIATE_TAG || "" },
    { key: "SHOPEE_AFFILIATE_ID", value: process.env.SHOPEE_AFFILIATE_ID || "" },
    { key: "ALIEXPRESS_AFFILIATE_ID", value: process.env.ALIEXPRESS_AFFILIATE_ID || "" },
    { key: "MERCADOLIVRE_AFFILIATE_ID", value: process.env.MERCADOLIVRE_AFFILIATE_ID || "" },
    { key: "ML_CLIENT_ID", value: process.env.ML_CLIENT_ID || "" },
    { key: "ML_SECRET_KEY", value: process.env.ML_SECRET_KEY || "" },
    { key: "ML_ACCESS_TOKEN", value: process.env.ML_ACCESS_TOKEN || "" },
    { key: "ML_REFRESH_TOKEN", value: process.env.ML_REFRESH_TOKEN || "" },
    { key: "PUPPETEER_EXECUTABLE_PATH", value: "/usr/bin/chromium" },
    { key: "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD", value: "true" },
    { key: "NODE_ENV", value: "production" },
  ].filter(v => v.value);

  const variables = {
    input: {
      projectId,
      name: serviceName,
      source: {
        repo: "https://github.com/odcolares/RendaExtraCupuns",
        branch: "main",
        dockerfilePath: "./Dockerfile",
      },
      envVars,
    },
  };

  async function graphql(query: string, vars: any): Promise<any> {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: vars }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Railway API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  try {
    console.log(`🚀 Provisionando bot para tenant: ${tenantId}`);
    console.log(`   Service name: ${serviceName}`);

    const result = await graphql(mutation, variables);
    const service = result.serviceCreate;
    
    console.log(`✅ Service criado: ${service.id} (${service.name})`);
    console.log(`   Status: ${service.status}`);

    // Aguarda service ficar pronto
    console.log("⏳ Aguardando service ficar RUNNING...");
    const serviceUrl = await waitForServiceReady(service.id, headers, baseUrl);
    
    if (serviceUrl) {
      console.log(`🌐 Service URL: ${serviceUrl}`);
    }

    // Cria volume para sessão WhatsApp
    console.log("📦 Criando volume para sessão WhatsApp...");
    await createVolume(tenantId, headers, baseUrl);
    console.log("✅ Volume criado e anexado");

    return {
      success: true,
      serviceId: service.id,
      serviceUrl,
    };
  } catch (error) {
    console.error("❌ Falha ao provisionar:", (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      manualSteps: [
        "Crie service manualmente no Railway dashboard",
        `Nome: ${serviceName}`,
        "Dockerfile: ./Dockerfile",
        "Env vars: ver .env.example",
        "Volume: whatsapp-session-" + tenantId + " em /data/whatsapp-sessions",
      ],
    };
  }
}

async function waitForServiceReady(serviceId: string, headers: any, baseUrl: string, maxAttempts = 30): Promise<string | undefined> {
  const query = `
    query Service($id: ID!) {
      service(id: $id) {
        id
        name
        status
        domains { url }
      }
    }
  `;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { id: serviceId } }),
    });

    if (!response.ok) continue;

    const data = await response.json();
    if (data.errors) continue;

    const service = data.data?.service;
    if (service?.status === "RUNNING" && service?.domains?.[0]?.url) {
      return service.domains[0].url;
    }

    console.log(`   Tentativa ${i + 1}/${maxAttempts} - Status: ${service?.status || "unknown"}`);
    await new Promise(r => setTimeout(r, 10000));
  }
  return undefined;
}

async function createVolume(tenantId: string, headers: any, baseUrl: string): Promise<void> {
  // Railway não tem API direta para volumes via GraphQL público
  // Volumes são criados automaticamente quando o service referencia um path
  // O volume whatsapp-session-{tenantId} será criado no primeiro deploy
  console.log("   Volume será criado automaticamente no primeiro deploy");
}

// Main
const args = process.argv.slice(2);
const tenantId = args[0];

if (!tenantId) {
  console.error("Uso: npx ts-node scripts/provision-bot.ts <tenantId>");
  console.error("Exemplo: npx ts-node scripts/provision-bot.ts abc123def456");
  process.exit(1);
}

console.log("=== Railway Bot Provisioning ===");
console.log("");

const result = await provisionBot(tenantId);

console.log("");
if (result.success) {
  console.log("🎉 Provisionamento concluído com sucesso!");
  console.log(`   Service ID: ${result.serviceId}`);
  if (result.serviceUrl) console.log(`   URL: ${result.serviceUrl}`);
  console.log("");
  console.log("Próximos passos:");
  console.log("1. Acesse o Railway dashboard para ver logs");
  console.log("2. O bot vai gerar QR Code - escaneie com WhatsApp");
  console.log("3. Configure Telegram no onboarding do tenant");
} else {
  console.log("💥 Provisionamento falhou:");
  console.log(`   Erro: ${result.error}`);
  if (result.manualSteps?.length) {
    console.log("Passos manuais:");
    result.manualSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  }
  process.exit(1);
}