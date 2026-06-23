/**
 * CLI Mode — Inserção manual de ofertas via terminal.
 *
 * Permite colar mensagens de oferta, visualizar preview
 * e publicar manualmente no Telegram, sem depender do WhatsApp.
 *
 * Fluxo:
 *   1. Cole a mensagem da oferta (com link do produto)
 *   2. Sistema extrai nome, preço, plataforma, desconto
 *   3. Preview é exibido com todos os dados
 *   4. Confirma se deseja publicar (s/N)
 *   5. Pipeline executado: extrair → afiliado → Telegram → DB
 *
 * Uso:
 *   npm run cli
 */

import * as readline from "readline";
import { initDatabase, closeDatabase } from "./database/index";
import { loadConfig } from "./config";
import { createModuleLogger } from "./utils";
import { processOffer } from "./processor";
import { extractOfferData } from "./whatsapp/extractor";
import { extractLinksFromMessage } from "./whatsapp/parser";
import { getStats, getRecentOffers, isDuplicate } from "./database/offers";
import { formatBRL, fetchProductInfo } from "./utils";
import { initializeBot, launchBot, stopBot, getBot } from "./telegram/bot";
import { setupCommands } from "./telegram/commands";
import type { WhatsAppOfferData } from "./whatsapp/types";
import type { FetchedProductInfo } from "./utils/product-fetcher";

const log = createModuleLogger("CLI");

// ==============================================================
// Estado da CLI
// ==============================================================

interface CliState {
  lastMessage: string | null;
  lastUrl: string | null;
  lastExtracted: WhatsAppOfferData | null;
  /** Dados enriquecidos via fetch da URL (nome, descrição, imagem) */
  fetchedInfo: FetchedProductInfo | null;
}

const state: CliState = {
  lastMessage: null,
  lastUrl: null,
  lastExtracted: null,
  fetchedInfo: null,
};

// ==============================================================
// UI Helpers — cores ANSI
// ==============================================================

const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";
const RESET = "\x1b[0m";

