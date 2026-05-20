import { useAuth, useSSO } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrgNoteLogo } from "@/components/ui/orgnote-logo";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { cn } from "@/lib/cn";

/** Expo Go cannot use your app.json `scheme`; OAuth must use `exp://…` from makeRedirectUri. */
function oauthRedirectUrl() {
  const isExpoGo = Constants.appOwnership === "expo";
  if (isExpoGo) {
    return AuthSession.makeRedirectUri({ path: "sso-callback" });
  }
  return AuthSession.makeRedirectUri({
    scheme: "orgnote",
    path: "sso-callback",
  });
}

function clerkGoogleNativeEnv(key: string) {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return String(extra?.[key] ?? process.env[key] ?? "").trim();
}

/**
 * Clerk's native Google flow (used by `@clerk/expo/native` AuthView on iOS/Android) needs the same
 * Sign in with Google env vars as `useSignInWithGoogle`; otherwise Credential Manager surfaces errors
 * like "Error retrieving Google ID token: No credentials available". Without complete config we use
 * browser SSO like Expo Go (`useSSO` + `oauth_google`).
 *
 * Docs: https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-google
 */
function clerkNativeGoogleConfiguredForPlatform(): boolean {
  const web = clerkGoogleNativeEnv("EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID");
  if (!web) return false;
  if (Platform.OS === "ios") {
    return Boolean(clerkGoogleNativeEnv("EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID"));
  }
  return true;
}

/**
 * Native AuthView needs a dev client / production build with the @clerk/expo prebuild plugin.
 * Expo Go has no Clerk native UI — it crashes if we mount AuthView. Web has no native view either.
 */
function useBrowserOAuthInsteadOfNativeAuthView() {
  return (
    Platform.OS === "web" ||
    Constants.appOwnership === "expo" ||
    !clerkNativeGoogleConfiguredForPlatform()
  );
}

function SignInPanel() {
  const { isDark } = useAppTheme();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: oauthRedirectUrl(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.warn(err);
      showThemedAlert(
        "Sign in failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  }

  const googleButtonTextColor = isDark ? "#18181b" : "#fafafa";

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="mb-10 max-w-[360px] items-center">
        <View className="mb-4 rounded-2xl border border-border bg-surface p-3">
          <OrgNoteLogo size={72} />
        </View>
        <Text className="text-[28px] font-bold tracking-tight text-foreground">OrgNote</Text>
      </View>

      <View className="w-full max-w-[360px] rounded-[20px] border border-border bg-surface p-7 shadow-md">
        <Text className="mb-2 text-center text-[26px] font-bold text-foreground">Welcome</Text>
        <Text className="mb-7 text-center text-[15px] leading-[22px] text-secondary-foreground">
          Sign in with the same account you use on the web app.
        </Text>

        <Pressable
          onPress={onGoogle}
          disabled={loading}
          className={cn(
            "items-center rounded-[14px] py-4 active:scale-[0.98] active:opacity-90",
            isDark ? "bg-[#fafafa]" : "bg-primary",
            loading && "opacity-70"
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color={googleButtonTextColor} />
          ) : (
            <View className="flex-row items-center justify-center gap-2.5">
              <AntDesign name="google" size={18} color={googleButtonTextColor} />
              <Text
                className="text-base font-semibold"
                style={{ color: googleButtonTextColor }}
              >
                Continue with Google
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded } = useAuth();
  const { colors } = useAppTheme();
  const browserAuth = useBrowserOAuthInsteadOfNativeAuthView();

  if (!isLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  if (browserAuth) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <SignInPanel />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1">
        <View className="items-center px-6 pb-3 pt-6">
          <View className="mb-2.5 rounded-[14px] border border-border bg-surface p-2.5">
            <OrgNoteLogo size={48} />
          </View>
          <Text className="text-[22px] font-bold tracking-tight text-foreground">OrgNote</Text>
        </View>
        <View className="min-h-0 flex-1">
          <AuthView mode="signInOrUp" isDismissable={false} />
        </View>
      </View>
    </View>
  );
}
