"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validation";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onBackToLogin,
}: ForgotPasswordDialogProps) {
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    } as ForgotPasswordFormData,
    validators: {
      onChange: forgotPasswordSchema,
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        const result = await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (result.error) {
          setFormError(result.error.message || "Failed to send reset email.");
        } else {
          setSuccess(true);
        }
      } catch {
        setFormError("Failed to send reset email. Please try again.");
      }
    },
  });

  const handleBackToLogin = () => {
    onOpenChange(false);
    form.reset();
    setSuccess(false);
    onBackToLogin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Reset your password
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-2">
          {formError && (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          )}
          {success ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 text-center">
                  If an account exists with that email, we&apos;ve sent you
                  instructions to reset your password.
                </p>
              </div>
              <Button onClick={handleBackToLogin} variant="outline">
                Back to login
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.Field
                name="email"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="hello@example.com"
                      autoComplete="email"
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? "Sending…" : "Send reset link"}
                  </Button>
                )}
              />
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Remember your password?{" "}
                <span className="underline underline-offset-4">Log in</span>
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
