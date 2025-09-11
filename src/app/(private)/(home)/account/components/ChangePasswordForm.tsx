"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { useTRPC } from "@/utils/trpc/react";

export function ChangePasswordForm() {
  const [password, setPassword] = React.useState("");

  const trpc = useTRPC();
  const { mutate: updateUserPassword, isPending } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        setPassword("");
        toast.success("Password updated");
      },
      onError: () => {
        toast.error("Failed to update password");
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateUserPassword({ password });
  };

  return (
    <form className="max-w-md" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>Change your password</CardHeader>

        <CardContent className="space-y-2">
          <FormFieldWrapper
            label="New password"
            id="password"
            hint="At least 8 characters"
          >
            <Input
              name="password"
              id="password"
              minLength={8}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormFieldWrapper>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
