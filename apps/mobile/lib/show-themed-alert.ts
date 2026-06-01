import type { AlertVariant } from "@/lib/infer-alert-variant";

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

export function registerThemedAlertHost(
  setPayload: (payload: ThemedAlertPayload | null) => void
): () => void {
  setAlertGlobal = setPayload;
  return () => {
    setAlertGlobal = null;
  };
}
