"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AvatarInput } from "@/components/forms/AvatarInput";
import FormFieldWrapper, {
  FormFieldError,
} from "@/components/forms/FormFieldWrapper";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function UserSettingsForm() {
  const { currentUser, setCurrentUser } = useCurrentUser();

  const trpc = useTRPC();
  const {
    mutate: updateUser,
    error,
    isPending,
  } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: (res) => {
        if (currentUser) {
          form.reset();
          setCurrentUser({ ...currentUser, ...res });
        }
        toast.success("User settings updated!");
      },
      onError: () => {
        toast.error("Failed to update user settings");
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      email: currentUser?.email || "",
      name: currentUser?.name || "",
      avatarUrl: currentUser?.avatarUrl || "",
    },
    onSubmit: async ({ value }) => {
      updateUser({
        email: value.email,
        name: value.name,
        avatarUrl: value.avatarUrl || undefined,
      });
    },
  });

  const fieldErrors = error?.data?.zodError?.fieldErrors;
  const formError = error?.data?.formError;

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="avatarUrl">
        {(field) => (
          <div className="space-y-2">
            <AvatarInput
              name={currentUser?.name || ""}
              src={field.state.value}
              onChange={field.handleChange}
            />
            <FormFieldError error={fieldErrors?.[field.name]} />
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <FormFieldWrapper
            label="Email"
            id={field.name}
            error={fieldErrors?.[field.name]}
          >
            <Input
              name={field.name}
              id={field.name}
              type="email"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormFieldWrapper>
        )}
      </form.Field>

      <form.Field name="name">
        {(field) => (
          <FormFieldWrapper
            label="Name"
            id={field.name}
            error={fieldErrors?.[field.name]}
          >
            <Input
              name={field.name}
              id={field.name}
              type="text"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormFieldWrapper>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isDefaultValue}>
        {(isDefaultValue) => (
          <div className="flex gap-4">
            <Button type="submit" disabled={isPending || isDefaultValue}>
              Save changes
            </Button>

            {!isDefaultValue && !isPending && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </form.Subscribe>
      {formError && <p className="text-xs mt-2 text-red-500">{formError}</p>}
    </form>
  );
}
