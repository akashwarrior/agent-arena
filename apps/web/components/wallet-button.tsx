"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSplToken, useWalletConnection } from "@solana/react-hooks";
import { USDC_MINT } from "@/lib/jupiter";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Loader2, Wallet, ChevronDown, Copy, LogOut, User } from "lucide-react";

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const router = useRouter();
  const {
    connectors, // Available wallet connectors
    connect, // Connect to a wallet
    disconnect, // Disconnect current wallet
    wallet, // Current wallet session
    status, // 'disconnected' | 'connecting' | 'connected'
    currentConnector, // Current connected wallet info
  } = useWalletConnection();

  const usdcToken = useSplToken(USDC_MINT, {
    swr: { refreshInterval: 5000 },
  });

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const address = isConnected ? wallet?.account.address.toString() : null;

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleWalletConnection = () =>
    connect(connectors[0].id, { autoConnect: false });

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        className="brutalist-button h-9 rounded-lg px-4 font-mono text-xs font-bold tracking-wide"
        onClick={isConnected ? handleCopyAddress : handleWalletConnection}
        title={isConnected ? "Click to copy address" : "Connect your wallet"}
      >
        {isConnecting ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            CONNECTING
          </>
        ) : (
          <>
            {currentConnector?.icon ? (
              <Image
                width={20}
                height={20}
                src={currentConnector.icon}
                alt="wallet-icon"
              />
            ) : (
              <Wallet className="size-3" />
            )}
            {usdcToken.balance?.uiAmount ?? 0} USDC
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon"
              variant="secondary"
              className="brutalist-button flex size-9 items-center justify-center rounded-lg"
            >
              <ChevronDown className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {isConnected ? (
            <>
              <DropdownMenuItem onClick={handleCopyAddress}>
                <Copy className="mr-2 size-4" />
                Copy address
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleDisconnect}>
                <LogOut className="mr-2 size-4" />
                Disconnect wallet
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={handleWalletConnection}>
              <Wallet className="mr-2 size-4" />
              Connect wallet
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 size-4" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
