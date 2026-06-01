import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ModalProps as RNModalProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

import { AppPressable } from "./app-pressable";

const DISMISS_THRESHOLD = 72;
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const SHEET_BODY_INSET = "px-4 pb-4";
export const MENU_BODY_INSET = "px-4 pb-4 pt-0";
export const COMPACT_MENU_MAX_WIDTH = 280;

interface ModalProps extends RNModalProps {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: "center" | "bottom" | "top";
  presentation?: "sheet" | "menu";
  compact?: boolean;
  scrollable?: boolean;
  flushBody?: boolean;
  onBack?: () => void;
  dismissOnBackdrop?: boolean;
  showCloseButton?: boolean;
  showHandle?: boolean;
}

function resolveVariant(variant: ModalProps["variant"]) {
  if (variant) return variant;
  return "bottom";
}

function SheetHandle() {
  return (
    <View className="items-center py-2.5" accessibilityElementsHidden importantForAccessibility="no">
      <View className="h-1 w-11 rounded-full bg-muted-foreground/45" />
    </View>
  );
}

function useSheetDismiss(isBottom: boolean, onClose: () => void) {
  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);

  function resetAndClose() {
    translateY.set(0);
    scrollY.set(0);
    onClose();
  }

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function createPanGesture(allowWhileScrolled = false) {
    if (!isBottom) {
      return Gesture.Pan().enabled(false);
    }
    return Gesture.Pan()
      .activeOffsetY(8)
      .onUpdate((event) => {
        if ((allowWhileScrolled || scrollY.value <= 0) && event.translationY > 0) {
          translateY.value = event.translationY;
        }
      })
      .onEnd((event) => {
        if (translateY.value > DISMISS_THRESHOLD || event.velocityY > 650) {
          runOnJS(resetAndClose)();
          return;
        }
        translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
      });
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(event.contentOffset.y);
    },
  });

  return {
    translateY,
    scrollY,
    resetAndClose,
    sheetAnimatedStyle,
    createPanGesture,
    scrollHandler,
  };
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  variant,
  presentation = "sheet",
  compact,
  scrollable = false,
  flushBody = false,
  onBack,
  dismissOnBackdrop = true,
  showCloseButton = true,
  showHandle,
  visible,
  ...props
}: ModalProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const resolvedVariant = resolveVariant(variant);
  const isBottom = resolvedVariant === "bottom";
  const isEdgeVariant = isBottom || resolvedVariant === "top";
  const isMenu = presentation === "menu";
  const isCompact = compact ?? isMenu;
  const shouldShowHandle = showHandle ?? !isCompact;

  const { resetAndClose, sheetAnimatedStyle, createPanGesture, scrollHandler } = useSheetDismiss(
    isBottom,
    onClose
  );

  const headerPan = createPanGesture(true);
  const bodyPan = createPanGesture(false);

  const bodyPadding = flushBody ? MENU_BODY_INSET : isMenu ? MENU_BODY_INSET : `${SHEET_BODY_INSET} pt-1`;
  const scrollPadding = flushBody
    ? MENU_BODY_INSET
    : isMenu
      ? MENU_BODY_INSET
      : `${SHEET_BODY_INSET} pt-1 pb-2`;

  const header = title || onBack || showCloseButton ? (
    <View className="flex-row items-start gap-3 px-4 pb-2 pt-1">
      {onBack ? (
        <AppPressable
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </AppPressable>
      ) : null}
      <View className="min-w-0 flex-1">
        {title ? (
          <Text className="font-sans text-lg font-semibold text-foreground">{title}</Text>
        ) : null}
        {subtitle ? (
          <Text className="mt-1 font-sans text-sm leading-5 text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showCloseButton ? (
        <AppPressable
          className="h-9 w-9 items-center justify-center rounded-full bg-muted"
          onPress={resetAndClose}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </AppPressable>
      ) : null}
    </View>
  ) : null;

  const dragHeader = isBottom && shouldShowHandle ? (
    <GestureDetector gesture={headerPan}>
      <Animated.View>
        <SheetHandle />
        {header}
      </Animated.View>
    </GestureDetector>
  ) : (
    header
  );

  const sheetBody = scrollable ? (
    <AnimatedScrollView
      className="max-h-[520px]"
      contentContainerClassName={scrollPadding}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {children}
    </AnimatedScrollView>
  ) : flushBody ? (
    children
  ) : (
    <View className={bodyPadding}>{children}</View>
  );

  const sheetInner = (
    <AppPressable onPress={(event) => event.stopPropagation()}>
      {dragHeader}
      {scrollable ? (
        sheetBody
      ) : isBottom ? (
        <GestureDetector gesture={bodyPan}>{sheetBody}</GestureDetector>
      ) : (
        sheetBody
      )}
    </AppPressable>
  );

  return (
    <RNModal
      transparent
      animationType={isEdgeVariant ? "slide" : "fade"}
      onRequestClose={resetAndClose}
      statusBarTranslucent
      visible={visible}
      {...props}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <AppPressable
          className={cn(
            "flex-1 bg-overlay",
            isBottom && (isCompact ? "items-center justify-end px-4" : "justify-end"),
            resolvedVariant === "top" && "justify-start",
            resolvedVariant === "center" && "items-center justify-center px-4"
          )}
          onPress={dismissOnBackdrop ? resetAndClose : undefined}
        >
          <Animated.View
            style={[
              isBottom ? sheetAnimatedStyle : undefined,
              isBottom
                ? isCompact
                  ? { marginBottom: Math.max(insets.bottom, 16) }
                  : { paddingBottom: Math.max(insets.bottom, 12) }
                : undefined,
              isEdgeVariant
                ? {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    ...Platform.select({
                      ios: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: isCompact ? 8 : -8 },
                        shadowOpacity: 0.35,
                        shadowRadius: isCompact ? 16 : 24,
                      },
                      android: { elevation: isCompact ? 12 : 16 },
                    }),
                  }
                : Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 0.4,
                      shadowRadius: 28,
                    },
                    android: { elevation: 12 },
                  }),
              isCompact ? { maxWidth: COMPACT_MENU_MAX_WIDTH, width: "100%" } : undefined,
            ]}
            className={cn(
              "overflow-hidden bg-card",
              resolvedVariant === "center" && "max-h-[85%] w-full max-w-[400px] rounded-2xl border border-border/40",
              isBottom &&
                (isCompact
                  ? "max-h-[70%] rounded-xl border border-border/40"
                  : "max-h-[90%] w-full rounded-t-[28px] border border-border/40"),
              resolvedVariant === "top" && "max-h-[90%] w-full rounded-b-[28px] border border-border/40"
            )}
          >
            {sheetInner}
          </Animated.View>
        </AppPressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
