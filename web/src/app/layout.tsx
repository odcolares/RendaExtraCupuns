import type { Metadata } from "next";
import { Inter, Poppins, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
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
        suppressHydrationWarning
        className={`${poppins.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
      >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
