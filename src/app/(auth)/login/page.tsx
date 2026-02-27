"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Separator } from "@/shadcn/ui/separator";
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
    <Card className="w-[350px] border-none">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <form onSubmit={onSubmitLogin} className="flex flex-col gap-6">
          <FormFieldWrapper id="email" label="Email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </FormFieldWrapper>

          <FormFieldWrapper id="password" label="Password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </FormFieldWrapper>

          <div className="flex flex-col gap-2">
            <Button disabled={isPending} size="sm">
              Login
            </Button>

            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>

          <Link href="/forgot-password" className="text-sm text-center">
            Forgot password?
          </Link>
        </form>
        <Separator className="my-4" orientation="horizontal" />
        <p className="text-sm font-medium text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Sign up to the waitlist
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
