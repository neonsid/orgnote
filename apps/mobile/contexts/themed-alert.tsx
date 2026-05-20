import { useCallback, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useMountEffect } from "@/hooks/use-mount-effect";
import { cn } from "@/lib/cn";

export type ThemedAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
  /** Populated internally by {@link showThemedAlert}; stable key for rendering. */
  _listKey?: string;
};

export type ThemedAlertPayload = {
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
};

let setAlertGlobal: ((p: ThemedAlertPayload | null) => void) | null = null;

let alertButtonKeyCounter = 0;

function nextAlertButtonKey(button: ThemedAlertButton): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return uuid;
  } catch {
    // React Native / Hermes may not expose crypto.
  }
  alertButtonKeyCounter += 1;
  return `alert-${alertButtonKeyCounter}-${button.style ?? "default"}-${button.text}`;
}

/**
 * Theme-aware replacement for `Alert.alert` (no system white dialog on dark mode).
 * Must be used under `ThemedAlertProvider`.
 */
export function showThemedAlert(
  title: string,
  message?: string,
  buttons?: ThemedAlertButton[]
): void {
  const normalizedButtons: ThemedAlertButton[] =
    buttons && buttons.length > 0
      ? buttons.map((b) => ({
          ...b,
          _listKey: nextAlertButtonKey(b),
        }))
      : [
          {
            text: "OK",
            style: "default",
            _listKey: "themed-alert-default-ok",
          },
        ];

  const payload: ThemedAlertPayload = {
    title,
    message,
    buttons: normalizedButtons,
  };

  queueMicrotask(() => {
    setAlertGlobal?.(payload);
  });
}

function ThemedAlertHost() {
  const [payload, setPayload] = useState<ThemedAlertPayload | null>(null);

  useMountEffect(() => {
    setAlertGlobal = setPayload;
    return () => {
      setAlertGlobal = null;
    };
  });

  const close = useCallback(() => setPayload(null), []);

  const handleButton = useCallback(
    (btn: ThemedAlertButton) => {
      void Promise.resolve(btn.onPress?.()).finally(() => {
        close();
      });
    },
    [close]
  );

  if (!payload) return null;

  const buttons = payload.buttons ?? [
    {
      text: "OK",
      style: "default" as const,
      _listKey: "themed-alert-default-ok-host",
    },
  ];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-overlay p-4"
        onPress={close}
      >
        <Pressable
          className="w-full max-w-[360px] gap-3 rounded-lg border border-border bg-surface p-4"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-[17px] font-semibold text-foreground">{payload.title}</Text>
          {payload.message ? (
            <ScrollView
              className="max-h-[220px]"
              contentContainerClassName="pb-1"
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-[15px] leading-[22px] text-secondary-foreground">
                {payload.message}
              </Text>
            </ScrollView>
          ) : null}
          <View className="mt-1 flex-row flex-wrap justify-end gap-2">
            {buttons.map((btn) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              return (
                <Pressable
                  key={btn._listKey ?? btn.text}
                  onPress={() => handleButton(btn)}
                  className={cn(
                    "min-w-[88px] items-center rounded-sm bg-muted px-4 py-2.5 active:bg-muted",
                    isCancel && "bg-transparent",
                    isDestructive && "bg-destructive/15"
                  )}
                >
                  <Text
                    className={cn(
                      "text-[15px] font-semibold text-foreground",
                      isCancel && "font-medium text-secondary-foreground",
                      isDestructive && "text-destructive"
                    )}
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

export function ThemedAlertProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ThemedAlertHost />
    </>
  );
}
