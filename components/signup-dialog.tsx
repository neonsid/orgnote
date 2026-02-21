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
            <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </Button>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
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
