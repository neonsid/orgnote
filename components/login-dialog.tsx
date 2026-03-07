"use client";

import { useState } from "react";
import { SignInButton, SignUpButton, useSignIn, useSignUp } from "@clerk/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoogleLogoIcon } from "@phosphor-icons/react";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSignupClick = () => {
    onOpenChange(false);
    onSignupClick();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Login</DialogTitle>
            <DialogDescription>
              Sign in to your account to continue
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 pt-2">
            <SignInButton mode="modal">
              <Button
                type="button"
                variant="outline"
                className="w-full border border-input bg-background"
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <GoogleLogoIcon className="size-5" weight="bold" />
                )}
                Sign in with Google
              </Button>
            </SignInButton>
            {formError && (
              <p className="text-sm text-red-500 text-center">{formError}</p>
            )}
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                OR
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Email sign-in is handled by Clerk
            </p>
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
    </>
  );
}
