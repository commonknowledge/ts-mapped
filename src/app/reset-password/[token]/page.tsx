"use client";

import { gql, useMutation } from "@apollo/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import {
  MutationResetPasswordArgs,
  MutationResponse,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
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

  const [resetPassword] = useMutation<
    MutationResponse,
    MutationResetPasswordArgs
  >(gql`
    mutation ResetPassword($token: String!, $password: String!) {
      resetPassword(token: $token, password: $password) {
        code
      }
    }
  `);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(password, confirmPassword);
    await resetPassword({ variables: { token, password } });
    toast.success("Password reset successfully", {
      description: "You can now login with your new password",
    });
    router.push("/");
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
            <Button type="submit">Confirm</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
