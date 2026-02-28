import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { authClient } from "@/lib/auth-client";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/validation";
import { toast } from "sonner";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function usePasswordForm() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

      const result = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        const errorMessage = result.error.message || "";
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

      toast.success("Password changed successfully!");
      form.reset();
    },
  });

  return {
    form,
    fieldErrors,
    setFieldErrors,
  };
}
