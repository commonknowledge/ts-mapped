"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import type { SyntheticEvent } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  // Don't use a server action here as setting cookies in a server action
  // causes the full component tree to re-render, which (a) is unnecessary here
  // and (b) interferes with the client-side redirect post login. The redirect
  // should be client side as this is the best way to ensure fresh state.
  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Failed to log in");
        setIsPending(false);
        return;
      }
      window.location.href = redirectTo || "/";
    } catch {
      setError("Failed to log in");
      setIsPending(false);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div>
        <p className="mb-2 font-mono text-[11px] tracking-[0.13em] text-neutral-500 uppercase">
          Welcome back
        </p>
        <h1 className="text-3xl leading-tight font-semibold tracking-[-0.02em] text-ink">
          Log in to Mapped
        </h1>
      </div>

      <form onSubmit={onSubmitLogin} className="flex flex-col gap-5">
        <FormFieldWrapper id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10"
          />
        </FormFieldWrapper>

        <FormFieldWrapper id="password" label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-10"
          />
        </FormFieldWrapper>

        <Link
          href="/forgot-password"
          className="-mt-2 self-end text-sm text-neutral-500 hover:text-ink"
        >
          Forgot password?
        </Link>

        <div className="flex flex-col gap-2">
          <Button disabled={isPending} className="h-10">
            {isPending ? "Logging in…" : "Log in"}
          </Button>
          {error && (
            <span role="alert" className="text-sm text-red-500">
              {error}
            </span>
          )}
        </div>
      </form>

      <p className="border-t border-neutral-200 pt-6 text-sm text-neutral-600">
        Don&apos;t have an account?{" "}
        <Link
          href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline hover:no-underline"
        >
          Join the waitlist
        </Link>
      </p>
    </div>
  );
}
