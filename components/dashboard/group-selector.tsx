"use client";

import { useState, memo } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import Plus from "lucide-react/dist/esm/icons/plus";
import ChevronsUpDownIcon from "lucide-react/dist/esm/icons/chevrons-up-down";
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Id } from "@/convex/_generated/dataModel";
import { CreateGroupDialog } from "@/components/dashboard/create-group-dialog";
import { DeleteGroupDialog } from "@/components/dashboard/delete-group-dialog";

/**
 * Convex group shape (from the database).
 */
export interface ConvexGroup {
  _id: Id<"groups">;
  title: string;
  color: string;
  _creationTime: number;
}

export const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

interface GroupSelectorProps {
  groups: ConvexGroup[];
  selectedGroupId: string;
  onSelect: (groupId: string) => void;
  userId: string;
}

export const GroupSelector = memo(function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  userId,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedGroup = groups.find((g) => g._id === selectedGroupId);

  return (
    <>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            id="group-selector-trigger"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-sm sm:text-base font-semibold text-foreground hover:bg-muted transition-colors min-w-0 max-w-[160px] sm:max-w-none"
          >
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: selectedGroup?.color ?? FALLBACK_COLORS[0],
              }}
            />
            <span className="truncate">
              {selectedGroup?.title ?? "Select Group"}
            </span>
            <ChevronsUpDownIcon
              className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 min-w-[200px] rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="p-1.5">
              {groups.map((group, i) => (
                <button
                  key={group._id}
                  id={`group-option-${group._id}`}
                  onClick={() => {
                    onSelect(group._id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        group.color ||
                        FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    }}
                  />
                  <span className="flex-1 text-left font-medium">
                    {group.title}
                  </span>
                  {group._id === selectedGroupId && (
                    <Check className="size-4 text-foreground" />
                  )}
                </button>
              ))}

              <div className="my-1 h-px bg-border" />

              <button
                id="create-group-button"
                onClick={() => {
                  setOpen(false);
                  setCreateDialogOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                <span className="font-medium">Create Group</span>
              </button>
              <button
                id="delete-group-button"
                onClick={() => {
                  setOpen(false);
                  if (selectedGroup) {
                    setDeleteDialogOpen(true);
                  }
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
              >
                <Trash2Icon className="size-4 text-destructive" />
                <span className="font-medium text-destructive">
                  Delete Group
                </span>
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Create group dialog */}
      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={userId}
        onCreated={(newGroupId) => onSelect(newGroupId)}
      />

      {/* Delete group confirmation dialog */}
      {selectedGroup && (
        <DeleteGroupDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          userId={userId}
          groupId={selectedGroup._id}
          groupTitle={selectedGroup.title}
          groupColor={selectedGroup.color || FALLBACK_COLORS[0]}
          onDeleted={(deletedId) => {
            if (deletedId === selectedGroupId && groups.length > 1) {
              const nextGroup = groups.find((g) => g._id !== deletedId);
              if (nextGroup) onSelect(nextGroup._id);
            }
          }}
        />
      )}
    </>
  );
});
