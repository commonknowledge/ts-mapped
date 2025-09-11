"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";

export default function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const trpc = useTRPC();
  const { mutate: resetPassword, isPending } = useMutation(
    trpc.auth.resetPassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password reset successfully", {
          description: "You can now login with your new password",
        });
        router.push("/");
      },
    }),
  );
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetPassword({ token, password });
    toast.success("Password reset successfully", {
      description: "You can now login with your new password",
    });
    router.push("/login");
  };

  return (
    <Card className="w-[350px] border-none">
      <CardContent>
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <FormFieldWrapper label="New Password">
            <Input
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label="Confirm Password">
            <Input
              type="password"
              placeholder="Enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormFieldWrapper>
          <Button type="submit" disabled={isPending}>
            Confirm
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
