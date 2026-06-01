import { SheetRow } from "@/components/ui/sheet-row";
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
  const visibleGroups = groups.filter((group) => group._id !== excludeGroupId);

  return (
    <>
      {visibleGroups.map((group, index) => {
        const dotColor = group.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
        return (
          <SheetRow
            key={group._id}
            title={group.title}
            dotColor={dotColor}
            onPress={() => onSelectGroup(group._id)}
          />
        );
      })}
    </>
  );
}