function printHeader(): void {
  console.clear();
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║     RendaExtraCupuns — Modo de Inserção CLI     ║${RESET}`);
  console.log(`${BOLD}${CYAN}║   Insira ofertas manualmente (sem WhatsApp)     ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}`);
  console.log();
}

function printHelp(): void {
  console.log(`${BOLD}COMANDOS DISPONÍVEIS:${RESET}`);
  console.log();
  console.log(`  ${GREEN}<mensagem da oferta>${RESET}   Colar/inserir uma oferta para análise`);
  console.log(`  ${GREEN}preview${RESET}               Ver preview da última oferta analisada`);
  console.log(`  ${GREEN}publish${RESET}               Publicar a última oferta analisada`);
  console.log(`  ${GREEN}stats${RESET}                 Ver estatísticas do banco de dados`);
  console.log(`  ${GREEN}recent${RESET}                Ver ofertas recentes`);
  console.log(`  ${GREEN}help${RESET}                  Mostrar esta ajuda`);
  console.log(`  ${GREEN}exit${RESET} ou ${GREEN}quit${RESET}         Sair da CLI`);
  console.log();
}

function printPreview(offer: WhatsAppOfferData): void {
  const fetched = state.fetchedInfo;

  console.log();
  console.log(`${BOLD}${CYAN}┌────────────────── PREVIEW ──────────────────┐${RESET}`);
  console.log();

  // Nome: usa fetched se disponível, senão o extraído do texto
  const productName = fetched?.name || offer.name;
  const nameSource = fetched?.name
    ? `${GRAY}(via link)${RESET}`
    : `${GRAY}(via texto)${RESET}`;
  console.log(`  ${BOLD}Produto:${RESET}     ${productName} ${nameSource}`);

  // Descrição (só via fetch)
  if (fetched?.description) {
    const desc =
      fetched.description.length > 80
        ? fetched.description.substring(0, 77) + "..."
        : fetched.description;
    console.log(`  ${BOLD}Descrição:${RESET}   ${GRAY}${desc}${RESET}`);
  }

  // Imagem
  if (fetched?.imageUrl) {
    console.log(`  ${BOLD}Imagem:${RESET}       ${GRAY}${fetched.imageUrl.substring(0, 60)}...${RESET}`);
  }

  console.log(`  ${BOLD}Plataforma:${RESET}  ${offer.platform || "desconhecida"}`);

  // Preços: prefere fetched, fallback para extraído do texto
  const currentPrice = fetched?.price ?? offer.currentPrice;
  const originalPrice = fetched?.originalPrice ?? offer.originalPrice;

  if (originalPrice !== null) {
    console.log(`  ${BOLD}Preço original:${RESET} ${formatBRL(originalPrice)}${fetched?.originalPrice ? ` ${GRAY}(via link)${RESET}` : ""}`);
  }
  if (currentPrice !== null) {
    console.log(`  ${BOLD}Preço atual:${RESET}    ${formatBRL(currentPrice)}${fetched?.price ? ` ${GRAY}(via link)${RESET}` : ""}`);
  }
  if (offer.discount !== null && offer.discount !== undefined) {
    console.log(`  ${BOLD}Desconto:${RESET}      ${offer.discount}%`);
  }
  if (offer.originalUrl) {
    console.log(`  ${BOLD}URL:${RESET}          ${offer.originalUrl}`);
  }
  console.log();

  if (offer.originalUrl && isDuplicate(offer.originalUrl)) {
    console.log(`  ${YELLOW}⚠ Esta URL já existe no banco (duplicada)${RESET}`);
  }

  console.log(`${BOLD}${CYAN}└──────────────────────────────────────────────┘${RESET}`);
  console.log();
}

function printStats(): void {
  const stats = getStats();
  console.log();
  console.log(`${BOLD}${CYAN}┌─────────────── ESTATÍSTICAS ───────────────┐${RESET}`);
  console.log();
  console.log(`  ${BOLD}Total de ofertas:${RESET}  ${stats.total}`);
  console.log(`  ${BOLD}Publicadas:${RESET}       ${stats.published}`);
  console.log(`  ${BOLD}Pendentes:${RESET}        ${stats.pending}`);
  console.log();

  if (Object.keys(stats.byPlatform).length > 0) {
    console.log(`  ${BOLD}Por plataforma:${RESET}`);
    for (const [platform, count] of Object.entries(stats.byPlatform)) {
      console.log(`    ${platform}: ${count}`);
    }
  }

  console.log(`${BOLD}${CYAN}└──────────────────────────────────────────────┘${RESET}`);
  console.log();
}

function printRecent(): void {
  const offers = getRecentOffers(10);
  console.log();
  console.log(`${BOLD}${CYAN}┌────────── OFERTAS RECENTES ──────────┐${RESET}`);
  console.log();

  if (offers.length === 0) {
    console.log(`  ${YELLOW}Nenhuma oferta cadastrada ainda.${RESET}`);
  } else {
    for (const offer of offers) {
      const pub = offer.published ? `${GREEN}✓${RESET}` : `${YELLOW}─${RESET}`;
      const name = offer.name.substring(0, 45).padEnd(47, " ");
      console.log(`  ${pub} ${BOLD}${name}${RESET} ${GRAY}${offer.platform}${RESET}`);
    }
  }

  console.log(`${BOLD}${CYAN}└──────────────────────────────────────┘${RESET}`);
  console.log();
}

function printResult(success: boolean, error?: string): void {
  if (success) {
    console.log(`  ${GREEN}✅ Oferta processada com sucesso!${RESET}`);
  } else if (error === "duplicate") {
    console.log(`  ${YELLOW}⚠ Oferta duplicada — já existe no banco.${RESET}`);
  } else {
    console.log(`  ${RED}❌ Falha no processamento: ${error || "erro desconhecido"}${RESET}`);
  }
  console.log();
}

// ==============================================================
// Lógica principal
// ==============================================================

/**
 * Processa uma mensagem colada pelo usuário.
 * Extrai dados, mostra preview e pergunta se quer publicar.
 */
async function handleMessage(input: string): Promise<void> {
  const links = extractLinksFromMessage(input);

  if (links.length === 0) {
    console.log();
    console.log(`  ${YELLOW}⚠ Nenhum link de produto encontrado na mensagem.${RESET}`);
    console.log(`  ${GRAY}A mensagem precisa conter um link de produto${RESET}`);
    console.log(`  ${GRAY}(Amazon, AliExpress, Shopee, Mercado Livre).${RESET}`);
    console.log();
    return;
  }

  const url = links[0];

  if (links.length > 1) {
    console.log();
    console.log(`  ${YELLOW}⚠ ${links.length} links encontrados. Usando o primeiro:${RESET}`);
    console.log(`  ${GRAY}${url}${RESET}`);
    console.log();
  }

  // Extrair dados da oferta a partir do texto
  const extracted = extractOfferData(input, url);

  // Salvar no estado
  state.lastMessage = input;
  state.lastUrl = url;
  state.lastExtracted = extracted;

  // Buscar informações do produto diretamente da URL (enriquecimento)
  console.log();
  console.log(`  ${GRAY}🔍 Buscando dados do produto pelo link...${RESET}`);
  const fetched = await fetchProductInfo(url);
  state.fetchedInfo = fetched;

  if (fetched.name) {
    console.log(`  ${GREEN}✅ Dados enriquecidos via link: ${fetched.name.substring(0, 50)}${RESET}`);
  } else {
    console.log(`  ${YELLOW}⚠ Não foi possível buscar dados pelo link (usando apenas texto)${RESET}`);
  }

  // Mostrar preview com dados enriquecidos
  console.log();
  printPreview(extracted);

  // Perguntar se quer publicar
  await askPublish();
}

/**
 * Pergunta ao usuário se deseja publicar a última oferta analisada.
 */
function askPublish(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`  ${BOLD}Publicar oferta?${RESET} (${GREEN}s${RESET}/N) `, async (answer) => {
      rl.close();

      const normalized = answer.trim().toLowerCase();

      if (normalized === "s" || normalized === "sim" || normalized === "y" || normalized === "yes") {
        if (!state.lastMessage || !state.lastUrl) {
          console.log(`  ${RED}❌ Nenhuma oferta para publicar.${RESET}`);
          console.log();
          resolve();
          return;
        }

        console.log(`  ${YELLOW}⏳ Processando oferta...${RESET}`);
        const result = await processOffer(
          state.lastMessage,
          state.lastUrl,
          state.fetchedInfo?.imageUrl || undefined
        );
        printResult(result.success, result.error);
      } else {
        console.log(`  ${GRAY}Publicação cancelada.${RESET}`);
        console.log();
      }

      resolve();
    });
  });
}

// ==============================================================
// Inicialização e loop principal
// ==============================================================

async function main(): Promise<void> {
  printHeader();

  // ── Inicializar módulos ──
  console.log(`  ${YELLOW}⏳ Inicializando...${RESET}`);

  // Config
  try {
    loadConfig();
    console.log(`  ${GREEN}✅ Configuração carregada${RESET}`);
  } catch {
    console.log(`  ${YELLOW}⚠ Configuração não encontrada (ok — .env é opcional no CLI)${RESET}`);
  }

  // Database
  try {
    await initDatabase();
    console.log(`  ${GREEN}✅ Banco de dados SQLite inicializado${RESET}`);
  } catch (err) {
    console.log(`  ${RED}❌ Falha ao inicializar banco: ${(err as Error).message}${RESET}`);
    process.exit(1);
  }

  // Telegram Bot (para publicar ofertas no canal)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    try {
      initializeBot(token);
      launchBot();
      console.log(`  ${GREEN}✅ Bot Telegram conectado${RESET}`);
    } catch (err) {
      console.log(`  ${YELLOW}⚠ Bot Telegram não iniciado: ${(err as Error).message}${RESET}`);
      console.log(`  ${GRAY}   A publicação no Telegram não estará disponível.${RESET}`);
    }
  } else {
    console.log(`  ${YELLOW}⚠ TELEGRAM_BOT_TOKEN não definido — sem publicação no Telegram${RESET}`);
  }

  console.log();
  printHelp();

  // ── Interface readline ──
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${CYAN}oferta>${RESET} `,
  });

  rl.prompt();

  rl.on("line", async (line: string) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // ── Comandos ──

    if (input === "exit" || input === "quit" || input === "sair") {
      console.log(`\n  ${GREEN}Até mais! 👋${RESET}\n`);
      rl.close();
      return;
    }

    if (input === "help" || input === "h" || input === "?") {
      printHelp();
      rl.prompt();
      return;
    }

    if (input === "preview" || input === "p") {
      if (state.lastExtracted) {
        printPreview(state.lastExtracted);
      } else {
        console.log(`  ${YELLOW}⚠ Nenhuma oferta analisada ainda. Cole uma mensagem primeiro.${RESET}`);
        console.log();
      }
      rl.prompt();
      return;
    }

    if (input === "publish" || input === "pub") {
      if (state.lastMessage && state.lastUrl) {
        console.log(`  ${YELLOW}⏳ Processando oferta...${RESET}`);
        const result = await processOffer(
          state.lastMessage,
          state.lastUrl,
          state.fetchedInfo?.imageUrl || undefined
        );
        printResult(result.success, result.error);
      } else {
        console.log(`  ${YELLOW}⚠ Nenhuma oferta para publicar. Cole uma mensagem primeiro.${RESET}`);
        console.log();
      }
      rl.prompt();
      return;
    }

    if (input === "stats") {
      printStats();
      rl.prompt();
      return;
    }

    if (input === "recent" || input === "r") {
      printRecent();
      rl.prompt();
      return;
    }

    // ── Se não é comando, assume que é mensagem de oferta ──
    await handleMessage(input);
    rl.prompt();
  });

  rl.on("close", async () => {
    if (getBot()) {
      await stopBot();
    }
    await closeDatabase();
    console.log(`  ${GRAY}Banco de dados salvo em disco.${RESET}`);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`${RED}Erro fatal:${RESET}`, err);
  process.exit(1);
});
