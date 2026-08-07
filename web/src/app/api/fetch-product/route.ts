import { NextResponse } from "next/server";

type Platform = "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros";

interface ProductInfo {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  platform: Platform;
}

const ALLOWED_HOSTS = new Set([
  "www.amazon.com",
  "www.amazon.com.br",
  "amzn.to",
  "shopee.com.br",
  "mercadolivre.com.br",
  "www.mercadolivre.com.br",
  "meli.la",
  "aliexpress.com",
  "s.click.aliexpress.com",
]);

function isPrivateIp(host: string): boolean {
  if (/^(10|127|0)\./.test(host)) return true;
  if (host.startsWith("192.168.")) return true;
  if (host.startsWith("172.")) {
    const part = host.split(".")[1];
    const secondOctet = Number(part);
    return secondOctet >= 16 && secondOctet <= 31;
  }
  if (host === "localhost" || host === "[::1]") return true;
  return false;
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    if (isPrivateIp(parsed.hostname)) return false;
    if (ALLOWED_HOSTS.has(parsed.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url || !/^https?:\/\//i.test(url) || !isAllowedUrl(url)) {
      return NextResponse.json({ error: "URL inválida ou domínio não permitido." }, { status: 400 });
    }

    const product = await fetchProductInfo(url);
    if (!product) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: product });
  } catch {
    return NextResponse.json({ data: null });
  }
}

async function fetchProductInfo(url: string): Promise<ProductInfo | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return parseProductInfo(html, url);
  } catch {
    return null;
  }
}

function parseProductInfo(html: string, url: string): ProductInfo {
  const meta = (property: string) => {
    const patterns = [
      new RegExp(`<meta\\s+[^>]*property\\s*=\\s*["']${property}["'][^>]*content\\s*=\\s*["']([^"']+)["']`, "i"),
      new RegExp(`<meta\\s+[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*property\\s*=\\s*["']${property}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decodeHtmlEntities(match[1].trim());
    }
    return null;
  };

  const titleMeta = meta("og:title") || (() => {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!match) return null;
    let title = decodeHtmlEntities(match[1].trim());
    title = title.replace(/\s*[|–-]\s*.*$/, "").trim();
    return title || null;
  })();

  const description = meta("og:description") || meta("description");
  const imageUrl = meta("og:image");
  const platform = detectPlatform(url);
  const price = extractPrice(html, platform);

  return {
    name: titleMeta,
    description,
    imageUrl,
    price,
    platform,
  };
}

function detectPlatform(url: string): Platform {
  const lower = url.toLowerCase();
  if (lower.includes("amazon")) return "amazon";
  if (lower.includes("aliexpress")) return "aliexpress";
  if (lower.includes("shopee")) return "shopee";
  if (lower.includes("mercadolivre") || lower.includes("ml.uv")) return "mercadolivre";
  return "outros";
}

function extractPrice(html: string, platform: string): number | null {
  if (platform === "amazon") {
    const wholeMatch = html.match(/"a-price-whole"[^>]*>(\d[\d.,]*)</);
    const fractionMatch = html.match(/"a-price-fraction"[^>]*>(\d{2})</);
    if (wholeMatch) {
      const whole = wholeMatch[1].replace(/[.,]/g, "");
      const fraction = fractionMatch ? fractionMatch[1] : "00";
      return parseFloat(`${whole}.${fraction}`);
    }
  }

  if (platform === "mercadolivre") {
    const mlPrice = html.match(/andes-money-amount__fraction[^>]*>(\d[\d.,]*)</);
    if (mlPrice) {
      return parseFloat(mlPrice[1].replace(/\./g, "").replace(",", "."));
    }
  }

  if (platform === "shopee") {
    const spPrice = html.match(/"price"(?:\s*:|=>)\s*(\d+)/i);
    if (spPrice) {
      return parseInt(spPrice[1], 10) / 100000;
    }
  }

  const genericPrice = html.match(/["']price["'][^}]*?["']([\d.]+)["']/);
  if (genericPrice) {
    return parseFloat(genericPrice[1]);
  }

  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1), 10)));
}
