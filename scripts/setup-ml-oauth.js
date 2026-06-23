/**
 * Script de setup do OAuth do Mercado Livre.
 *
 * GUIA RÁPIDO:
 * 1. Acesse https://developers.mercadolibre.com.br/
 * 2. Clique "Criar aplicação" (ou "Crear aplicación")
 * 3. Preencha:
 *    - Nome: "RendaExtraCupuns" (ou qualquer nome)
 *    - Descrição: "Bot de ofertas automático"
 *    - Site: deixe em branco
 *    - Redirect URI: http://localhost:3000/auth/ml-callback
 * 4. Após criar, copie o APP_ID e SECRET_KEY
 * 5. Execute este script e siga as instruções
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ENV_PATH = path.resolve(__dirname, "../config/.env");

// ==============================================================
// Helpers
// ==============================================================

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function updateEnv(key, value) {
  let env = "";
  try {
    env = fs.readFileSync(ENV_PATH, "utf-8");
  } catch {
    console.log("Arquivo .env não encontrado, criando novo.");
  }

  const regex = new RegExp(`^${key}=.*`, "m");
  const line = `${key}=${value}`;

  if (regex.test(env)) {
    env = env.replace(regex, line);
  } else {
    env += `\n${line}`;
  }

  fs.writeFileSync(ENV_PATH, env, "utf-8");
  console.log(`✅ ${key} salvo no .env`);
}

// ==============================================================
// Main
// ==============================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     Setup OAuth — Mercado Livre / RendaExtraCupuns   ║
╚══════════════════════════════════════════════════════╝
`);

  // Aceita argumentos da linha de comando: node setup-ml-oauth.js APP_ID SECRET_KEY
  let appId = process.argv[2];
  let secretKey = process.argv[3];

  if (!appId) {
    appId = await ask("Cole o APP_ID (client_id): ");
  }
  if (!appId) {
    console.log("❌ APP_ID obrigatório");
    process.exit(1);
  }

  if (!secretKey) {
    secretKey = await ask("Cole o SECRET_KEY (client_secret): ");
  }
  if (!secretKey) {
    console.log("❌ SECRET_KEY obrigatório");
    process.exit(1);
  }

  // Save credentials to .env
  updateEnv("ML_CLIENT_ID", appId);
  updateEnv("ML_SECRET_KEY", secretKey);

  console.log("\nPasso 2: Autorização — abra esta URL no navegador:");
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=https://brim-reputably-swimming.ngrok-free.dev/auth/ml-callback`;
  console.log(`\n${authUrl}\n`);

  console.log("Iniciando servidor temporário em http://localhost:3000...\n");
  console.log("Após autorizar, você será redirecionado para localhost.");
  console.log("O servidor vai capturar o código automaticamente.\n");

  // Start temporary server to capture the OAuth code
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost:3000");
      const authCode = url.searchParams.get("code");

      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html><body>
            <h2>✅ Código de autorização recebido!</h2>
            <p>Token sendo processado... Feche esta janela.</p>
            <script>window.close();</script>
          </body></html>
        `);
        server.close();
        resolve(authCode);
      } else {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html><body>
            <h2>⚠️ Nenhum código recebido</h2>
            <p>Redirecionamento inválido. Tente novamente.</p>
          </body></html>
        `);
      }
    });
    server.listen(3000, () => {});
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log("⚠️ Porta 3000 ocupada. Certifique-se de que o bot não está rodando.");
      }
      reject(err);
    });
  });

  console.log(`\n🔑 Código de autorização recebido!`);

  console.log("\nPasso 3: Trocando código por tokens...\n");

  try {
    const tokenResult = await request(
      {
        hostname: "api.mercadolibre.com",
        path: "/oauth/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      },
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: appId,
        client_secret: secretKey,
        code: code,
        redirect_uri: "https://brim-reputably-swimming.ngrok-free.dev/auth/ml-callback",
      }).toString()
    );

    if (tokenResult.status === 200 && tokenResult.body.access_token) {
      const { access_token, refresh_token, user_id } = tokenResult.body;
      console.log(`✅ Access Token obtido (válido por 6h)`);
      console.log(`✅ Refresh Token obtido (válido por 6 meses)`);
      console.log(`✅ User ID: ${user_id}`);

      updateEnv("ML_ACCESS_TOKEN", access_token);
      updateEnv("ML_REFRESH_TOKEN", refresh_token);

      console.log(`
╔══════════════════════════════════════════════════════╗
║  ✅  Setup concluído com sucesso!                    ║
║                                                     ║
║  Agora reinicie o bot para usar a API autenticada.   ║
╚══════════════════════════════════════════════════════╝
`);
    } else {
      console.log("❌ Erro ao obter tokens:");
      console.log(JSON.stringify(tokenResult.body, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.log("❌ Erro na requisição:", err.message);
    process.exit(1);
  }
}

main();
