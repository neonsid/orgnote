"use no memo";

import { useEffect, useState, type ComponentType } from "react";
import { ActivityIndicator, Text, View } from "react-native";

type NativeAuthViewProps = {
  mode: "signInOrUp";
  isDismissable: boolean;
};

export function NativeClerkAuthPanel() {
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
