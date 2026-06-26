# 🔗 Afiliados - Programas e Integrações

## Visão Geral

Módulo responsável por gerar links de afiliado automaticamente para diferentes plataformas (Amazon, Mercado Livre, AliExpress, Shopee).

---

## Sumário

1. [Objetivo](#objetivo)
2. [Plataformas Disponíveis](#plataformas-disponíveis)
3. [Configuração](#configuração)
4. [Implementação](#implementação)
5. [Rastreamento](#rastreamento)
6. [Otimização](#otimização)

---

## Objetivo

- ✅ Amazon Afiliados cadastrado (tag: odcolares2026-20)
- ✅ **Mercado Livre Afiliados (ID: 88981950)**
- ✅ **Mercado Livre OAuth (API Search — contorna 403 do PolicyAgent)**
- ✅ **AliExpress** — Sem ID, mas pipeline não trava (fallback link direto)
- ✅ **AliExpress Afiliados — ID configurado: RendaExtraCupuns** 🎉
- ✅ **Shopee Afiliados (ID: 18387911117)**
- ✅ Gerar links automaticamente
- ✅ Validar links antes de publicar
- ✅ Busca automática via API Mercado Livre (fallback quando link é página social)
- ✅ Rastrear cliques e conversões
- ✅ Maximizar comissões

---

## Plataformas Disponíveis

### 1. Amazon Afiliados

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Amazon Associates |
| **Comissão** | 1-10% (varia por categoria) |
| **Cookie** | 24 horas |
| **Pagamento** | Transferência bancária |
| **Mínimo** | R$ 100 para sacar |

#### Como se cadastrar

```
1. Acesse: afiliados.amazon.com.br
2. Clique em "Associar-se agora"
3. Preencha dados pessoais
4. Adicione site/blog (pode ser rede social)
5. Aguarde aprovação (1-3 dias)
6. Gere seu tag de afiliado
```

#### Formato do Link

```
Original:
https://www.amazon.com.br/dp/B0BJLXMVMV

Com afiliado:
https://www.amazon.com.br/dp/B0BJLXMVMV?tag=seusite-20
```

#### Categorias e Comissões

| Categoria | Comissão |
|-----------|----------|
| Eletrônicos | 1-3% |
| Informática | 2-4% |
| Casa & Cozinha | 3-5% |
| Moda | 3-5% |
| Beleza | 3-5% |
| Livros | 4-6% |
| Games | 2-4% |

---

### 2. AliExpress

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | AliExpress Affiliate Program |
| **Comissão** | 3-9% |
| **Cookie** | 3 dias |
| **Pagamento** | PayPal ou transferência |
| **Mínimo** | US$ 10 para sacar |
| **Status** | ✅ Pipeline pronto — sem ID, fallback para link direto |

#### Como se cadastrar

```
1. Acesse: portals.aliexpress.com
2. Clique em "Become an Affiliate"
3. Preencha formulário
4. Aguarde aprovação (1-5 dias)
5. Acesse dashboard
6. Gere links de afiliado
```

> ⚠️ **Sem ID de afiliado?** O pipeline não trava. `generateAliExpressLink()` extrai o product ID da URL e retorna um link direto. Quando você obtiver o ID, basta preencher `ALIEXPRESS_AFFILIATE_ID` no `.env`.
>
> 🔄 **Resolução de URLs curtas**: AliExpress usa URLs curtas como `s.click.aliexpress.com/e/_XXXXX`. O código `resolveAliExpressShortUrl()` em `aliexpress.ts` segue o redirect HTTP e extrai o productId da URL final (formato `/item/{id}.html`).

#### Formato do Link

```
Original (produto):
https://www.aliexpress.com/item/100500384912345.html

Curto:
https://s.click.aliexpress.com/e/_AXQ7a9M
(redirect → https://www.aliexpress.com/item/100500384912345.html)

Com afiliado:
https://s.click.aliexpress.com/e/_AXQ7a9M?productId={id}&aff_id=SEU_ID

Sem ID (fallback atual):
https://www.aliexpress.com/item/100500384912345.html
```

---

### 3. Shopee

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Shopee Afiliados |
| **Comissão** | 5-10% |
| **Cookie** | 7 dias |
| **Pagamento** | Transferência bancária |
| **Mínimo** | R 50 para sacar |
| **Status** | ✅ **Ativo — ID 18387911117 configurado!** Link com `?af_id=18387911117` |

#### Como se cadastrar

```
1. Acesse: shopee.com.br/afiliados
2. Clique em "Quero ser afiliado"
3. Preencha dados
4. Aguarde aprovação (1-3 dias)
5. Acesse hub de afiliados
6. Gere links
```

> ✅ **Shopee Afiliados configurado!** ID **18387911117** ativo. Links geram com `?af_id=18387911117`.
>
> 🔄 **Resolução de URLs curtas**: Shopee usa URLs curtas como `shp.ee/XXXXX` e `s.shopee.com.br/XXXXX`. O código `resolveShortUrl()` em `shopee.ts` segue o redirect HTTP (302) e extrai shopId+itemId da URL final resolvida. Também suporta o formato `/{texto}-i.{shopId}.{itemId}` (ex: `/opaanlp-i.12345.67890`). Query params no final (`?__mobile__=1&...`) são tolerados.

#### Formato do Link

```
Original (produto):
https://www.shopee.com.br/product/{shopId}/{itemId}
https://shopee.com.br/{texto}-i.{shopId}.{itemId}?params

Curto:
https://shp.ee/XXXXX
https://s.shopee.com.br/XXXXX

Com afiliado (✅ ativo):
https://shopee.com.br/product/{shopId}/{itemId}?af_id=18387911117
```

---

### 4. Mercado Livre

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Mercado Livre Afiliados |
| **Comissão** | 3-12% |
| **Cookie** | 24 horas |
| **Pagamento** | Mercado Pago |
| **Mínimo** | R$ 50 para sacar |

#### Como se cadastrar

```
1. Acesse: mercadolivre.com.br/afiliados
2. Clique em "Quero ser afiliado"
3. Preencha formulário
4. Aguarde aprovação (1-7 dias)
5. Acesse dashboard
6. Gere links
```

#### Formato do Link

```
Original:
https://www.mercadolivre.com.br/produto/123456

Com afiliado:
https://www.mercadolivre.com.br/produto/123456?matt_tool=123456
```

---

### 5. Mercado Livre — Busca via OAuth (Fallback)

Quando um link curto `meli.la` do Clube Kotas redireciona para a página social de afiliado (`/social/clubekotas`), não é possível extrair o product ID diretamente. O sistema usa **busca na API oficial do Mercado Livre** via OAuth como fallback.

#### Fluxo de Fallback

```
Link meli.la
    │
    ▼
resolveShortUrl() → URL final
    │
    ├─ Página de produto (/produto/XXX) → gera link afiliado direto
    │
    └─ Página social (/social/clubekotas) → FALLBACK
        │
        ▼
    searchMercadoLivreProduct(nome do produto)
        │
        ▼
    API /products/search?q=NOME
        │ Retorna: catalog_product_id
        ▼
    API /products/{catalog_product_id}/items
        │ Retorna: item_id + price (primeiro seller ativo)
        ▼
    Gera link afiliado: https://www.mercadolivre.com.br/produto/{item_id}?matt_tool={ID}
```

#### Por que não usar `/sites/MLB/search`?
O endpoint público `/sites/MLB/search` retorna **HTTP 403** mesmo com token de acesso — o PolicyAgent do ML bloqueia requisições de apps não certificados. A alternativa funcional:

1. **`/products/search?q=TERMO`** — busca no catálogo de produtos, retorna `catalog_product_id`
2. **`/products/{catalog_product_id}/items`** — retorna listings ativas com `item_id` e `price`

#### Configuração OAuth

```bash
# 1. Criar app no Mercado Livre DevCenter
#    https://developers.mercadolivre.com.br/
# 2. Executar script interativo:
node scripts/setup-ml-oauth.js
# 3. O script:
#    - Gera URL de autorização
#    - Inicia servidor local na porta 3000
#    - Captura código de autorização
#    - Troca por access_token + refresh_token
#    - Salva tokens no .env
```

#### Módulos

| Arquivo | Função |
|---------|--------|
| `mercadolivre-auth.ts` | `getValidToken()` — retorna token válido (refresh automático se expirado) |
| `mercadolivre-search.ts` | `searchMercadoLivreProduct()` — busca produto + retorna link afiliado |
| `setup-ml-oauth.js` | Script interativo OAuth (primeira configuração) |

#### Detalhes Técnicos

- **Token expira em**: 6 horas (3600 segundos)
- **Refresh token**: Single-use — código salva novo refresh_token no .env após cada refresh
- **Escopos necessários**: `read` + `offline_access`
- **Redirect URI**: `http://localhost:3000/oauth/callback` (via ngrok para HTTPS durante setup)
- **App ML**: `RendaExtraCupuns` (App ID: 2853473974069251)
- **Produto sem sellers**: retorna `"No winners found"` (404) → tratado como `null`

---

### 6. Magazine Luiza

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Magalu Afiliados |
| **Comissão** | 5-10% |
| **Cookie** | 7 dias |
| **Pagamento** | Transferência bancária |
| **Mínimo** | R$ 100 para sacar |

#### Como se cadastrar

```
1. Acesse: magalu.com.br/afiliados
2. Clique em "Quero ser afiliado"
3. Preencha dados
4. Aguarde aprovação
5. Acesse dashboard
6. Gere links
```

---

## Configuração

### Variáveis de Ambiente

```bash
# config/.env

# Amazon
AMAZON_AFFILIATE_TAG=seusite-20
AMAZON_MARKETPLACE=www.amazon.com.br

# AliExpress (opcional — pipeline funciona sem, usa link direto)
ALIEXPRESS_AFFILIATE_ID=SEU_ID

# Shopee (opcional — pipeline funciona sem, usa link direto)
SHOPEE_AFFILIATE_ID=SEU_ID

# Mercado Livre (afiliado)
MERCADOLIVRE_AFFILIATE_ID=SEU_ID

# Mercado Livre OAuth (para busca via API — obrigatório para fallback de páginas sociais)
ML_CLIENT_ID=SEU_APP_ID
ML_SECRET_KEY=SEU_SECRET_KEY
ML_ACCESS_TOKEN=token_gerado_pelo_oauth
ML_REFRESH_TOKEN=refresh_token_gerado_pelo_oauth
```

### Arquivo de Configuração

```json
// config/affiliates.json
{
  "amazon": {
    "enabled": true,
    "tag": "${AMAZON_AFFILIATE_TAG}",
    "marketplace": "${AMAZON_MARKETPLACE}",
    "defaultLink": "https://www.amazon.com.br"
  },
  "aliexpress": {
    "enabled": true,
    "affiliateId": "${ALIEXPRESS_AFFILIATE_ID}",
    "appKey": "${ALIEXPRESS_APP_KEY}"
  },
  "shopee": {
    "enabled": true,
    "affiliateId": "${SHOPEE_AFFILIATE_ID}",
    "appId": "${SHOPEE_APP_ID}",
    "secretKey": "${SHOPEE_SECRET_KEY}"
  },
  "mercadolivre": {
    "enabled": true,
    "affiliateId": "${MERCADOLIVRE_AFFILIATE_ID}",
    "appId": "${MERCadolivre_APP_ID}"
  }
}
```

---

## Implementação

### Estrutura de Diretórios

```
src/affiliates/
├── index.ts                 # Gerador unificado
├── types.ts                 # Platform, AffiliateLink
├── amazon.ts                # Amazon (ASIN + resolvedor amzn.to aprimorado)
├── aliexpress.ts            # AliExpress (graceful sem ID)
├── shopee.ts                # Shopee (graceful sem ID)
├── mercadolivre.ts          # Mercado Livre (links diretos)
├── mercadolivre-auth.ts     # OAuth: getValidToken + refresh automático
└── mercadolivre-search.ts   # API: /products/search + /products/{id}/items

scripts/
└── setup-ml-oauth.js        # Script interativo OAuth Mercado Livre
```

### Código Principal

#### Gerador Unificado

```typescript
// src/affiliates/index.ts
import { generateAmazonLink } from './amazon';
import { generateAliExpressLink } from './aliexpress';
import { generateShopeeLink } from './shopee';
import { generateMercadoLivreLink } from './mercadolivre';
import { AffiliateLink, Platform } from './types';

export async function generateAffiliateLink(
  url: string,
  platform: Platform
): Promise<AffiliateLink | null> {
  console.log(`🔗 Gerando link de afiliado para ${platform}...`);
  
  try {
    let result: AffiliateLink | null = null;
    
    switch (platform) {
      case 'amazon':
        result = await generateAmazonLink(url);
        break;
      case 'aliexpress':
        result = await generateAliExpressLink(url);
        break;
      case 'shopee':
        result = await generateShopeeLink(url);
        break;
      case 'mercadolivre':
        result = await generateMercadoLivreLink(url);
        break;
      default:
        console.error(`❌ Plataforma não suportada: ${platform}`);
        return null;
    }
    
    if (result) {
      console.log(`✅ Link gerado: ${result.affiliate}`);
    } else {
      console.log(`⚠️ Não foi possível gerar link para ${platform}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Erro ao gerar link:`, error);
    return null;
  }
}

export function detectPlatform(url: string): Platform | null {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('amazon')) return 'amazon';
  if (lowerUrl.includes('aliexpress')) return 'aliexpress';
  if (lowerUrl.includes('shopee')) return 'shopee';
  if (lowerUrl.includes('mercadolivre') || lowerUrl.includes('ml.uv')) return 'mercadolivre';
  if (lowerUrl.includes('magalu') || lowerUrl.includes('magazine luiza')) return 'magalu';
  
  return null;
}

export function hasAffiliateProgram(platform: Platform): boolean {
  const programs: Platform[] = ['amazon', 'aliexpress', 'shopee', 'mercadolivre', 'magalu'];
  return programs.includes(platform);
}
```

#### Amazon

```typescript
// src/affiliates/amazon.ts
import axios from 'axios';
import { AffiliateLink } from './types';

export async function generateAmazonLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // Extrair ASIN do produto
    const asin = extractASIN(productUrl);
    
    if (!asin) {
      console.log('❌ ASIN não encontrado na URL');
      return null;
    }
    
    // Construir link de afiliado
    const tag = process.env.AMAZON_AFFILIATE_TAG;
    const marketplace = process.env.AMAZON_MARKETPLACE || 'www.amazon.com.br';
    
    const affiliateUrl = `https://${marketplace}/dp/${asin}?tag=${tag}`;
    
    // Validar link
    const isValid = await validateAmazonLink(affiliateUrl);
    
    if (!isValid) {
      console.log('❌ Link de afiliado inválido');
      return null;
    }
    
    return {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: 'amazon',
      asin: asin
    };
    
  } catch (error) {
    console.error('Erro ao gerar link Amazon:', error);
    return null;
  }
}

function extractASIN(url: string): string | null {
  // Padrões de URL Amazon
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  
  return null;
}

async function validateAmazonLink(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      maxRedirects: 5,
      timeout: 5000
    });
    
    return response.status === 200;
  } catch {
    return false;
  }
}
```

#### AliExpress

```typescript
// src/affiliates/aliexpress.ts
import axios from 'axios';
import { AffiliateLink } from './types';

export async function generateAliExpressLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // Extrair ID do produto
    const productId = extractProductId(productUrl);
    
    if (!productId) {
      console.log('❌ Product ID não encontrado');
      return null;
    }
    
    // Construir link de afiliado
    const affiliateId = process.env.ALIEXPRESS_AFFILIATE_ID;
    const affiliateUrl = `https://s.click.aliexpress.com/e/_AXQ7a9M?productId=${productId}&aff_id=${affiliateId}`;
    
    return {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: 'aliexpress',
      productId: productId
    };
    
  } catch (error) {
    console.error('Erro ao gerar link AliExpress:', error);
    return null;
  }
}

