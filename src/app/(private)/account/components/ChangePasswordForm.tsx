"use client";

import { gql, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UpdateUserPasswordMutation,
  UpdateUserPasswordMutationVariables,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordValidation, setNewPasswordValidation] = useState("");
  const [disableSubmit, setDisableSubmit] = useState(true);

  useEffect(() => {
    if (!newPassword || newPassword !== newPasswordValidation) {
      setDisableSubmit(true);
    } else {
      setDisableSubmit(false);
    }
  }, [newPassword, newPasswordValidation, setDisableSubmit]);

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

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordValidation("");
    setDisableSubmit(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // TODO: add current password validation on the BE
      const { data } = await updateUserPassword({
        variables: { data: { password: newPassword } },
      });
      if (data?.updateUser?.code === 200) {
        toast.success("Password updated");
      } else {
        toast.error("Failed to update password");
      }

      resetForm();
    } catch (error) {
      resetForm();
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
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
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
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="Confirm new password" id="confirm-new-password">
        <Input
          name="confirm-new-password"
          id="confirm-new-password"
          type="password"
          required
          value={newPasswordValidation}
          onChange={(e) => setNewPasswordValidation(e.target.value)}
        />
      </FormFieldWrapper>

      <Button type="submit" disabled={disableSubmit || loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
