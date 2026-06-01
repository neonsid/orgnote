import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";

interface ScreenShellProps extends ViewProps {
  children?: ReactNode;
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ScreenShell({
  children,
  header,
  className,
  contentClassName,
  ...props
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn("flex-1 bg-background", className)}
      style={{ paddingTop: insets.top }}
      {...props}
    >
      {header ? (
        <View className="border-b border-border bg-background/95">{header}</View>
      ) : null}
      <View className={cn("flex-1", contentClassName)}>{children}</View>
    </View>
  );
}
