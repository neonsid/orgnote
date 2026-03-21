import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useUser } from "@clerk/react";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/validation";
import { toast } from "@/lib/toast";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function usePasswordForm() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { user } = useUser();

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as ChangePasswordFormData,
    validators: {
      onChange: changePasswordSchema,
      onSubmit: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});

      if (!user) {
        toast.error("You must be logged in to change your password.");
        return;
      }

      try {
        await user.updatePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        toast.success("Password changed successfully!");
        form.reset();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to change password";
        let userMessage = "Failed to change password.";

        if (
          errorMessage.toLowerCase().includes("invalid password") ||
          errorMessage.toLowerCase().includes("incorrect password")
        ) {
          userMessage =
            "Current password is incorrect. Please check and try again.";
          setFieldErrors({ currentPassword: userMessage });
        } else if (errorMessage.toLowerCase().includes("new password")) {
          userMessage =
            "New password doesn't meet requirements. Please check the requirements below.";
          setFieldErrors({ newPassword: userMessage });
        } else if (errorMessage.toLowerCase().includes("same password")) {
          userMessage =
            "New password cannot be the same as your current password.";
          setFieldErrors({ newPassword: userMessage });
        } else {
          setFieldErrors({
            currentPassword: userMessage,
          });
        }

        toast.error(userMessage);
        throw new Error(userMessage);
      }
    },
  });

  return {
    form,
    fieldErrors,
    setFieldErrors,
  };
}
