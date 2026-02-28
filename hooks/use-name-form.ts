import { useForm } from "@tanstack/react-form";
import { authClient } from "@/lib/auth-client";
import { updateNameSchema, type UpdateNameFormData } from "@/lib/validation";

interface UseNameFormOptions {
  user: { name: string };
}

export function useNameForm({ user }: UseNameFormOptions) {
  return useForm({
    defaultValues: {
      name: user.name,
    } as UpdateNameFormData,
    validators: {
      onChange: updateNameSchema,
      onSubmit: updateNameSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.name !== user.name) {
        await authClient.updateUser({ name: value.name });
      }
    },
  });
}
