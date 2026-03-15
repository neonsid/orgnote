"use client";

import { useState, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Id } from "@/convex/_generated/dataModel";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { UserInfo } from "@/components/dashboard/user-info";
import { useDialogStore } from "@/stores/dialog-store";
import dynamic from "next/dynamic";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";

const CreateVaultGroupDialog = dynamic(
  () =>
    import("./dialog/create-vault-group-dialog").then(
      (m) => m.CreateVaultGroupDialog,
    ),
  { ssr: false },
);

interface VaultGroup {
  _id: Id<"vaultGroups">;
  title: string;
  color: string;
  userId: string;
  createdAt: number;
}

interface VaultHeaderProps {
  groups: VaultGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onCreated: (groupId: string) => void;
  isLoading?: boolean;
}

const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const Logo = memo(function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
    >
      <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center p-1">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={24}
          height={24}
          className="size-5"
        />
      </div>
    </Link>
  );
});

export const VaultHeader = memo(function VaultHeader({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreated,
  isLoading,
}: VaultHeaderProps) {
  const { createGroup, openCreateGroup, closeCreateGroup } = useDialogStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Logo />
          <span className="text-muted-foreground select-none">/</span>

          <VaultGroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={onSelectGroup}
            onOpenCreate={openCreateGroup}
            isLoading={isLoading}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AnimatedThemeToggler
            aria-label="Toggle theme"
            className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          />
          <UserInfo variant="vault" />
        </div>
      </div>

      {createGroup.open && (
        <CreateVaultGroupDialog
          open={createGroup.open}
          onOpenChange={closeCreateGroup}
          onCreated={(newGroupId) => {
            onSelectGroup(newGroupId);
            onCreated(newGroupId);
            closeCreateGroup();
          }}
        />
      )}
    </header>
  );
});

interface VaultGroupSelectorProps {
  groups: VaultGroup[];
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  onOpenCreate: () => void;
  isLoading?: boolean;
}

function VaultGroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  onOpenCreate,
  isLoading,
}: VaultGroupSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedGroup = groups.find((g) => g._id === selectedGroupId);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-sm sm:text-base font-semibold text-foreground hover:bg-muted transition-colors min-w-0 max-w-[160px] sm:max-w-none">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: selectedGroup?.color ?? FALLBACK_COLORS[0],
            }}
          />
          <span className="truncate">
            {isLoading ? (
              <span className="flex items-center gap-1.5">Loading...</span>
            ) : selectedGroupId ? (
              (selectedGroup?.title ??
              (groups.length === 0 ? "No groups" : "Select Group"))
            ) : groups.length === 0 ? (
              "No groups"
            ) : (
              "Select Group"
            )}
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
                <p className="text-sm text-muted-foreground">No groups found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a group to get started
                </p>
              </div>
            ) : (
              groups.map((group, i) => (
                <button
                  key={group._id}
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
                  <span className="flex-1 text-left font-medium truncate">
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
              onClick={() => {
                setOpen(false);
                onOpenCreate();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="size-4" />
              <span className="font-medium">Create Group</span>
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
