import { useAuth, useSSO } from "@clerk/expo";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import { useState, useEffect, type ComponentType } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppPressable } from "@/components/ui/app-pressable";
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

function clerkNativeGoogleConfiguredForPlatform(): boolean {
  const web = clerkGoogleNativeEnv("EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID");
  if (!web) return false;
  if (Platform.OS === "ios") {
    return Boolean(clerkGoogleNativeEnv("EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID"));
  }
  return true;
}

function useBrowserOAuthInsteadOfNativeAuthView() {
  return (
    Platform.OS === "web" ||
    Constants.appOwnership === "expo" ||
    !clerkNativeGoogleConfiguredForPlatform()
  );
}

type NativeAuthViewProps = {
  mode: "signInOrUp";
  isDismissable: boolean;
};

function NativeClerkAuthPanel() {
  const [AuthView, setAuthView] = useState<ComponentType<NativeAuthViewProps> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void import("@clerk/expo/native")
      .then((mod) => setAuthView(() => mod.AuthView))
      .catch((err) => {
        console.warn("[mobile auth] Failed to load Clerk native AuthView:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load native auth UI");
      });
  }, []);

  if (loadError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center font-sans text-sm text-muted-foreground">{loadError}</Text>
      </View>
    );
  }

  if (!AuthView) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return <AuthView mode="signInOrUp" isDismissable={false} />;
}

function SignInPanel() {
  const { colors } = useAppTheme();
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
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-8 max-w-[360px] items-center">
        <View
          className="mb-4 rounded-2xl border border-border p-4"
          style={{ backgroundColor: colors.brandLogoBg }}
        >
          <OrgNoteLogo size={64} />
        </View>
        <Text className="font-sans text-2xl font-semibold tracking-tight text-foreground">
          Orgnote
        </Text>
        <Text className="mt-2 text-center font-sans text-sm text-muted-foreground">
          Bookmarks you&apos;ll actually find
        </Text>
      </View>

      <View className="w-full max-w-[360px] rounded-xl border border-border bg-card p-6">
        <Text className="mb-1 text-center font-sans text-lg font-semibold text-foreground">
          Welcome
        </Text>
        <Text className="mb-6 text-center font-sans text-sm leading-5 text-muted-foreground">
          Sign in with the same account you use on the web app.
        </Text>

        <AppPressable
          onPress={onGoogle}
          disabled={loading}
          haptic
          className={cn(
            "flex-row items-center justify-center gap-2 rounded-lg border border-border bg-background py-3",
            loading && "opacity-70"
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <AntDesign name="google" size={18} color={colors.text} />
              <Text className="font-sans text-sm font-medium text-foreground">
                Continue with Google
              </Text>
            </>
          )}
        </AppPressable>
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
          <View
            className="mb-2.5 rounded-xl border border-border p-3"
            style={{ backgroundColor: colors.brandLogoBg }}
          >
            <OrgNoteLogo size={48} />
          </View>
          <Text className="font-sans text-xl font-semibold tracking-tight text-foreground">
            Orgnote
          </Text>
          <Text className="mt-1 font-sans text-sm text-muted-foreground">
            Bookmarks you&apos;ll actually find
          </Text>
        </View>
        <View className="min-h-0 flex-1">
          <NativeClerkAuthPanel />
        </View>
      </View>
    </View>
  );
}
