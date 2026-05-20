import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";

export type FilterType = "all" | "read" | "unread";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "unread", label: "Not read" },
];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  value: FilterType;
  onChange: (filter: FilterType) => void;
}

export function FilterModal({ visible, onClose, value, onChange }: FilterModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} onClose={onClose} title="Filter by status">
      <View className="px-2 pb-3">
        {FILTERS.map((filter) => {
          const isSelected = value === filter.value;
          return (
            <Pressable
              key={filter.value}
              className={cn(
                "my-0.5 flex-row items-center justify-between rounded-sm px-3 py-3 active:bg-muted",
                isSelected && "bg-muted"
              )}
              onPress={() => {
                onChange(filter.value);
                onClose();
              }}
            >
              <Text className={cn("text-sm text-foreground", isSelected && "font-semibold")}>
                {filter.label}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={18} color={colors.text} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}
