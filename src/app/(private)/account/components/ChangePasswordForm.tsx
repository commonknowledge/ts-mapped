"use client";

import {
  UpdateUserPasswordMutation,
  UpdateUserPasswordMutationVariables,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Card, CardHeader, CardContent } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { gql, useMutation } from "@apollo/client";
import * as React from "react";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [password, setPassword] = React.useState("");

  const [updateUserPassword, { loading }] = useMutation<
    UpdateUserPasswordMutation,
    UpdateUserPasswordMutationVariables
  >(gql`
    mutation UpdateUserPassword($password: String!) {
      updateUserPassword(password: $password) {
        code
      }
    }
  `);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { data } = await updateUserPassword({ variables: { password } });
      if (data?.updateUserPassword?.code === 200) {
        setPassword("");
        toast.success("Password updated");
      } else {
        toast.error("Failed to update password");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update password");
    }
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

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
