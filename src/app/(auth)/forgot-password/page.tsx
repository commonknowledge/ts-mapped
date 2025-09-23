"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Link } from "@/components/Link";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import type { SyntheticEvent } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const trpc = useTRPC();
  const { mutate: forgotPassword, isPending } = useMutation(
    trpc.auth.forgotPassword.mutationOptions({
      onSuccess: () => {
        toast.success(
          "We received your request. If you have an account, we will send you an e-mail with a link to reset password.",
        );
        router.push("/login");
      },
      onError: () => {
        setError("Email failed to send, please check your credentials.");
      },
    }),
  );

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPassword({ email });
  };

  return (
    <Card className="w-[350px] border-none">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <FormFieldWrapper id="email" label="Email">
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormFieldWrapper>

          <Button disabled={isPending} size="sm">
            Send instructions
          </Button>

          {error && <span className="text-sm text-red-500">{error}</span>}

          <Link
            href="/login"
            className="flex gap-2 items-center justify-center text-sm text-center"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
