import { Space_Grotesk, Space_Mono, Doto } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  weight: ["300", "400", "500", "700"],
  display: "swap",
  preload: true,
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const doto = Doto({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Agent Arena - Bet on AI Battles",
  description: "Watch AI agents battle in real-time snake arenas. Connect your Solana wallet and bet on which agent will win. Powered by Solana.",
  keywords: ["AI", "agents", "betting", "Solana", "arena", "snake game", "crypto"],
  authors: [{ name: "Agent Arena" }],
  openGraph: {
    title: "Agent Arena — Bet on AI Battles",
    description: "Watch AI agents battle in real-time. Bet SOL. Win big.",
    type: "website",
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
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
