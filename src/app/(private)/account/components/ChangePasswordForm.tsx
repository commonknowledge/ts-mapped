"use client";

import { gql, useMutation } from "@apollo/client";
import * as React from "react";
import { toast } from "sonner";
import {
  UpdateUserPasswordMutation,
  UpdateUserPasswordMutationVariables,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function ChangePasswordForm() {
  const [password, setPassword] = React.useState("");

  const [updateUserPassword, { loading }] = useMutation<
    UpdateUserPasswordMutation,
    UpdateUserPasswordMutationVariables
  >(gql`
    mutation UpdateUserPassword($data: UpdateUserInput!) {
      updateUser(data: $data) {
        code
        result {
          id
        }
      }
    }
  `);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { data } = await updateUserPassword({
        variables: { data: { password } },
      });
      if (data?.updateUser?.code === 200) {
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
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormFieldWrapper label="Verify current password" id="current-password">
        <Input
          name="current-password"
          id="current-password"
          minLength={8}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="New password"
        id="new-password"
        hint="At least 8 characters"
      >
        <Input
          name="new-password"
          id="new-password"
          minLength={8}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="Confirm new password" id="confirm-new-password">
        <Input
          name="confirm-new-password"
          id="confirm-new-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormFieldWrapper>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
