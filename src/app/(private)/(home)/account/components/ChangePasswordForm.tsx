"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function ChangePasswordForm({
  closeDialog,
}: {
  closeDialog: () => void;
}) {
  const trpc = useTRPC();
  const {
    mutate: updateUserPassword,
    error,
    isPending,
  } = useMutation(
    trpc.user.updatePassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password updated");
        form.reset();
        closeDialog();
      },
      onError: () => {
        toast.error("Failed to update password");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordValidation: "",
    },
    onSubmit: async ({ value }) => {
      updateUserPassword(value);
    },
  });

  const fieldErrors = error?.data?.zodError?.fieldErrors;
  const formError = error?.data?.formError;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="currentPassword">
        {(field) => (
          <FormFieldWrapper
            label="Verify current password"
            id={field.name}
            error={fieldErrors?.[field.name]}
          >
            <Input
              id={field.name}
              name={field.name}
              type="password"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormFieldWrapper>
        )}
      </form.Field>

      <form.Field name="newPassword">
        {(field) => (
          <FormFieldWrapper
            label="New password"
            id={field.name}
            hint="At least 8 characters"
            error={fieldErrors?.[field.name]}
          >
            <Input
              id={field.name}
              name={field.name}
              type="password"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormFieldWrapper>
        )}
      </form.Field>

      <form.Field name="newPasswordValidation">
        {(field) => (
          <FormFieldWrapper
            label="Confirm new password"
            id={field.name}
            error={fieldErrors?.[field.name]}
          >
            <Input
              id={field.name}
              name={field.name}
              type="password"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormFieldWrapper>
        )}
      </form.Field>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
      {formError && <p className="text-xs mt-2 text-red-500">{formError}</p>}
    </form>
  );
}
