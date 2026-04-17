import type { ReactNode } from "react";
import { Component, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type RuntimeErrorDetails = {
  message: string;
  stack?: string;
  source: "react" | "global";
  isFatal?: boolean;
};

type RuntimeErrorListener = (error: RuntimeErrorDetails | null) => void;

let currentRuntimeError: RuntimeErrorDetails | null = null;
const runtimeErrorListeners = new Set<RuntimeErrorListener>();

function publishRuntimeError(error: RuntimeErrorDetails | null) {
  currentRuntimeError = error;
  for (const listener of runtimeErrorListeners) {
    listener(error);
  }
}

function subscribeToRuntimeErrors(listener: RuntimeErrorListener) {
  runtimeErrorListeners.add(listener);
  listener(currentRuntimeError);
  return () => {
    runtimeErrorListeners.delete(listener);
  };
}

function normalizeRuntimeError(
  error: unknown,
  source: RuntimeErrorDetails["source"],
  isFatal?: boolean,
): RuntimeErrorDetails {
  if (error instanceof Error) {
    return {
      message: error.message || "Unknown runtime error",
      stack: error.stack,
      source,
      isFatal,
    };
  }

  return {
    message: typeof error === "string" ? error : JSON.stringify(error),
    source,
    isFatal,
  };
}

function installGlobalErrorHandler() {
  const scopedGlobal = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => ((
        error: unknown,
        isFatal?: boolean,
      ) => void) | undefined;
      setGlobalHandler?: (
        handler: (error: unknown, isFatal?: boolean) => void,
      ) => void;
    };
  };

  const errorUtils = scopedGlobal.ErrorUtils;
  if (!errorUtils?.setGlobalHandler) {
    return () => {};
  }

  const previousHandler = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    const details = normalizeRuntimeError(error, "global", isFatal);
    console.error("[mobile runtime error]", details);
    publishRuntimeError(details);
    previousHandler?.(error, isFatal);
  });

  return () => {
    if (previousHandler) {
      errorUtils.setGlobalHandler?.(previousHandler);
    }
  };
}

function RuntimeErrorScreen({
  error,
  onRetry,
}: {
  error: RuntimeErrorDetails;
  onRetry: () => void;
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: "#09090b",
        },
        container: {
          flex: 1,
          paddingHorizontal: 20,
          paddingVertical: 24,
          gap: 16,
        },
        badge: {
          alignSelf: "flex-start",
          borderRadius: 999,
          backgroundColor: "#7f1d1d",
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        badgeText: {
          color: "#fecaca",
          fontSize: 12,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        title: {
          color: "#fafafa",
          fontSize: 24,
          fontWeight: "700",
        },
        subtitle: {
          color: "#d4d4d8",
          fontSize: 14,
          lineHeight: 21,
        },
        meta: {
          color: "#a1a1aa",
          fontSize: 12,
        },
        card: {
          borderRadius: 16,
          backgroundColor: "#18181b",
          borderWidth: 1,
          borderColor: "#27272a",
          padding: 14,
          gap: 10,
          flex: 1,
        },
        cardLabel: {
          color: "#f4f4f5",
          fontSize: 13,
          fontWeight: "600",
        },
        errorText: {
          color: "#fda4af",
          fontSize: 13,
          lineHeight: 20,
        },
        stackText: {
          color: "#e4e4e7",
          fontSize: 12,
          lineHeight: 18,
        },
        button: {
          alignSelf: "flex-start",
          borderRadius: 12,
          backgroundColor: "#fafafa",
          paddingHorizontal: 14,
          paddingVertical: 10,
        },
        buttonText: {
          color: "#09090b",
          fontSize: 14,
          fontWeight: "600",
        },
      }),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>App crashed</Text>
        </View>
        <Text style={styles.title}>OrgNote hit a runtime error</Text>
        <Text style={styles.subtitle}>
          This screen is shown so installed builds expose the actual JS failure instead of
          closing immediately.
        </Text>
        <Text style={styles.meta}>
          source={error.source} fatal={String(error.isFatal ?? false)} platform={Platform.OS}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Message</Text>
          <Text selectable style={styles.errorText}>
            {error.message}
          </Text>
          {error.stack ? (
            <>
              <Text style={styles.cardLabel}>Stack</Text>
              <ScrollView>
                <Text selectable style={styles.stackText}>
                  {error.stack}
                </Text>
              </ScrollView>
            </>
          ) : null}
        </View>
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Retry render</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

class RuntimeErrorBoundaryInner extends Component<
  {
    children: ReactNode;
  },
  { error: RuntimeErrorDetails | null }
> {
  state = { error: null as RuntimeErrorDetails | null };

  static getDerivedStateFromError(error: Error) {
    return { error: normalizeRuntimeError(error, "react") };
  }

  componentDidCatch(error: Error) {
    const details = normalizeRuntimeError(error, "react");
    console.error("[mobile render error]", details);
    publishRuntimeError(details);
  }

  reset = () => {
    publishRuntimeError(null);
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <RuntimeErrorScreen error={this.state.error} onRetry={this.reset} />;
    }

    return this.props.children;
  }
}

export function RuntimeErrorBoundary({ children }: { children: ReactNode }) {
  const [globalError, setGlobalError] = useState<RuntimeErrorDetails | null>(null);

  useEffect(() => subscribeToRuntimeErrors(setGlobalError), []);
  useEffect(() => installGlobalErrorHandler(), []);

  if (globalError) {
    return (
      <RuntimeErrorScreen
        error={globalError}
        onRetry={() => publishRuntimeError(null)}
      />
    );
  }

  return <RuntimeErrorBoundaryInner>{children}</RuntimeErrorBoundaryInner>;
}
