import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { Modal } from "@/components/ui";
import { MenuGroup, MenuItem } from "@/components/ui/menu-item";
import { useAppTheme } from "@/contexts/app-theme";

export type FilterType = "all" | "read" | "unread";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All bookmarks" },
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
    <Modal
      visible={visible}
      onClose={onClose}
      title="Filter"
      subtitle="Show bookmarks by read status"
      variant="bottom"
      compact={false}
    >
      <MenuGroup>
        {FILTERS.map((filter) => {
          const isSelected = value === filter.value;
          return (
            <MenuItem
              key={filter.value}
              icon={
                filter.value === "all"
                  ? "albums-outline"
                  : filter.value === "read"
                    ? "checkmark-circle-outline"
                    : "ellipse-outline"
              }
              label={filter.label}
              onPress={() => {
                onChange(filter.value);
                onClose();
              }}
              trailing={
                isSelected ? (
                  <Ionicons name="checkmark" size={18} color={colors.primaryAccent} />
                ) : (
                  <View className="size-[18px] rounded-full border border-border" />
                )
              }
            />
          );
        })}
      </MenuGroup>
    </Modal>
  );
}
