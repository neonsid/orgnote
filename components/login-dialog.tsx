"use client";

import { useReducer } from "react";
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

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupClick: () => void;
}

interface LoginState {
  email: string;
  password: string;
  loading: boolean;
  googleLoading: boolean;
  error: string;
}

type LoginAction =
  | { type: "SET_FIELD"; field: "email" | "password"; value: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_GOOGLE_LOADING"; value: boolean }
  | { type: "SET_ERROR"; value: string }
  | { type: "CLEAR_ERROR" };

const initialLoginState: LoginState = {
  email: "",
  password: "",
  loading: false,
  googleLoading: false,
  error: "",
};

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_GOOGLE_LOADING":
      return { ...state, googleLoading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.value };
    case "CLEAR_ERROR":
      return { ...state, error: "" };
    default:
      return state;
  }
}

export function LoginDialog({
  open,
  onOpenChange,
  onSignupClick,
}: LoginDialogProps) {
  const [state, dispatch] = useReducer(loginReducer, initialLoginState);

  const handleSignupClick = () => {
    onOpenChange(false);
    onSignupClick();
  };

  const handleGoogleSignIn = async () => {
    dispatch({ type: "SET_GOOGLE_LOADING", value: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      dispatch({ type: "SET_ERROR", value: "Failed to sign in with Google. Please try again." });
      dispatch({ type: "SET_GOOGLE_LOADING", value: false });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_LOADING", value: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const result = await authClient.signIn.email({
        email: state.email,
        password: state.password,
      });
      if (result.error) {
        dispatch({ type: "SET_ERROR", value: result.error.message || "Invalid email or password." });
      } else {
        onOpenChange(false);
        window.location.href = "/dashboard";
      }
    } catch {
      dispatch({ type: "SET_ERROR", value: "Failed to sign in. Please try again." });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  };

  return (
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
            disabled={state.googleLoading}
          >
            {state.googleLoading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <GoogleLogoIcon className="size-5" weight="bold" />
            )}
            Sign in with Google
          </Button>
          {state.error && (
            <p className="text-sm text-red-500 text-center">{state.error}</p>
          )}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleEmailLogin}>
            <div className="grid gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="hello@example.com"
                autoComplete="email"
                value={state.email}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "email", value: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
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
                value={state.password}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "password", value: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? "Signing in…" : "Login"}
            </Button>
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
  );
}