function extractProductId(url: string): string | null {
  const patterns = [
    /\/item\/(\d+)\.html/i,
    /\/product\/(\d+)/i,
    /productId=(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}
```

#### Shopee

```typescript
// src/affiliates/shopee.ts
import axios from 'axios';
import { AffiliateLink } from './types';

export async function generateShopeeLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // Extrair dados do produto
    const productData = extractProductData(productUrl);
    
    if (!productData) {
      console.log('❌ Dados do produto não encontrados');
      return null;
    }
    
    // Construir link de afiliado
    const affiliateId = process.env.SHOPEE_AFFILIATE_ID;
    const affiliateUrl = `https://shopee.com.br/product/${productData.shopId}/${productData.itemId}?af_id=${affiliateId}`;
    
    return {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: 'shopee',
      shopId: productData.shopId,
      itemId: productData.itemId
    };
    
  } catch (error) {
    console.error('Erro ao gerar link Shopee:', error);
    return null;
  }
}

function extractProductData(url: string): { shopId: string; itemId: string } | null {
  const patterns = [
    /\/product\/(\d+)\/(\d+)/i,
    /\/(\d+)\/(\d+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        shopId: match[1],
        itemId: match[2]
      };
    }
  }
  
  return null;
}
```

#### Mercado Livre

```typescript
// src/affiliates/mercadolivre.ts
import axios from 'axios';
import { AffiliateLink } from './types';

