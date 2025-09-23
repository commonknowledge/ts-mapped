"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useForm } from "@/components/forms/useForm";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

const passwordSchema = z
  .object({
    currentPassword: z.string().nonempty("Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    newPasswordValidation: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordValidation, {
    message: "Passwords do not match",
    path: ["newPasswordValidation"],
  });

type FormState = z.infer<typeof passwordSchema>;

export default function ChangePasswordForm({
  closeDialog,
}: {
  closeDialog: () => void;
}) {
  const {
    formState,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    isValid,
  } = useForm<FormState>(passwordSchema, {
    currentPassword: "",
    newPassword: "",
    newPasswordValidation: "",
  });

  const trpc = useTRPC();
  const { mutate: updateUserPassword, isPending } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        toast.success("Password updated");
        resetForm();
        closeDialog();
      },
      onError: () => {
        toast.error("Failed to update password");
        resetForm();
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Please fix validation errors");
      return;
    }

    updateUserPassword({
      currentPassword: formState.currentPassword,
      newPassword: formState.newPassword,
    });
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormFieldWrapper
        label="Verify current password"
        id="current-password"
        error={touched.currentPassword ? errors.currentPassword : ""}
      >
        <Input
          id="current-password"
          type="password"
          required
          value={formState.currentPassword}
          onChange={handleChange("currentPassword")}
          onBlur={handleBlur("currentPassword")}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="New password"
        id="new-password"
        hint="At least 8 characters"
        error={touched.newPassword ? errors.newPassword : ""}
      >
        <Input
          id="new-password"
          type="password"
          required
          value={formState.newPassword}
          onChange={handleChange("newPassword")}
          onBlur={handleBlur("newPassword")}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Confirm new password"
        id="confirm-new-password"
        error={
          touched.newPasswordValidation ? errors.newPasswordValidation : ""
        }
      >
        <Input
          id="confirm-new-password"
          type="password"
          required
          value={formState.newPasswordValidation}
          onChange={handleChange("newPasswordValidation")}
          onBlur={handleBlur("newPasswordValidation")}
        />
      </FormFieldWrapper>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
