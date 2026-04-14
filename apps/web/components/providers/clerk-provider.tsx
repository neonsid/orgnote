"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, neobrutalism } from "@clerk/themes";
import { useTheme } from "next-themes";
import { ReactNode } from "react";

export function ThemeAwareClerkProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      key={resolvedTheme}
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : neobrutalism,
        elements: {
          modalBackdrop: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
