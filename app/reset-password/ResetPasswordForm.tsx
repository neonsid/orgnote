"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded } = useUser();
  const { signOut } = useClerk();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token && isLoaded) {
      toast.error("Invalid or missing reset token");
      router.push("/");
    }
  }, [token, router, isLoaded]);

  const handleResetPassword = async () => {
    if (!token) return;
    toast.info(
      "Password reset is handled by Clerk. Please use the forgot password feature on the sign-in page.",
    );
    router.push("/");
  };

  if (!token || !isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-muted-foreground">
            Password reset is handled by Clerk. Please use the forgot password
            feature on the sign-in page.
          </p>
        </div>

        <Button onClick={handleResetPassword} className="w-full">
          Go to Sign In
        </Button>
      </div>
    </div>
  );
}
