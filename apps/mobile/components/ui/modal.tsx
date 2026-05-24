import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  Text,
  View,
  type ModalProps as RNModalProps,
} from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

interface ModalProps extends RNModalProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: "center" | "bottom" | "top";
}

export function Modal({
  title,
  onClose,
  children,
  variant = "center",
  ...props
}: ModalProps) {
  const { colors } = useAppTheme();
  const isEdgeVariant = variant === "bottom" || variant === "top";

  return (
    <RNModal transparent animationType={isEdgeVariant ? "slide" : "fade"} onRequestClose={onClose} {...props}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
        keyboardVerticalOffset={0}
      >
        <Pressable
          className={cn(
            "flex-1 items-center justify-center bg-overlay",
            variant === "bottom" && "justify-end",
            variant === "top" && "justify-start"
          )}
          onPress={onClose}
        >
          <Pressable
            className={cn(
              "max-h-[80%] overflow-hidden bg-surface",
              variant === "center" && "w-[90%] max-w-[400px] rounded-lg",
              variant === "bottom" &&
                "w-full max-w-full rounded-t-xl rounded-b-none pb-8",
              variant === "top" &&
                "w-full max-w-full rounded-b-xl rounded-t-none pt-8"
            )}
            onPress={(e) => e.stopPropagation()}
          >
            {variant === "bottom" ? (
              <View className="mb-1 mt-2 h-1 w-9 self-center rounded-sm bg-border" />
            ) : null}
            {title ? (
              <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                <Text className="text-base font-semibold text-foreground">{title}</Text>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-muted active:bg-background"
                  onPress={onClose}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}
            {children}
            {variant === "top" ? (
              <View className="mb-2 mt-1 h-1 w-9 self-center rounded-sm bg-border" />
            ) : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
