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
import { authClient } from "@/lib/auth-client";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToLogin: () => void;
}

interface ForgotPasswordState {
  email: string;
  loading: boolean;
  error: string;
  success: boolean;
}

type ForgotPasswordAction =
  | { type: "SET_EMAIL"; value: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; value: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_SUCCESS"; value: boolean }
  | { type: "RESET" };

const initialForgotPasswordState: ForgotPasswordState = {
  email: "",
  loading: false,
  error: "",
  success: false,
};

function forgotPasswordReducer(
  state: ForgotPasswordState,
  action: ForgotPasswordAction,
): ForgotPasswordState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.value };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.value };
    case "CLEAR_ERROR":
      return { ...state, error: "" };
    case "SET_SUCCESS":
      return { ...state, success: action.value };
    case "RESET":
      return initialForgotPasswordState;
    default:
      return state;
  }
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onBackToLogin,
}: ForgotPasswordDialogProps) {
  const [state, dispatch] = useReducer(
    forgotPasswordReducer,
    initialForgotPasswordState,
  );

  const handleBackToLogin = () => {
    onOpenChange(false);
    dispatch({ type: "RESET" });
    onBackToLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "CLEAR_ERROR" });
    dispatch({ type: "SET_LOADING", value: true });

    try {
      const result = await authClient.requestPasswordReset({
        email: state.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        dispatch({
          type: "SET_ERROR",
          value: result.error.message || "Failed to send reset email.",
        });
      } else {
        dispatch({ type: "SET_SUCCESS", value: true });
      }
    } catch {
      dispatch({
        type: "SET_ERROR",
        value: "Failed to send reset email. Please try again.",
      });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
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
          {state.error && (
            <p className="text-sm text-red-500 text-center">{state.error}</p>
          )}
          {state.success ? (
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
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="hello@example.com"
                  autoComplete="email"
                  value={state.email}
                  onChange={(e) =>
                    dispatch({ type: "SET_EMAIL", value: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={state.loading}>
                {state.loading ? "Sending…" : "Send reset link"}
              </Button>
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
