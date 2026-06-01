import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";

import { ConvexClerkBridge } from "@/components/convex-clerk-bridge";

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
    <ConvexClerkBridge client={convex}>{children}</ConvexClerkBridge>
  );
}
