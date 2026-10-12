#!/bin/bash
# docker-entrypoint.sh - Entry point para container do bot multi-tenant

set -e

echo "=== RendaExtraCupuns Bot Container ==="
echo "TENANT_ID: ${TENANT_ID}"

# Valida TENANT_ID
if [ -z "$TENANT_ID" ]; then
  echo "ERRO: TENANT_ID não definido"
  exit 1
fi

# Cria diretório de sessão se não existir
mkdir -p /data/whatsapp-sessions

# Configura caminho da sessão baseado no tenant
export WHATSAPP_SESSION_PATH="/data/whatsapp-sessions/${TENANT_ID}"

echo "Iniciando bot para tenant: $TENANT_ID"
echo "Session path: $WHATSAPP_SESSION_PATH"

# Executa o bot
exec node dist/bot/entrypoint.js --tenant-id="$TENANT_ID"