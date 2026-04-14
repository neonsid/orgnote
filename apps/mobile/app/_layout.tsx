import "react-native-gesture-handler";

import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ConvexClerkProvider } from "@/components/convex-clerk-provider";

WebBrowser.maybeCompleteAuthSession();

const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

function AppContent() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    // @ts-expect-error Clerk Expo types don't include children in props (React 19 compat issue)
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexClerkProvider>
        <AppContent />
      </ConvexClerkProvider>
    </ClerkProvider>
  );
}