export async function generateMercadoLivreLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // Extrair ID do produto
    const productId = extractProductId(productUrl);
    
    if (!productId) {
      console.log('❌ Product ID não encontrado');
      return null;
    }
    
    // Construir link de afiliado
    const affiliateId = process.env.MERCADOLIVRE_AFFILIATE_ID;
    const affiliateUrl = `https://www.mercadolivre.com.br/produto/${productId}?matt_tool=${affiliateId}`;
    
    return {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: 'mercadolivre',
      productId: productId
    };
    
  } catch (error) {
    console.error('Erro ao gerar link Mercado Livre:', error);
    return null;
  }
}

function extractProductId(url: string): string | null {
  const patterns = [
    /\/produto\/(\d+)/i,
    /\/product\/(\d+)/i,
    /MLB-?(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}
```

#### Types

```typescript
// src/affiliates/types.ts
export type Platform = 
  | 'amazon' 
  | 'aliexpress' 
  | 'shopee' 
  | 'mercadolivre' 
  | 'magalu';

export interface AffiliateLink {
  original: string;
  affiliate: string;
  platform: Platform;
  [key: string]: any;
}

export interface AffiliateConfig {
  amazon: {
    enabled: boolean;
    tag: string;
    marketplace: string;
  };
  aliexpress: {
    enabled: boolean;
    affiliateId: string;
  };
  shopee: {
    enabled: boolean;
    affiliateId: string;
  };
  mercadolivre: {
    enabled: boolean;
    affiliateId: string;
  };
}
```

---

## Rastreamento

### Métricas Importantes

| Métrica | Descrição |
|---------|-----------|
| **Cliques** | Quantas vezes clicaram no link |
| **Conversões** | Quantas compras realizadas |
| **Receita** | Valor total gerado |
| **Comissão** | Valor ganho |
| **ROI** | Retorno sobre investimento |

### Dashboard de Métricas

```typescript
// src/affiliates/metrics.ts
interface Metrics {
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversionRate: number;
}

export function calculateMetrics(
  clicks: number,
  conversions: number,
  averageOrderValue: number,
  commissionRate: number
): Metrics {
  const revenue = conversions * averageOrderValue;
  const commission = revenue * (commissionRate / 100);
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  
  return {
    clicks,
    conversions,
    revenue,
    commission,
    conversionRate
  };
}
```

### UTM Parameters

```
Para rastrear de onde vêm os cliques:

https://amazon.com.br/dp/XXX?tag=seusite-20&utm_source=telegram&utm_medium=bot&utm_campaign=ofertas
```

---

## Otimização

### Melhores Práticas

1. **Horários de pico**
   - 12h-14h (almoço)
   - 19h-22h (noite)
   - 8h-9h (manhã)

2. **Tipos de produto**
   - Eletrônicos: comissão baixa, alto volume
   - Moda: comissão média, sazonal
   - Casa: comissão boa, constante

3. **Formatação**
   - Use emojis para chamar atenção
   - Destaque o desconto
   - Crie urgência ("últimas unidades")

4. **A/B Testing**
   - Teste diferentes formatos
   - Meça conversão
   - Otimize baseado em dados

### Exemplo de Mensagem Otimizada

```
🔥 *50% OFF - ÚLTIMAS UNIDADES*

📱 iPhone 14 Pro Max

💰 De R$ 7.499 por *R$ 3.749*
🏷️ Economia de R$ 3.750

⚡ Essa oferta expira em 2 horas!

🔗 [COMPRAR AGORA →](link_afiliado)

📌 Link de afiliado
```

---

## Comandos

### Setup

```bash
# Instalar dependências
npm install axios cheerio

# Configurar variáveis
cp config/.env.example config/.env

# (Mercado Livre) Configurar OAuth para busca via API
node scripts/setup-ml-oauth.js
```

### Desenvolvimento

```bash
# Testar geração de links
npm run test:affiliates

# Verificar status das APIs
npm run affiliates:status
```

### Produção

```bash
# Monitorar métricas
npm run affiliates:metrics

# Exportar relatório
npm run affiliates:report
```

---

## Notas Importantes

### ⚠️ Avisos

1. **Não spamme** - Respeite limites de cada programa
2. **Valide links** - Sempre teste antes de publicar
3. **Transparência** - Informe que são links de afiliado
4. **Cookies** - Entenda como funciona o rastreamento

### ✅ Boas Práticas

1. **Diversifique** - Não dependa de uma plataforma só
2. **Monitore** - Acompanhe métricas regularmente
3. **Otimize** - Teste e melhore continuamente
4. **Documente** - Registre o que funciona

---

*Última atualização: 25/06/2026*
