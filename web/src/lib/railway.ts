/**
 * Railway API Client — Para provisionar/gerenciar bots multi-tenant.
 * 
 * Em produção: usa Railway API (requer RAILWAY_TOKEN)
 * Em desenvolvimento: usa fallback local (chama bot manager via HTTP local)
 */

import { createModuleLogger } from "./logger";

const log = createModuleLogger("RailwayClient");

interface RailwayService {
  id: string;
  name: string;
  status: string;
  url?: string;
}

interface ProvisionResult {
  success: boolean;
  serviceId?: string;
  serviceUrl?: string;
  qrCode?: string;
  error?: string;
  manualSteps?: string[];
}

class RailwayClient {
  private token: string | undefined;
  private baseUrl = "https://backboard.railway.app/graphql/v2";
  private projectId: string | undefined;

  constructor() {
    this.token = process.env.RAILWAY_TOKEN;
    this.projectId = process.env.RAILWAY_PROJECT_ID;
  }

  private async graphql(query: string, variables?: Record<string, any>): Promise<any> {
    if (!this.token) {
      throw new Error("RAILWAY_TOKEN não configurado");
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
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

  async createService(tenantId: string, envVars: Record<string, string>): Promise<ProvisionResult> {
    const serviceName = `renda-extra-${tenantId.slice(0, 8)}`;

    const mutation = `
      mutation CreateService($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          status
        }
      }
    `;

    const variables = {
      input: {
        projectId: this.projectId,
        name: serviceName,
        source: {
          repo: "https://github.com/odcolares/RendaExtraCupuns",
          branch: "main",
          dockerfilePath: "./Dockerfile",
        },
        envVars: Object.entries(envVars).map(([key, value]) => ({ key, value })),
      },
    };

    try {
      const result = await this.graphql(mutation, variables);
      const service = result.serviceCreate;
      
      const serviceUrl = await this.waitForServiceReady(service.id);
      
      return {
        success: true,
        serviceId: service.id,
        serviceUrl,
      };
    } catch (error) {
      log.error("Falha ao criar service Railway", { tenantId, error: (error as Error).message });
      return {
        success: false,
        error: (error as Error).message,
        manualSteps: [
          "Crie service manualmente no Railway dashboard",
          `Nome: ${serviceName}`,
          "Dockerfile: ./Dockerfile",
          "Env vars: ver docs/PHASE2_BOT_RUNBOOK.md",
        ],
      };
    }
  }

  async startService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const mutation = `
        mutation ServiceStart($id: ID!) {
          serviceStart(id: $id) { id status }
        }
      `;
      await this.graphql(mutation, { id: serviceId });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async stopService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const mutation = `
        mutation ServiceStop($id: ID!) {
          serviceStop(id: $id) { id status }
        }
      `;
      await this.graphql(mutation, { id: serviceId });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async restartService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.stopService(serviceId);
      await new Promise(r => setTimeout(r, 3000));
      return this.startService(serviceId);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getServiceStatus(serviceId: string): Promise<{ status: string; url?: string } | null> {
    try {
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
      const result = await this.graphql(query, { id: serviceId });
      const service = result.service;
      return {
        status: service.status,
        url: service.domains?.[0]?.url,
      };
    } catch {
      return null;
    }
  }

  async deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const mutation = `
        mutation ServiceDelete($id: ID!) {
          serviceDelete(id: $id) { id }
        }
      `;
      await this.graphql(mutation, { id: serviceId });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Métodos para compatibilidade com LocalBotClient (chamam API do bot via HTTP)
  private async callBotApi(endpoint: string, method = "GET", body?: any): Promise<any> {
    const botUrl = process.env.BOT_MANAGER_URL || "http://localhost:3001";
    const response = await fetch(`${botUrl}/api/bot${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  }

  async provisionBot(tenantId: string): Promise<ProvisionResult> {
    return this.callBotApi("/provision", "POST", { tenantId });
  }

  async getQrCode(tenantId: string): Promise<{ qrCode: string | null; error?: string }> {
    return this.callBotApi(`/qrcode?tenantId=${tenantId}`);
  }

  async getStatus(tenantId: string): Promise<any> {
    return this.callBotApi(`/status?tenantId=${tenantId}`);
  }

  async startBot(tenantId: string): Promise<{ success: boolean; error?: string }> {
    return this.callBotApi("/start", "POST", { tenantId });
  }

  async stopBot(tenantId: string): Promise<{ success: boolean; error?: string }> {
    return this.callBotApi("/stop", "POST", { tenantId });
  }

  async restartBot(tenantId: string): Promise<{ success: boolean; error?: string }> {
    return this.callBotApi("/restart", "POST", { tenantId });
  }

  async testTelegram(tenantId: string): Promise<{ success: boolean; error?: string }> {
    return this.callBotApi("/test-telegram", "POST", { tenantId });
  }

  async syncFontes(tenantId: string): Promise<{ synced: number; error?: string }> {
    return this.callBotApi("/sync-fontes", "POST", { tenantId });
  }

  private async waitForServiceReady(serviceId: string, maxAttempts = 30): Promise<string | undefined> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getServiceStatus(serviceId);
      if (status?.status === "RUNNING" && status?.url) {
        return status.url;
      }
      await new Promise(r => setTimeout(r, 10000));
    }
    return undefined;
  }
}

// Fallback local para desenvolvimento
class LocalBotClient {
  private baseUrl = "http://localhost:3001"; // Porta do bot manager local

  async provisionBot(tenantId: string): Promise<ProvisionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      return response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getQrCode(tenantId: string): Promise<{ qrCode: string | null; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/qrcode?tenantId=${tenantId}`);
      return response.json();
    } catch {
      return { qrCode: null, error: "Bot manager não acessível" };
    }
  }

  async getStatus(tenantId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/status?tenantId=${tenantId}`);
      return response.json();
    } catch {
      return null;
    }
  }

  async startBot(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      return response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async stopBot(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      return response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async restartBot(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      return response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async testTelegram(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/test-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      return response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async syncFontes(tenantId: string): Promise<{ synced: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/sync-fontes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      return response.json();
    } catch (error) {
      return { synced: 0, error: (error as Error).message };
    }
  }
}

// Exporta instância apropriada baseada no ambiente
export const botClient = process.env.RAILWAY_TOKEN && process.env.RAILWAY_PROJECT_ID
  ? new RailwayClient()
  : new LocalBotClient();

export type { ProvisionResult };