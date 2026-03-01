"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validation";
import { Check, X } from "lucide-react";

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-muted-foreground"}`}
    >
      {met ? <Check className="size-4" /> : <X className="size-4" />}
      <span>{text}</span>
    </div>
  );
}

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      router.push("/");
    }
  }, [token, router]);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    } as ResetPasswordFormData,
    validators: {
      onChange: resetPasswordSchema,
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      if (!token) return;

      try {
        const result = await authClient.resetPassword({
          newPassword: value.password,
          token: token,
        });

        if (result.error) {
          toast.error(result.error.message || "Failed to reset password");
        } else {
          toast.success("Password reset successfully!");
          router.push("/");
        }
      } catch {
        toast.error("Failed to reset password. Please try again.");
      }
    },
  });

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="password"
            children={(field) => {
              const password = field.state.value;
              const hasMinLength = password.length >= 8;
              const hasMaxLength = password.length <= 128;
              const hasUppercase = /[A-Z]/.test(password);
              const hasLowercase = /[a-z]/.test(password);
              const hasNumber = /[0-9]/.test(password);
              const hasSpecial = /[^A-Za-z0-9]/.test(password);

              return (
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {password.length > 0 && (
                    <div className="space-y-1 mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">
                        Password requirements:
                      </p>
                      <PasswordRequirement
                        met={hasMinLength}
                        text="At least 8 characters"
                      />
                      <PasswordRequirement
                        met={hasMaxLength}
                        text="At most 128 characters"
                      />
                      <PasswordRequirement
                        met={hasUppercase}
                        text="One uppercase letter (A-Z)"
                      />
                      <PasswordRequirement
                        met={hasLowercase}
                        text="One lowercase letter (a-z)"
                      />
                      <PasswordRequirement
                        met={hasNumber}
                        text="One number (0-9)"
                      />
                      <PasswordRequirement
                        met={hasSpecial}
                        text="One special character (!@#$%^&*)"
                      />
                    </div>
                  )}
                </div>
              );
            }}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isSubmitting ? "Resetting…" : "Reset password"}
              </Button>
            )}
          />
        </form>
      </div>
    </div>
  );
}
