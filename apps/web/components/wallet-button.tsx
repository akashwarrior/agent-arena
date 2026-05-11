"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2, Wallet, ChevronDown, Copy, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function WalletButton() {
  const { publicKey, connecting, connected, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const short =
    publicKey?.toBase58().slice(0, 4) + "..." + publicKey?.toBase58().slice(-4);

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
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

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        className="text-label h-8.25 rounded-full px-5"
        onClick={connected ? handleCopyAddress : () => setVisible(true)}
        title={connected ? "Click to copy address" : "Connect your wallet"}
      >
        {connecting ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            CONNECTING
          </>
        ) : (
          <>
            {wallet?.adapter?.icon ? (
              <Image
                width={20}
                height={20}
                src={wallet.adapter.icon}
                alt="wallet-icon"
              />
            ) : (
              <Wallet className="size-3" />
            )}
            {connected ? short : "CONNECT"}
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon" variant="secondary" className="rounded-full">
              <ChevronDown className="size-3" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {connected ? (
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
            <DropdownMenuItem onClick={() => setVisible(true)}>
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
