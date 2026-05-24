import type { ReactNode } from "react";
import { Component, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMountEffect } from "@/hooks/use-mount-effect";

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
  return (
    <SafeAreaView className="flex-1 bg-[#09090b]">
      <View className="flex-1 gap-4 px-5 py-6">
        <View className="self-start rounded-full bg-[#7f1d1d] px-2.5 py-1.5">
          <Text className="text-xs font-bold uppercase tracking-wide text-[#fecaca]">
            App crashed
          </Text>
        </View>
        <Text className="text-2xl font-bold text-[#fafafa]">OrgNote hit a runtime error</Text>
        <Text className="text-sm leading-[21px] text-[#d4d4d8]">
          This screen is shown so installed builds expose the actual JS failure instead of
          closing immediately.
        </Text>
        <Text className="text-xs text-[#a1a1aa]">
          source={error.source} fatal={String(error.isFatal ?? false)} platform={Platform.OS}
        </Text>
        <View className="flex-1 gap-2.5 rounded-2xl border border-[#27272a] bg-[#18181b] p-3.5">
          <Text className="text-[13px] font-semibold text-[#f4f4f5]">Message</Text>
          <Text selectable className="text-[13px] leading-5 text-[#fda4af]">
            {error.message}
          </Text>
          {error.stack ? (
            <>
              <Text className="text-[13px] font-semibold text-[#f4f4f5]">Stack</Text>
              <ScrollView>
                <Text selectable className="text-xs leading-[18px] text-[#e4e4e7]">
                  {error.stack}
                </Text>
              </ScrollView>
            </>
          ) : null}
        </View>
        <Pressable
          onPress={onRetry}
          className="self-start rounded-xl bg-[#fafafa] px-3.5 py-2.5 active:bg-muted"
        >
          <Text className="text-sm font-semibold text-[#09090b]">Retry render</Text>
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

  useMountEffect(() => {
    const unsubscribe = subscribeToRuntimeErrors(setGlobalError);
    const teardownGlobalHandler = installGlobalErrorHandler();
    return () => {
      unsubscribe();
      teardownGlobalHandler();
    };
  });

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
