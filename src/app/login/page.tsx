"use client";

import { SyntheticEvent, useState } from "react";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({ email, password }),
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Response code ${response.status}`);
      }
      window.location.href = "/dashboard"
    } catch {
      setError("Login failed, please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-brand-background">
      <Card className="w-[350px] border-none">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <form onSubmit={onSubmitLogin} className="flex flex-col gap-2 ">
            <span className="text-sm text-red-500">{error}</span>
            <Label>Username</Label>
            <input
              name="email"
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-1 border border-neutral-300 rounded text-sm w-full mb-3"
            />
            <Label>Password</Label>
            <input
              name="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-1 border border-neutral-300 rounded text-sm w-full mb-3"
            />
            <Button disabled={loading} size="sm">
              Login
            </Button>
            <Link href="/forgot-password" className="text-sm text-center">
              Forgot password?
            </Link>
          </form>
          <Separator className="my-4" orientation="horizontal" />
          <Label className="text-sm text-center">
            Don&apos;t have an account?
          </Label>
          <Button variant="outline" asChild className="text-sm w-full">
            <Link href="/apply">Sign up to the waitlist</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
