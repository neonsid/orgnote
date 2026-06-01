import "../polyfills";
import "../global.css";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { ClerkProvider, useAuth } from "@clerk/expo";
import type { TokenCache } from "@clerk/expo";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ConvexClerkProvider } from "@/components/convex-clerk-provider";
import { RuntimeErrorBoundary } from "@/components/runtime-error-boundary";
import { ThemeRoot } from "@/components/theme-root";
import { useAppTheme } from "@/contexts/app-theme";
import { AppThemeProvider } from "@/contexts/app-theme";
import { ThemedAlertProvider } from "@/contexts/themed-alert";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { warmUpInAppBrowser } from "@/lib/open-in-app-browser";

if (Platform.OS !== "web") {
  require("react-native-gesture-handler");
}

WebBrowser.maybeCompleteAuthSession();
void SplashScreen.preventAutoHideAsync().catch(() => {
  /* Expo Go / web may reject if splash is unavailable */
});

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

      <Stack.Protected guard={!auth.isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>

      <Stack.Protected guard={auth.isSignedIn === true}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  useMountEffect(() => {
    void warmUpInAppBrowser();
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <ThemedAlertProvider>
            <ThemeRoot>
              {fontsReady ? (
                <RootNavigator />
              ) : (
                <View className="flex-1 items-center justify-center bg-background">
                  <ActivityIndicator size="large" />
                </View>
              )}
            </ThemeRoot>
          </ThemedAlertProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [splashHidden, setSplashHidden] = useState(false);

  const hideSplash = useCallback(() => {
    if (splashHidden) return;
    setSplashHidden(true);
    void SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }, [splashHidden]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
    }
  }, [fontsLoaded, fontError, hideSplash]);

  // Never leave Expo Go stuck on the native splash if font loading hangs.
  useEffect(() => {
    const timeout = setTimeout(hideSplash, 4000);
    return () => clearTimeout(timeout);
  }, [hideSplash]);

  if (fontError) {
    console.warn("[mobile fonts] Failed to load Poppins:", fontError);
  }

  return <AppShell fontsReady={fontsLoaded || Boolean(fontError)} />;
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
