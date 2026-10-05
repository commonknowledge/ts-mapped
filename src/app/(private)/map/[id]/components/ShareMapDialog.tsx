"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Switch } from "@/shadcn/ui/switch";
import type { RouterOutputs } from "@/services/trpc/react";

type ShareState = RouterOutputs["mapShare"]["get"];

// Matches the server's passwordSchema
const MIN_PASSWORD_LENGTH = 8;

/**
 * The Share button + popover in the private map navbar: enable/disable
 * the read-only link, set an optional password, copy the link, and reset
 * it. Distinct from Publish mode, which builds a public campaign site —
 * this shares the live private map view with a small audience.
 */
export default function ShareMapDialog({ mapId }: { mapId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: share, isPending: shareLoading } = useQuery(
    trpc.mapShare.get.queryOptions({ mapId }),
  );

  const [passwordEditing, setPasswordEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateShareCache = (data: ShareState) =>
    queryClient.setQueryData(trpc.mapShare.get.queryKey({ mapId }), data);

  const { mutate: enableShare, isPending: enabling } = useMutation(
    trpc.mapShare.enable.mutationOptions({
      onSuccess: (data) => updateShareCache(data),
      onError: () => toast.error("Failed to enable link sharing"),
    }),
  );
  const { mutate: disableShare, isPending: disabling } = useMutation(
    trpc.mapShare.disable.mutationOptions({
      onSuccess: (data) => updateShareCache(data),
      onError: () => toast.error("Failed to disable link sharing"),
    }),
  );
  const { mutate: setSharePassword, isPending: settingPassword } = useMutation(
    trpc.mapShare.setPassword.mutationOptions({
      onSuccess: (data, variables) => {
        updateShareCache(data);
        setPasswordEditing(false);
        setPassword("");
        toast.success(variables.password ? "Password set" : "Password removed");
      },
      onError: () => toast.error("Failed to update the password"),
    }),
  );
  const { mutate: regenerateToken, isPending: regenerating } = useMutation(
    trpc.mapShare.regenerateToken.mutationOptions({
      onSuccess: (data) => {
        updateShareCache(data);
        toast.success("Link reset. The old link no longer works.");
      },
      onError: () => toast.error("Failed to reset the link"),
    }),
  );

  const mutating = enabling || disabling || settingPassword || regenerating;
  const enabled = Boolean(share?.enabled);
  const hasPassword = Boolean(share?.hasPassword);
  const shareUrl =
    share && typeof window !== "undefined"
      ? `${window.location.origin}/share/${share.token}`
      : "";

  const onToggleLink = (checked: boolean) => {
    if (checked) {
      enableShare({ mapId });
    } else {
      disableShare({ mapId });
    }
  };

  const onTogglePassword = (checked: boolean) => {
    setPasswordError(null);
    setPassword("");
    if (checked) {
      setPasswordEditing(true);
      return;
    }
    setPasswordEditing(false);
    if (hasPassword) {
      setSharePassword({ mapId, password: null });
    }
  };

  const onSavePassword = () => {
    const trimmed = password.trim();
    if (trimmed.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
      return;
    }
    setPasswordError(null);
    setSharePassword({ mapId, password: trimmed });
  };

  const onCopyLink = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy the link");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2Icon />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Share this map</h2>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Read-only link</p>
            <p className="text-xs text-muted-foreground">
              Anyone with the link can view the live map, but not edit it.
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={shareLoading || mutating}
            onCheckedChange={onToggleLink}
            aria-label="Enable read-only link"
          />
        </div>

        {enabled && share && (
          <>
            <div className="flex flex-col gap-2 border-t pt-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">Require a password</p>
                <Switch
                  checked={hasPassword || passwordEditing}
                  disabled={mutating}
                  onCheckedChange={onTogglePassword}
                  aria-label="Require a password"
                />
              </div>
              {passwordEditing && (
                <>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={password}
                      autoFocus
                      placeholder={
                        hasPassword ? "New password" : "Choose a password"
                      }
                      aria-label="Share password"
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onSavePassword();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={onSavePassword}
                      disabled={settingPassword || !password}
                    >
                      Set
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-600">{passwordError}</p>
                  )}
                </>
              )}
              {!passwordEditing && hasPassword && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Viewers must enter this password. Changing or removing it
                    signs current viewers out.
                  </p>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted-foreground underline cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setPasswordError(null);
                      setPasswordEditing(true);
                    }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t pt-3">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs"
                  aria-label="Share link"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onCopyLink}
                  disabled={!shareUrl}
                >
                  <CopyIcon />
                  Copy
                </Button>
              </div>
              <button
                type="button"
                className="self-start text-xs text-muted-foreground underline cursor-pointer hover:text-foreground disabled:opacity-50"
                onClick={() => regenerateToken({ mapId })}
                disabled={regenerating}
              >
                Reset link
              </button>
              <p className="text-xs text-muted-foreground">
                Resetting creates a new link; the old one stops working.
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
