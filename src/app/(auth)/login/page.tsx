"use client";

import { SyntheticEvent, useState, useTransition } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
import { login } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState("");

  const [isPending, startTransition] = useTransition();

  const onSubmitLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(formData);
      if (result) setError(result);
    });
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
              placeholder="email"
              required
            />
          </FormFieldWrapper>

          <FormFieldWrapper id="password" label="Password">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="password"
              required
            />
          </FormFieldWrapper>

          <Button disabled={isPending} size="sm">
            Login
          </Button>

          {error ? (
            <span className="text-sm text-red-500">{error}</span>
          ) : (
            <></>
          )}

          <Link href="/forgot-password" className="text-sm text-center">
            Forgot password?
          </Link>
        </form>
        <Separator className="my-4" orientation="horizontal" />
        <Label className="text-sm text-center">
          Don&apos;t have an account?
        </Label>
        <Button variant="outline" asChild className="text-sm w-full">
          <Link
            href="https://us19.list-manage.com/survey?u=7d61a70102ab811e6282bee60&id=089628c6aa&attribution=false"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sign up to the waitlist
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
