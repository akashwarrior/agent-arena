"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { USDC_MINT } from "@/lib/jupiter";
import { SlidingNumber } from "./ui/sliding-number";
import { TextShimmer } from "./ui/text-shimmer";
import { TOKEN_PROGRAM_ADDRESS } from "@solana/client";
import { useSplToken, useWalletConnection } from "@solana/react-hooks";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Loader2,
  Wallet,
  ChevronDown,
  Copy,
  LogOut,
  User,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function WalletButton() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    connectors,
    connect,
    disconnect,
    wallet,
    currentConnector,
    isReady,
    connected,
    connecting,
  } = useWalletConnection();

  const walletAddress = wallet?.account.address.toString();

  const { balance, isFetching } = useSplToken(USDC_MINT, {
    config: {
      decimals: 6,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    },
    owner: walletAddress,
    commitment: "processed",
    revalidateOnFocus: true,
  });

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
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

  const handleSelectConnector = async (connectorId: string) => {
    try {
      setIsDialogOpen(false);
      await connect(connectorId, { autoConnect: true });
    } catch {
      toast.error("Failed to connect wallet");
    }
  };

  const openConnectDialog = () => {
    if (!isReady) return;
    setIsDialogOpen(true);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        className="brutalist-button h-9 rounded-lg px-4 font-mono text-xs font-bold tracking-wide gap-2"
        onClick={connected ? handleCopyAddress : openConnectDialog}
        title={connected ? "Click to copy address" : "Connect your wallet"}
      >
        {connecting ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            CONNECTING
          </>
        ) : connected ? (
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
            {isFetching && (
              <TextShimmer>
                {String(Number(balance?.uiAmount || "0.00") + " USDC")}
              </TextShimmer>
            )}
            <span className={isFetching ? "hidden" : "flex items-center justify-center gap-1"}>
              <SlidingNumber
                value={Number(balance?.uiAmount || "0.00")}
              />
              USDC
            </span>
          </>
        ) : (
          "CONNECT WALLET"
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
            <DropdownMenuItem
              onClick={openConnectDialog}
              disabled={!isReady}
            >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="gap-5">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Select a wallet to connect to Agent Arena
            </DialogDescription>
          </DialogHeader>

          {connectors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Wallet className="size-8 text-muted-foreground" />
              <p className="font-mono text-xs text-muted-foreground">
                No wallet detected. Install a Solana wallet to continue.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {connectors.map((connector) => {
                return (
                  <button
                    key={connector.id}
                    type="button"
                    onClick={() => handleSelectConnector(connector.id)}
                    className="group flex items-center gap-3 border-2 border-border bg-background px-4 py-3 text-left transition-all hover:-translate-px hover:shadow-[3px_3px_0px_0px_var(--border)] active:translate-px active:shadow-[1px_1px_0px_0px_var(--border)]"
                  >
                    <div className="flex size-9 items-center justify-center border-2 border-border bg-card">
                      {connector.icon ? (
                        <Image
                          width={24}
                          height={24}
                          src={connector.icon}
                          alt={connector.name}
                          className="size-6"
                        />
                      ) : (
                        <Wallet className="size-4" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-mono text-sm font-bold text-foreground">
                        {connector.name}
                      </span>
                      {connector.ready && (
                        <span className="font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                          Detected
                        </span>
                      )}
                    </div>

                    <ChevronDown className="size-4 -rotate-90 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t-2 border-border pt-3">
            <p className="text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              By connecting, you agree to the Terms
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
