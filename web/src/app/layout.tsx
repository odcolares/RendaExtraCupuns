import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RendaExtraCupuns — Automação de Ofertas para Afiliados",
  description:
    "Monitore grupos do WhatsApp, gere links de afiliado e publique no Telegram automaticamente. Tudo em um painel web simples e poderoso.",
  keywords: [
    "afiliados",
    "ofertas",
    "whatsapp",
    "telegram",
    "automacão",
    "renda extra",
    "amazon",
    "shopee",
    "mercado livre",
    "aliexpress",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
