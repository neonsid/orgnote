import { useAuth, useSSO } from "@clerk/expo";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrgNoteLogo } from "@/components/ui/orgnote-logo";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";

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

function SignInPanel() {
  const { colors, isDark } = useAppTheme();
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        },
        logoContainer: {
          alignItems: "center",
          marginBottom: 40,
          maxWidth: 360,
        },
        logoMark: {
          marginBottom: 16,
          padding: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        logoText: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: -0.5,
        },
        headline: {
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginTop: 12,
          lineHeight: 28,
          letterSpacing: -0.3,
        },
        logoSubtext: {
          fontSize: 15,
          color: colors.textSecondary,
          marginTop: 10,
          textAlign: "center",
          lineHeight: 22,
        },
        signInCard: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 360,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
        },
        signInTitle: {
          fontSize: 26,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        },
        signInSubtitle: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 28,
          lineHeight: 22,
        },
        googleButton: {
          backgroundColor: isDark ? "#fafafa" : colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
        },
        googleButtonContent: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        },
        googleButtonText: {
          color: isDark ? "#18181b" : "#fafafa",
          fontSize: 16,
          fontWeight: "600",
        },
        buttonPressed: {
          opacity: 0.9,
          transform: [{ scale: 0.98 }],
        },
        buttonDisabled: {
          opacity: 0.7,
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.centered}>
      <View style={styles.logoContainer}>
        <View style={styles.logoMark}>
          <OrgNoteLogo size={72} />
        </View>
        <Text style={styles.logoText}>OrgNote</Text>
      </View>

      <View style={styles.signInCard}>
        <Text style={styles.signInTitle}>Welcome</Text>
        <Text style={styles.signInSubtitle}>
          Sign in with the same account you use on the web app.
        </Text>

        <Pressable
          onPress={onGoogle}
          disabled={loading}
          style={({ pressed }) => [
            styles.googleButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "#18181b" : "#fafafa"}
            />
          ) : (
            <View style={styles.googleButtonContent}>
              <AntDesign
                name="google"
                size={18}
                color={isDark ? "#18181b" : "#fafafa"}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
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

  const screenStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centered: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors]
  );

  if (!isLoaded) {
    return (
      <View
        style={[
          screenStyles.screen,
          screenStyles.centered,
          { paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  return (
    <View
      style={[
        screenStyles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <SignInPanel />
    </View>
  );
}
