"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AvatarInput } from "@/components/forms/AvatarInput";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useFormState } from "@/components/forms/useFormState";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function UserSettingsForm() {
  // TODO: replace with actual user data
  const user = {
    name: "Joaquim Souza",
    email: "joaquim@commonknowledge.coop",
  };

  const [initialValues, setInitialValues] = useState({
    email: user.email,
    name: user.name,
  });

  const { formState, handleChange, resetForm, isDirty } =
    useFormState(initialValues);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // TODO: update user data in the db
      console.log(formState.name, formState.email);
      toast.success("User settings updated!");

      // updating initial form values to the current db values on success
      setInitialValues(formState);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user settings");
    }
  };

  const onAvatarChange = (file: File | undefined) => {
    if (file) {
      console.log(file);
    } else {
      toast.error("Something went wrong");
    }
  };

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={handleSubmit}
    >
      <AvatarInput name={formState?.name} onChange={onAvatarChange} />

      <FormFieldWrapper label="Email" id="email">
        <Input
          name="email"
          id="email"
          type="email"
          required
          value={formState.email}
          onChange={handleChange("email")}
        />
      </FormFieldWrapper>

      <FormFieldWrapper label="Name" id="username">
        <Input
          name="name"
          id="username"
          type="text"
          required
          value={formState.name}
          onChange={handleChange("name")}
        />
      </FormFieldWrapper>

      {isDirty && (
        <div className="flex gap-4">
          <Button type="submit">Save changes</Button>
          <Button type="button" variant="secondary" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
