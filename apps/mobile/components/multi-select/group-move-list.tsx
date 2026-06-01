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
  let fallbackIdx = 0;

  return (
    <>
      {groups.map((group) => {
        if (group._id === excludeGroupId) return null;
        const dotColor = group.color ?? FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length];
        fallbackIdx += 1;
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
