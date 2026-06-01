import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

import { AppPressable } from "./app-pressable";

interface SheetRowProps {
  title: string;
  subtitle?: string;
  dotColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconTint?: string;
  titleTone?: "default" | "primary" | "success" | "warning" | "cyan";
  selected?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("py-1", className)}>{children}</View>;
}

export function SheetRow({
  title,
  subtitle,
  dotColor,
  icon,
  iconColor,
  iconTint,
  titleTone = "default",
  selected = false,
  destructive = false,
  onPress,
  showChevron = false,
  disabled = false,
  className,
}: SheetRowProps) {
  const { colors } = useAppTheme();

  const resolvedIconColor =
    iconColor ?? (destructive ? colors.error : colors.textSecondary);

  const titleClass = cn(
    "font-sans text-base text-foreground",
    iconTint && "font-medium",
    selected && "font-medium text-primary-accent",
    destructive && "text-destructive",
    titleTone === "primary" && "font-medium text-primary-accent",
    titleTone === "success" && "font-medium text-success",
    titleTone === "warning" && "font-medium text-warning",
    titleTone === "cyan" && "font-medium text-brand-cyan"
  );

  const leading = dotColor ? (
    <View className="size-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
  ) : icon ? (
    iconTint ? (
      <View
        className="size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconTint }}
      >
        <Ionicons name={icon} size={20} color={resolvedIconColor} />
      </View>
    ) : (
      <Ionicons name={icon} size={20} color={resolvedIconColor} />
    )
  ) : null;

  const content = (
    <>
      {leading}

      <View className="min-w-0 flex-1">
        <Text className={titleClass} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 font-sans text-xs text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <Ionicons name="checkmark" size={18} color={colors.primaryAccent} />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </>
  );

  const rowClass = cn(
    "flex-row items-center gap-3 rounded-xl px-3",
    iconTint ? "py-2.5" : "py-2.5",
    selected && "bg-accent/50",
    disabled && "opacity-45",
    className
  );

  if (onPress) {
    return (
      <AppPressable
        onPress={onPress}
        disabled={disabled}
        className={cn(rowClass, "active:bg-accent")}
      >
        {content}
      </AppPressable>
    );
  }

  return <View className={rowClass}>{content}</View>;
}

export function SheetDivider() {
  return <View className="my-2 h-px bg-border" />;
}

export function SheetSectionLabel({ children }: { children: string }) {
  return (
    <Text className="pb-1.5 pt-2 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </Text>
  );
}
