/**
 * mercadolivre-auth.ts — Gerenciamento de autenticação OAuth do ML.
 *
 * Desde abril/2025, a API pública de busca do Mercado Livre exige
 * autenticação OAuth. Este módulo gerencia o token de acesso e
 * renovação automática via refresh token.
 *
 * Uso:
 *   const token = await getValidToken();
 *   axios.get('https://api.mercadolibre.com/sites/MLB/search', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 */

import axios from "axios";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("MercadoLivreAuth");

// Cache do token atual em memória
let cachedToken: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp em ms
} | null = null;

// ==============================================================
// Token Management
// ==============================================================

/**
 * Carrega o refresh token do ambiente (env ou cache).
 */
function getRefreshToken(): string {
  return process.env.ML_REFRESH_TOKEN || "";
}

/**
 * Carrega o client_id do ambiente.
 */
function getClientId(): string {
  return process.env.ML_CLIENT_ID || "";
}

/**
 * Carrega o client_secret do ambiente.
 */
function getClientSecret(): string {
  return process.env.ML_SECRET_KEY || "";
}

// ==============================================================
// Refresh Token
// ==============================================================

/**
 * Renova o access_token usando o refresh_token.
 * O refresh_token é single-use: a API devolve um novo a cada refresh.
 */
async function refreshAccessToken(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const refreshToken = getRefreshToken();
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  if (!refreshToken || !clientId || !clientSecret) {
    log.warn("Credenciais OAuth do ML não configuradas no .env", {
      hasToken: !!refreshToken,
      hasClientId: !!clientId,
      hasSecret: !!clientSecret,
    });
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    if (access_token && refresh_token) {
      log.info("Token ML renovado com sucesso", {
        expires_in: `${expires_in}s`,
      });

      // Atualiza o .env com o novo refresh_token
      updateEnvFile("ML_REFRESH_TOKEN", refresh_token);

      // Atualiza cache
      cachedToken = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (expires_in - 60) * 1000, // 1 minuto de margem
      };

      return { access_token, refresh_token, expires_in };
    }

    log.warn("Resposta inesperada do refresh token", { data: response.data });
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const msg = error.response.data?.error || "";
      log.error("Refresh token inválido ou expirado", {
        error: msg,
        hint: "Execute 'node scripts/setup-ml-oauth.js' para re-autorizar",
      });
    } else {
      log.error("Erro ao renovar token ML", {
        error: (error as Error).message,
      });
    }
    return null;
  }
}

/**
 * Atualiza uma chave no arquivo .env
 */
function updateEnvFile(key: string, value: string): void {
  try {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.resolve(__dirname, "../../config/.env");

    let env = "";
    try {
      env = fs.readFileSync(envPath, "utf-8");
    } catch {
      return; // .env não existe, ignora
    }

    const regex = new RegExp(`^${key}=.*`, "m");
    const line = `${key}=${value}`;

    if (regex.test(env)) {
      env = env.replace(regex, line);
    } else {
      env += `\n${line}`;
    }

    fs.writeFileSync(envPath, env, "utf-8");
  } catch {
    // Fallback silencioso - não crítico
  }
}

// ==============================================================
// Public API
// ==============================================================

/**
 * Retorna um access_token válido, renovando se necessário.
 *
 * @returns Access token string ou null se não configurado
 */
export async function getValidToken(): Promise<string | null> {
  // Verifica se o token em cache ainda é válido
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  // Tenta renovar
  const result = await refreshAccessToken();
  if (result) {
    return result.access_token;
  }

  // Fallback: usa o token salvo (pode estar expirado)
  const savedToken = process.env.ML_ACCESS_TOKEN;
  if (savedToken) {
    log.warn("Usando access_token salvo (pode estar expirado)");
    return savedToken;
  }

  return null;
}

/**
 * Verifica se as credenciais OAuth do ML estão configuradas.
 */
export function isConfigured(): boolean {
  return !!(getClientId() && getClientSecret() && getRefreshToken());
}

/**
 * Retorna um interceptor do axios para adicionar o bearer token
 * automaticamente em todas as requisições para api.mercadolibre.com.
 */
export function createAuthInterceptor(): {
  requestInterceptor: (config: any) => Promise<any>;
  responseInterceptor: (error: any) => Promise<any>;
} {
  const requestInterceptor = async (config: any) => {
    if (config.url?.includes("api.mercadolibre.com")) {
      const token = await getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  };

  const responseInterceptor = async (error: any) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url?.includes("api.mercadolibre.com")
    ) {
      // Token expirou, tenta renovar uma vez e retentar
      log.info("Token ML expirado (401), tentando renovar...");
      const result = await refreshAccessToken();
      if (result && error.config) {
        error.config.headers.Authorization = `Bearer ${result.access_token}`;
        return axios.request(error.config);
      }
    }
    throw error;
  };

  return { requestInterceptor, responseInterceptor };
}
