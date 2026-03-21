"use client";

import { useState, memo } from "react";
import {
  Check,
  Plus,
  ChevronsUpDown,
  Trash2,
  Globe,
  Lock,
  Pencil,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Id } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { useDialogStore } from "@/stores/dialog-store";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "@/lib/toast";

const CreateGroupDialog = dynamic(
  () => import("@/components/dialogs").then((m) => m.CreateGroupDialog),
  { ssr: false },
);

const DeleteGroupDialog = dynamic(
  () => import("@/components/dialogs").then((m) => m.DeleteGroupDialog),
  { ssr: false },
);

const RenameGroupDialog = dynamic(
  () => import("@/components/dialogs").then((m) => m.RenameGroupDialog),
  { ssr: false },
);
/**
 * Convex group shape (from the database).
 */
export interface ConvexGroup {
  _id: Id<"groups"> | Id<"vaultGroups">;
  title: string;
  color: string;
  isPublic?: boolean;
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
  selectedGroupId: Id<"groups"> | Id<"vaultGroups"> | null;
  onSelect: (groupId: Id<"groups"> | Id<"vaultGroups">) => void;
  loading?: boolean;
  createNewGroup: (args: { title: string; color: string }) => Promise<string>;
  showPublicButtonOrNot: boolean;
}

export const GroupSelector = memo(function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  loading = false,
  createNewGroup,
  showPublicButtonOrNot,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);

  const {
    createGroup,
    editGroup,
    deleteGroup,
    openCreateGroup,
    closeCreateGroup,
    openDeleteGroupDialog,
    closeDeleteGroupDialog,
    openGroupRenameDialog,
    closeGroupRenameDialog,
  } = useDialogStore();

  const toggleGroupPublic = useMutation(api.groups.mutations.toggleGroupPublic);
  const selectedGroup = groups.find((g) => g._id === selectedGroupId);

  const handleTogglePublic = async () => {
    if (!selectedGroup) return;

    try {
      const result = await toggleGroupPublic({
        groupId: selectedGroup._id as Id<"groups">,
      });
      toast.success(
        result.isPublic ? "Group is now public" : "Group is now private",
      );
    } catch {
      toast.error("Failed to update group visibility");
    }
  };

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
              {loading
                ? "Loading..."
                : (selectedGroup?.title ??
                  (groups.length === 0 ? "No groups" : "Select Group"))}
            </span>
            <ChevronsUpDown
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
              {groups.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No groups found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a group to get started
                  </p>
                </div>
              ) : (
                groups.map((group, i) => (
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
                ))
              )}

              <div className="my-1 h-px bg-border" />
              <button
                id="create-group-button"
                onClick={() => {
                  setOpen(false);
                  openCreateGroup();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                <span className="font-medium">Create Group</span>
              </button>
              {groups.length > 0 && selectedGroup && (
                <>
                  <button
                    id="rename-group-button"
                    onClick={() => {
                      setOpen(false);
                      openGroupRenameDialog(selectedGroup._id as Id<"groups">);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                    <span className="font-medium">Rename</span>
                  </button>
                  {showPublicButtonOrNot && (
                    <button
                      id="toggle-group-public-button"
                      onClick={() => {
                        handleTogglePublic();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {selectedGroup.isPublic === true ? (
                        <>
                          <Globe className="size-4 text-muted-foreground" />
                          <span className="font-medium">Make Private</span>
                          <Check className="size-4 text-foreground ml-auto" />
                        </>
                      ) : (
                        <>
                          <Lock className="size-4 text-muted-foreground" />
                          <span className="font-medium">Make Public</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    id="delete-group-button"
                    onClick={() => {
                      setOpen(false);
                      openDeleteGroupDialog(selectedGroup._id as Id<"groups">);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Trash2 className="size-4 text-destructive" />
                    <span className="font-medium text-destructive">
                      Delete Group
                    </span>
                  </button>
                </>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Create group dialog — only mount when open */}
      {createGroup.open && (
        <CreateGroupDialog
          onCreate={createNewGroup}
          open={createGroup.open}
          onOpenChange={closeCreateGroup}
          onCreated={(newGroupId) => {
            onSelect(newGroupId as Id<"groups"> | Id<"vaultGroups">);
            closeCreateGroup();
          }}
        />
      )}

      {/* Rename group dialog — only mount when open */}
      {editGroup.open && editGroup.groupId && (
        <RenameGroupDialog
          title={selectedGroup?.title}
          color={selectedGroup?.color}
          open={editGroup.open}
          onOpenChange={closeGroupRenameDialog}
          groupId={editGroup.groupId as Id<"groups">}
        />
      )}

      {/* Delete group confirmation dialog — only mount when open */}
      {deleteGroup.open && deleteGroup.groupId && (
        <DeleteGroupDialog
          open={deleteGroup.open}
          onOpenChange={closeDeleteGroupDialog}
          groupId={deleteGroup.groupId as Id<"groups">}
          groupTitle={selectedGroup?.title || ""}
          groupColor={selectedGroup?.color || FALLBACK_COLORS[0]}
          onDeleted={(deletedId) => {
            closeDeleteGroupDialog();
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
