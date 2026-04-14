import { useForm } from "@tanstack/react-form";
import { useUser } from "@clerk/react";
import { updateNameSchema, type UpdateNameFormData } from "@/lib/validation";

export function useNameForm() {
  const { user } = useUser();

  return useForm({
    defaultValues: {
      name: user?.fullName ?? user?.firstName ?? "",
    } as UpdateNameFormData,
    validators: {
      onChange: updateNameSchema,
      onSubmit: updateNameSchema,
    },
    onSubmit: async ({ value }) => {
      const currentName = user?.fullName ?? user?.firstName ?? "";
      if (value.name !== currentName && user) {
        await user.update({ firstName: value.name });
      }
    },
  });
}
