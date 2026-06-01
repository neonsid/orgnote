import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
import type { AlertVariant } from "@/lib/infer-alert-variant";

import { AppPressable } from "./app-pressable";
import { Modal } from "./modal";

export type { AlertVariant } from "@/lib/infer-alert-variant";

export type AlertDialogButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
  _listKey?: string;
};

type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  variant?: AlertVariant;
  buttons: AlertDialogButton[];
  onDismiss: () => void;
  dismissOnBackdrop?: boolean;
};

type VariantConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  tint: (colors: ReturnType<typeof useAppTheme>["colors"]) => string;
  color: (colors: ReturnType<typeof useAppTheme>["colors"]) => string;
};

const VARIANT_CONFIG: Record<AlertVariant, VariantConfig> = {
  success: {
    icon: "checkmark-circle",
    tint: (c) => `${c.success}20`,
    color: (c) => c.success,
  },
  error: {
    icon: "close-circle",
    tint: (c) => `${c.error}20`,
    color: (c) => c.error,
  },
  warning: {
    icon: "warning",
    tint: (c) => `${c.warning}20`,
    color: (c) => c.warning,
  },
  destructive: {
    icon: "alert-circle",
    tint: (c) => `${c.error}20`,
    color: (c) => c.error,
  },
  info: {
    icon: "information-circle",
    tint: (c) => `${c.primaryAccent}20`,
    color: (c) => c.primaryAccent,
  },
};

const ALERT_TONE_CLASSES = {
  primary: "bg-primary-accent active:opacity-90",
  secondary: "border border-border bg-muted active:bg-accent",
  destructive: "bg-destructive active:opacity-90",
  ghost: "bg-transparent active:bg-accent",
} as const;

const ALERT_TEXT_CLASSES = {
  primary: "text-white",
  secondary: "text-foreground",
  destructive: "text-destructive-foreground",
  ghost: "text-muted-foreground",
} as const;

function AlertActionButton({
  label,
  tone,
  onPress,
  className,
}: {
  label: string;
  tone: "primary" | "secondary" | "destructive" | "ghost";
  onPress: () => void;
  className?: string;
}) {
  return (
    <AppPressable
      onPress={onPress}
      className={cn(
        "h-11 min-w-[96px] flex-1 items-center justify-center rounded-xl px-4",
        ALERT_TONE_CLASSES[tone],
        className
      )}
    >
      <Text className={cn("font-sans text-sm font-semibold", ALERT_TEXT_CLASSES[tone])}>{label}</Text>
    </AppPressable>
  );
}

export function AlertDialog({
  visible,
  title,
  message,
  variant = "info",
  buttons,
  onDismiss,
  dismissOnBackdrop = true,
}: AlertDialogProps) {
  const { colors } = useAppTheme();
  const config = VARIANT_CONFIG[variant];
  const isConfirm = buttons.length > 1;
  const cancelButton = buttons.find((btn) => btn.style === "cancel");
  const primaryButtons = buttons.filter((btn) => btn.style !== "cancel");

  function handleButton(btn: AlertDialogButton) {
    void Promise.resolve(btn.onPress?.()).finally(onDismiss);
  }

  return (
    <Modal
      visible={visible}
      onClose={onDismiss}
      variant="center"
      showCloseButton={false}
      showHandle={false}
      dismissOnBackdrop={dismissOnBackdrop && !isConfirm}
    >
      <View className="items-center px-1 pb-1 pt-3">
        <View
          className="mb-4 size-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: config.tint(colors) }}
        >
          <Ionicons name={config.icon} size={30} color={config.color(colors)} />
        </View>

        <Text className="text-center font-sans text-lg font-semibold leading-6 text-foreground">
          {title}
        </Text>

        {message ? (
          <ScrollView className="mt-2 max-h-36 w-full" showsVerticalScrollIndicator={false}>
            <Text className="text-center font-sans text-sm leading-5 text-muted-foreground">
              {message}
            </Text>
          </ScrollView>
        ) : null}

        <View className={cn("mt-6 w-full gap-2.5", isConfirm ? "flex-row" : "")}>
          {isConfirm ? (
            <>
              {cancelButton ? (
                <AlertActionButton
                  label={cancelButton.text}
                  tone="secondary"
                  onPress={() => handleButton(cancelButton)}
                />
              ) : null}
              {primaryButtons.map((btn) => (
                <AlertActionButton
                  key={btn._listKey ?? btn.text}
                  label={btn.text}
                  tone={btn.style === "destructive" ? "destructive" : "primary"}
                  onPress={() => handleButton(btn)}
                />
              ))}
            </>
          ) : (
            buttons.map((btn) => (
              <AlertActionButton
                key={btn._listKey ?? btn.text}
                label={btn.text}
                tone="primary"
                onPress={() => handleButton(btn)}
                className="w-full flex-none"
              />
            ))
          )}
        </View>
      </View>
    </Modal>
  );
}
