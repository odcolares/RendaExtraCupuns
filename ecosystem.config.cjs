/**
 * PM2 Ecosystem File - Produção
 *
 * Uso:
 *   pm2 start ecosystem.config.cjs          # Iniciar
 *   pm2 save && pm2 startup                 # Iniciar com o sistema
 *   pm2 logs renda-extra-cupuns             # Ver logs
 *   pm2 monit                               # Monitorar
 *
 * Requerimentos no servidor:
 *   node >= 18, npm, pm2, chromium (para whatsapp-web.js)
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "renda-extra-cupuns",
      script: "dist/index.js",
      cwd: __dirname,

      // —— Ambiente ——
      env: {
        NODE_ENV: "production",
        PUPPETEER_CHROMIUM_REVISION: "",
      },
      env_file: "./config/.env",

      // —— Logs ——
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,

      // —— Reinício ——
      watch: false, // Não monitorar mudanças em produção
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000, // 5s entre restart (fixo, previsivel)

      // —— Recursos ——
      max_memory_restart: "500M", // Reiniciar se >500MB
      instances: 1, // Single instance (whatsapp-web.js não suporta cluster)

      // —— Graceful Shutdown ——
      kill_timeout: 30000, // 30s para shutdown graceful (WhatsApp destroi + fecha DB)

      // —— Chrome/Chromium para whatsapp-web.js ——
      // Ajuste o path se o Chromium estiver em local diferente
    },
    {
      name: "renda-extra-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: path.join(__dirname, "web"),
      env: {
        NODE_ENV: "production",
      },
      // —— Reinício ——
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      // —— Recursos ——
      max_memory_restart: "800M",
      instances: 1,
      // —— Graceful Shutdown / Listen ——
      kill_timeout: 10000,
      listen_timeout: 30000,
      // —— Logs ——
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: path.join(__dirname, "logs", "web-error.log"),
      out_file: path.join(__dirname, "logs", "web-out.log"),
      merge_logs: true,
    },
  ],
};
