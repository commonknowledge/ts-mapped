"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AvatarInput } from "@/components/forms/AvatarInput";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useFormState } from "@/components/forms/useFormState";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function UserSettingsForm() {
  const { currentUser, setCurrentUser } = useCurrentUser();

  const { formState, handleChange, resetForm, isDirty } = useFormState({
    email: currentUser?.email || "",
    name: currentUser?.name || "",
    avatarUrl: currentUser?.avatarUrl || "",
  });

  const trpc = useTRPC();
  const { mutate: updateUser, isPending } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        if (currentUser) {
          setCurrentUser({
            ...currentUser,
            email: formState.email,
            name: formState.name,
            avatarUrl: formState.avatarUrl,
          });
        }
        toast.success("User settings updated!");
      },
      onError: () => {
        toast.error("Failed to update user settings");
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateUser({
      email: formState.email,
      name: formState.name,
      avatarUrl: formState.avatarUrl || undefined,
    });
  };

  const onAvatarChange = (avatarUrl: string) => {
    handleChange("avatarUrl")({ target: { value: avatarUrl } });
  };

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={handleSubmit}
    >
      <AvatarInput
        name={formState?.name}
        src={formState?.avatarUrl}
        onChange={onAvatarChange}
      />

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
          <Button type="submit" disabled={isPending}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
