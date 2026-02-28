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
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog";
import { loginSchema, type LoginFormData } from "@/lib/validation";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupClick: () => void;
}

export function LoginDialog({
  open,
  onOpenChange,
  onSignupClick,
}: LoginDialogProps) {
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFormData,
    validators: {
      onChange: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          setFormError(result.error.message || "Invalid email or password.");
        } else {
          onOpenChange(false);
          router.push("/dashboard");
        }
      } catch {
        setFormError("Failed to sign in. Please try again.");
      }
    },
  });

  const handleSignupClick = () => {
    onOpenChange(false);
    onSignupClick();
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setFormError("Failed to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Login</DialogTitle>
            <DialogDescription>
              Enter your email below to login to your account
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border border-input bg-background"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <GoogleLogoIcon className="size-5" weight="bold" />
              )}
              Sign in with Google
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
                name="email"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
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
                children={(field) => (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(true)}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                    {isSubmitting ? "Signing in…" : "Login"}
                  </Button>
                )}
              />
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={handleSignupClick}
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        onBackToLogin={() => setForgotPasswordOpen(false)}
      />
    </>
  );
}
