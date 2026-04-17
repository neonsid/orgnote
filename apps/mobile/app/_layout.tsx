import "../polyfills";

import { ClerkProvider, useAuth } from "@clerk/expo";
import type { TokenCache } from "@clerk/expo";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ConvexClerkProvider } from "@/components/convex-clerk-provider";
import { RuntimeErrorBoundary } from "@/components/runtime-error-boundary";
import { ThemeRoot } from "@/components/theme-root";
import { useAppTheme } from "@/contexts/app-theme";
import { AppThemeProvider } from "@/contexts/app-theme";
import { ThemedAlertProvider } from "@/contexts/themed-alert";

if (Platform.OS !== "web") {
  require("react-native-gesture-handler");
}

WebBrowser.maybeCompleteAuthSession();

function maskPublishableKey(value: string) {
  if (!value) {
    return "<missing>";
  }
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

console.log("[mobile env]", {
  platform: Platform.OS,
  convexUrl: convexUrl || "<missing>",
  clerkPublishableKey: maskPublishableKey(clerkPublishableKey),
});

let tokenCache: TokenCache | undefined;
if (Platform.OS !== "web") {
  try {
    tokenCache = require("@clerk/expo/token-cache").tokenCache;
  } catch {
    console.warn("Token cache not available - using in-memory storage");
  }
}

function RootNavigator() {
  const auth = useAuth();
  const { colors } = useAppTheme();

  if (!auth.isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sso-callback" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="browser" />
      <Stack.Screen name="profile/[username]" />

      <Stack.Protected guard={!auth.isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>

      <Stack.Protected guard={auth.isSignedIn === true}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

function AppContent() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <ThemedAlertProvider>
            <ThemeRoot>
              <RootNavigator />
            </ThemeRoot>
          </ThemedAlertProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <RuntimeErrorBoundary>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <ConvexClerkProvider>
          <AppContent />
        </ConvexClerkProvider>
      </ClerkProvider>
    </RuntimeErrorBoundary>
  );
}
