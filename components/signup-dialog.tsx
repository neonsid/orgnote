"use client";

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
            Enter your details below to create your account
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border border-input bg-background"
          >
            <GoogleLogoIcon className="size-5" weight="bold" />
            Sign up with Google
          </Button>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="hello@example.com"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-confirm-password">Confirm password</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign up
            </Button>
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
