import { Text, View } from "react-native";

import { cn } from "@/lib/cn";

import { AppPressable } from "./app-pressable";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View className={cn("flex-row rounded-xl bg-muted p-1", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <AppPressable
            key={option.value}
            haptic
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-1 items-center justify-center rounded-lg px-3 py-2.5",
              selected && "bg-card shadow-sm"
            )}
          >
            <Text
              className={cn(
                "font-sans text-sm text-muted-foreground",
                selected && "font-semibold text-foreground"
              )}
            >
              {option.label}
            </Text>
          </AppPressable>
        );
      })}
    </View>
  );
}
