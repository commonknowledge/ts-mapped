"use client";

import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

/**
 * The password gate for a protected shared map. Submitting posts to the
 * verify endpoint, which sets the grant cookie; the refresh then re-runs
 * the server component, which sees the grant and renders the map.
 */
export default function SharePasswordForm({
  token,
  mapName,
}: {
  token: string;
  mapName: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/share/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      if (response.status === 429) {
        setError("Too many attempts. Please try again in a few minutes.");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-50 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <LockIcon size={16} className="text-muted-foreground shrink-0" />
            <h1 className="text-base font-semibold truncate">{mapName}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            This map is password protected. Enter the password to view it.
          </p>
        </div>
        <Input
          type="password"
          value={password}
          autoFocus
          placeholder="Password"
          aria-label="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={!password || submitting}>
          {submitting ? "Checking..." : "View map"}
        </Button>
      </form>
    </div>
  );
}
