import type { ReactNode } from "react";
import { useAuth } from "@clerk/expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

function isValidAbsoluteUrl(value: string) {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
}

const convex = isValidAbsoluteUrl(convexUrl)
  ? new ConvexReactClient(convexUrl)
  : null;

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
