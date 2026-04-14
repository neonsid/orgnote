import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal as RNModal, Pressable, StyleSheet, Text, View, type ModalProps as RNModalProps } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";

interface ModalProps extends RNModalProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: "center" | "bottom";
}

export function Modal({
  title,
  onClose,
  children,
  variant = "center",
  ...props
}: ModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "center",
          alignItems: "center",
        },
        overlayBottom: {
          justifyContent: "flex-end",
        },
        container: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          width: "90%",
          maxWidth: 400,
          maxHeight: "80%",
          overflow: "hidden",
        },
        containerBottom: {
          width: "100%",
          maxWidth: "100%",
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: spacing.xxxl,
        },
        handle: {
          width: 36,
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
          alignSelf: "center",
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        closeButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
      }),
    [colors]
  );

  return (
    <RNModal transparent animationType={variant === "bottom" ? "slide" : "fade"} onRequestClose={onClose} {...props}>
      <Pressable
        style={[styles.overlay, variant === "bottom" && styles.overlayBottom]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.container, variant === "bottom" && styles.containerBottom]}
          onPress={(e) => e.stopPropagation()}
        >
          {variant === "bottom" && <View style={styles.handle} />}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
