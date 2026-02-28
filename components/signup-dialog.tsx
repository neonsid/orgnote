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
import { GoogleLogoIcon } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { signupSchema, type SignupFormData } from "@/lib/validation";
import { Check, X } from "lucide-react";

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
}

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

export function SignupDialog({
  open,
  onOpenChange,
  onLoginClick,
}: SignupDialogProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as SignupFormData,
    validators: {
      onChange: signupSchema,
      onSubmit: signupSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        const result = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          setFormError(result.error.message || "Failed to create account.");
        } else {
          onOpenChange(false);
          router.push("/dashboard");
        }
      } catch {
        setFormError("Failed to sign up. Please try again.");
      }
    },
  });

  const handleLoginClick = () => {
    onOpenChange(false);
    onLoginClick();
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setFormError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setFormError("Failed to sign up with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sign up</DialogTitle>
          <DialogDescription>
            Enter your details below to create your account
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border border-input bg-background"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <GoogleLogoIcon className="size-5" weight="bold" />
            )}
            Sign up with Google
          </Button>
          {formError && (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          )}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="name"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
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
            <form.Field
              name="email"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
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
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {password.length > 0 && (
                      <div className="space-y-1 mt-1 p-3 bg-muted rounded-md">
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
                <div className="grid gap-2">
                  <Label htmlFor="signup-confirm-password">
                    Confirm password
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                  {isSubmitting ? "Creating account…" : "Sign up"}
                </Button>
              )}
            />
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={handleLoginClick}
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              Login
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
