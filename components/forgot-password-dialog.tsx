"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const handleBackToLogin = () => {
    onOpenChange(false);
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
            Password reset is handled through your Clerk account settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-2">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Please visit your Clerk account settings to reset your password.
            </p>
          </div>
          <Button onClick={handleBackToLogin} variant="outline">
            Back to login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
