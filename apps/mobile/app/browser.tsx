import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useReducer, useRef } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type BrowserNavState = {
  currentUrl: string;
  pageTitle: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
};

type BrowserNavAction =
  | {
      type: "navigation";
      payload: Pick<
        WebViewNavigation,
        "url" | "title" | "canGoBack" | "canGoForward" | "loading"
      >;
    }
  | { type: "loading"; loading: boolean };

function browserNavReducer(state: BrowserNavState, action: BrowserNavAction): BrowserNavState {
  switch (action.type) {
    case "navigation": {
      const { url, title, canGoBack, canGoForward, loading } = action.payload;
      return {
        ...state,
        currentUrl: url,
        canGoBack,
        canGoForward,
        loading,
        ...(title ? { pageTitle: title } : {}),
      };
    }
    case "loading":
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    titleWrap: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    progressBar: {
      height: 2,
      backgroundColor: colors.primaryAccent,
    },
    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    toolbarGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    toolbarButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    toolbarButtonDisabled: {
      opacity: 0.45,
    },
    fallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      gap: spacing.md,
    },
    fallbackTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
    },
    fallbackBody: {
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}

export default function BrowserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();
  const initialUrl = getStringParam(params.url) ?? "";
  const initialTitle = getStringParam(params.title) ?? "Browser";
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const webViewRef = useRef<WebView>(null);
  const [navState, dispatchNav] = useReducer(browserNavReducer, {
    currentUrl: initialUrl,
    pageTitle: initialTitle,
    canGoBack: false,
    canGoForward: false,
    loading: true,
  });
  const { currentUrl, pageTitle, canGoBack, canGoForward, loading } = navState;

  function handleNavigationChange(payload: WebViewNavigation) {
    dispatchNav({ type: "navigation", payload });
  }

  async function handleOpenExternal() {
    if (currentUrl) {
      await Linking.openURL(currentUrl);
    }
  }

  if (!initialUrl) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>No page to open</Text>
          <Text style={styles.fallbackBody}>
            This browser screen needs a valid URL before it can load a bookmark.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.title}>
            {pageTitle || initialTitle}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {currentUrl}
          </Text>
        </View>
        <Pressable onPress={() => void handleOpenExternal()} style={styles.closeButton}>
          <Ionicons name="open-outline" size={20} color={colors.text} />
        </Pressable>
      </View>
      {loading ? <View style={styles.progressBar} /> : null}
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        onLoadStart={() => dispatchNav({ type: "loading", loading: true })}
        onLoadEnd={() => dispatchNav({ type: "loading", loading: false })}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" color={colors.primaryAccent} />}
      />
      <View style={styles.toolbar}>
        <View style={styles.toolbarGroup}>
          <Pressable
            disabled={!canGoBack}
            onPress={() => webViewRef.current?.goBack()}
            style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonDisabled]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            disabled={!canGoForward}
            onPress={() => webViewRef.current?.goForward()}
            style={[styles.toolbarButton, !canGoForward && styles.toolbarButtonDisabled]}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.text} />
          </Pressable>
        </View>
        <Pressable onPress={() => webViewRef.current?.reload()} style={styles.toolbarButton}>
          <Ionicons name="refresh" size={18} color={colors.text} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
