"use client";

import { gql, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  UpdateUserPasswordMutation,
  UpdateUserPasswordMutationVariables,
} from "@/__generated__/types";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useFormValidation } from "@/components/forms/useFormValidation";
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

const initialValues = {
  currentPassword: "",
  newPassword: "",
  newPasswordValidation: "",
};

type FormState = z.infer<typeof passwordSchema>;

export default function ChangePasswordForm() {
  const {
    formState,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    isValid,
  } = useFormValidation<FormState>(passwordSchema, initialValues);

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

    if (!isValid) {
      toast.error("Please fix validation errors");
      return;
    }

    // TODO: add backend verification of the current password
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

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
