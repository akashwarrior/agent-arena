"use client";

import { ThemeProvider } from "next-themes";
import { SolanaProvider } from "@solana/react-hooks";
import { createClient, autoDiscover } from "@solana/client";
import type { ClusterMoniker } from "@solana/client";

type ProvidersProps = Readonly<{
  children: React.ReactNode;
  solanaCluster: ClusterMoniker;
}>;

export function Providers({ children, solanaCluster }: ProvidersProps) {
  const client = createClient({
    cluster: solanaCluster,
    walletConnectors: autoDiscover(),
    commitment: "processed",
  });

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SolanaProvider client={client}>{children}</SolanaProvider>
    </ThemeProvider>
  );
}
