"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Link } from "@/components/Link";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import type { SyntheticEvent } from "react";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const { token } = params;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const trpc = useTRPC();
  const { mutate: confirmInvite, isPending } = useMutation(
    trpc.auth.confirmInvite.mutationOptions({
      onSuccess: () => {
        window.location.href = "/dashboard";
      },
      onError: (error) => {
        setError(error.message);
      },
    }),
  );

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid token");
      return;
    }
    confirmInvite({ password, token });
  };

  return (
    <Card className="w-[350px] border-none">
      <CardHeader>
        <CardTitle className="text-2xl">One more thing...</CardTitle>
        <CardDescription>
          Enter a password to confirm your invite and you&apos;ll be redirected
          to your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <FormFieldWrapper id="password" label="Password">
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormFieldWrapper>

          <Button disabled={isPending} size="sm">
            Confirm invite
          </Button>

          {error && <span className="text-sm text-red-500">{error}</span>}

          <Link
            href="/login"
            className="flex gap-2 items-center justify-center text-sm text-center"
          >
            <ArrowLeft size={16} />
            Login
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
