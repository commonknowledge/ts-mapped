"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useTRPC } from "@/lib/trpc";
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
    })
  );
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetPassword({ token, password });
  };

  return (
    <div className="p-4 pt-20 flex flex-col gap-4">
      <div>
        <Image
          src="/logo.svg"
          alt="Mapped"
          width={40}
          height={40}
          className="mx-auto"
        />
      </div>
      <Card className="mx-auto max-w-lg w-full">
        <CardContent>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
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
    </div>
  );
}
