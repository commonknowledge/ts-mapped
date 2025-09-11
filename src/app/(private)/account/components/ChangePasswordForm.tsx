"use client";

import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  UpdateUserPasswordMutation,
  UpdateUserPasswordMutationVariables,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters"),
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

export default function ChangePasswordForm() {
  const [formState, setFormState] = useState<FormState>({
    currentPassword: "",
    newPassword: "",
    newPasswordValidation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const validate = (state: FormState) => {
    const validation = passwordSchema.safeParse(state);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      return newErrors;
    }
    return {};
  };

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const newState = { ...formState, [field]: value };
      setFormState(newState);

      // If the field already has an error, revalidate on change
      if (errors[field]) {
        setErrors(validate(newState));
      }
    };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(formState));
  };

  const resetForm = () => {
    setFormState({
      currentPassword: "",
      newPassword: "",
      newPasswordValidation: "",
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors = validate(formState);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        currentPassword: true,
        newPassword: true,
        newPasswordValidation: true,
      });
      return;
    }

    try {
      const { data } = await updateUserPassword({
        variables: { data: { password: formState.newPassword } },
      });

      if (data?.updateUser?.code === 200) {
        toast.success("Password updated");
        resetForm();
      } else {
        toast.error("Failed to update password");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update password");
      resetForm();
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormFieldWrapper
        label="Verify current password"
        id="current-password"
        error={touched.currentPassword ? errors.currentPassword : undefined}
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
        error={touched.newPassword ? errors.newPassword : undefined}
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
          touched.newPasswordValidation
            ? errors.newPasswordValidation
            : undefined
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

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
