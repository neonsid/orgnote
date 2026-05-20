import { type ReactElement } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { FALLBACK_COLORS } from "@goldfish/shared";

export type MoveTargetGroup = {
  _id: string;
  title: string;
  color?: string;
};

export function GroupMoveList({
  groups,
  excludeGroupId,
  onSelectGroup,
}: {
  groups: MoveTargetGroup[];
  excludeGroupId?: string | null;
  onSelectGroup: (groupId: string) => void;
}) {
  const rows: ReactElement[] = [];
  let fallbackIdx = 0;
  for (const group of groups) {
    if (group._id === excludeGroupId) continue;
    const dotColor = group.color ?? FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length];
    fallbackIdx += 1;
    rows.push(
      <Pressable
        key={group._id}
        className="mx-2 my-0.5 flex-row items-center gap-3 rounded-sm px-4 py-3 active:bg-muted"
        onPress={() => onSelectGroup(group._id)}
      >
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
        <Text className="text-sm text-foreground">{group.title}</Text>
      </Pressable>
    );
  }

  return (
    <ScrollView className="max-h-[250px]" showsVerticalScrollIndicator={false}>
      {rows}
    </ScrollView>
  );
}
