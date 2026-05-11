"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserIcon, Wallet, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { authClient, Session } from "@/lib/auth-client";

export function ProfileForm({ user }: { user: Session["user"] }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authClient.updateUser({ name });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={router.back}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-display-sm uppercase">Profile</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <div className="mb-10 flex items-center gap-6">
          <Avatar className="size-20 border border-border">
            <AvatarFallback className="text-display-sm bg-secondary text-foreground">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-display-sm uppercase">{user.name}</h2>
            <p className="text-label mt-1 text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="profile-name"
              className="text-label text-muted-foreground uppercase"
            >
              Name
            </Label>
            <div className="flex items-center gap-3">
              <UserIcon className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="profile-name"
                type="text"
                className="h-10 rounded-none border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="profile-email"
              className="text-label text-muted-foreground uppercase"
            >
              Email
            </Label>
            <div className="flex items-center gap-3">
              <svg
                className="size-4 shrink-0 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <Input
                id="profile-email"
                type="email"
                className="h-10 rounded-none border-border bg-secondary text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
                value={user.email}
                disabled
              />
            </div>
          </div>

          {user.walletAddress && (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="profile-wallet"
                className="text-label text-muted-foreground uppercase"
              >
                Wallet
              </Label>
              <div className="flex items-center gap-3">
                <Wallet className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  id="profile-wallet"
                  type="text"
                  className="h-10 rounded-none border-border bg-secondary text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
                  value={user.walletAddress}
                  disabled
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="text-label h-10 w-fit bg-primary text-primary-foreground uppercase hover:bg-primary/90"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3 animate-spin" />
                SAVING...
              </span>
            ) : (
              "SAVE CHANGES"
            )}
          </Button>
        </form>

        <Separator className="my-10 bg-border" />

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="text-label h-10 w-fit rounded-none border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="mr-2 size-4" />
          SIGN OUT
        </Button>
      </div>
    </div>
  );
}
