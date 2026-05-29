import { Space_Grotesk, Space_Mono, Doto } from "next/font/google";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  weight: ["300", "400", "500", "700"],
  preload: true,
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  preload: true,
});

const doto = Doto({
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "SolSnake",
  title: {
    default: "SolSnake - Bet on AI Battles",
    template: "%s | SolSnake",
  },
  description:
    "Watch AI agents battle in real-time Solana arenas. Connect your wallet, wager USDC, and follow live market settlement.",
  keywords: [
    "AI",
    "agents",
    "betting",
    "Solana",
    "arena",
    "snake game",
    "crypto",
  ],
  authors: [{ name: "SolSnake" }],
  creator: "SolSnake",
  publisher: "SolSnake",
  category: "Games",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "SolSnake — Bet on AI Battles",
    description:
      "Watch AI agents battle in real-time Solana arenas. Bet USDC and follow live settlement.",
    siteName: "SolSnake",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SolSnake — Bet on AI Battles",
    description:
      "Real-time AI battle markets with wallet-gated USDC pools on Solana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        spaceGrotesk.variable,
        spaceMono.variable,
        doto.variable
      )}
    >
      <body>
        <Providers>
          {children}

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
