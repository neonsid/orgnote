"use client";

import { useState } from "react";
import { SignUpButton } from "@clerk/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoogleLogoIcon } from "@phosphor-icons/react";

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
}

export function SignupDialog({
  open,
  onOpenChange,
  onLoginClick,
}: SignupDialogProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleLoginClick = () => {
    onOpenChange(false);
    onLoginClick();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sign up</DialogTitle>
          <DialogDescription>
            Create an account to get started
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-2">
          <SignUpButton mode="modal">
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
              Sign up with Google
            </Button>
          </SignUpButton>
          {formError && (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          )}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              OR
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Email sign-up is handled by Clerk
          </p>
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
