import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  inferAlertVariant,
  type AlertVariant,
} from "@/components/ui/alert-dialog";
import { useMountEffect } from "@/hooks/use-mount-effect";

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
  variant?: AlertVariant;
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
  buttons?: ThemedAlertButton[],
  options?: { variant?: AlertVariant }
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

  setAlertGlobal?.({
    title,
    message,
    buttons: normalizedButtons,
    variant: options?.variant,
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

  function close() {
    setPayload(null);
  }

  if (!payload) return null;

  const buttons = payload.buttons ?? [
    {
      text: "OK",
      style: "default" as const,
      _listKey: "themed-alert-default-ok-host",
    },
  ];

  const variant = payload.variant ?? inferAlertVariant(payload.title, buttons);
  const isConfirm = buttons.length > 1;

  return (
    <AlertDialog
      visible
      title={payload.title}
      message={payload.message}
      variant={variant}
      buttons={buttons}
      onDismiss={close}
      dismissOnBackdrop={!isConfirm}
    />
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
