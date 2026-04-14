import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";

export type ThemedAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type ThemedAlertPayload = {
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
};

let setAlertGlobal: ((p: ThemedAlertPayload | null) => void) | null = null;

/**
 * Theme-aware replacement for `Alert.alert` (no system white dialog on dark mode).
 * Must be used under `ThemedAlertProvider`.
 */
export function showThemedAlert(
  title: string,
  message?: string,
  buttons?: ThemedAlertButton[]
): void {
  const payload: ThemedAlertPayload = {
    title,
    message,
    buttons:
      buttons && buttons.length > 0
        ? buttons
        : [{ text: "OK", style: "default" }],
  };
  queueMicrotask(() => {
    setAlertGlobal?.(payload);
  });
}

function ThemedAlertHost() {
  const { colors } = useAppTheme();
  const [payload, setPayload] = useState<ThemedAlertPayload | null>(null);

  useEffect(() => {
    setAlertGlobal = setPayload;
    return () => {
      setAlertGlobal = null;
    };
  }, []);

  const close = useCallback(() => setPayload(null), []);

  const handleButton = useCallback(
    (btn: ThemedAlertButton) => {
      void Promise.resolve(btn.onPress?.()).finally(() => {
        close();
      });
    },
    [close]
  );

  const styles = useMemo(() => makeAlertStyles(colors), [colors]);

  if (!payload) return null;

  const buttons = payload.buttons ?? [{ text: "OK", style: "default" as const }];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{payload.title}</Text>
          {payload.message ? (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.message}>{payload.message}</Text>
            </ScrollView>
          ) : null}
          <View style={styles.buttonRow}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              return (
                <Pressable
                  key={`${btn.text}-${i}`}
                  onPress={() => handleButton(btn)}
                  style={({ pressed }) => [
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeAlertStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      width: "100%",
      maxWidth: 360,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    messageScroll: {
      maxHeight: 220,
    },
    messageScrollContent: {
      paddingBottom: spacing.xs,
    },
    message: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    buttonRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.muted,
      minWidth: 88,
      alignItems: "center",
    },
    buttonCancel: {
      backgroundColor: "transparent",
    },
    buttonDestructive: {
      backgroundColor: `${colors.error}22`,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    buttonTextCancel: {
      color: colors.textSecondary,
      fontWeight: "500",
    },
    buttonTextDestructive: {
      color: colors.error,
    },
  });
}

export function ThemedAlertProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ThemedAlertHost />
    </>
  );
}
