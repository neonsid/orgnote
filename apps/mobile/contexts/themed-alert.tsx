import { useState, type ReactNode } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { inferAlertVariant } from "@/lib/infer-alert-variant";
import {
  registerThemedAlertHost,
  type ThemedAlertPayload,
} from "@/lib/show-themed-alert";

function ThemedAlertHost() {
  const [payload, setPayload] = useState<ThemedAlertPayload | null>(null);

  useMountEffect(() => registerThemedAlertHost(setPayload));

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
