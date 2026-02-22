"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Plus, ChevronsUpDownIcon } from "lucide-react";
import { type Group } from "@/lib/dummy-data";
import { Id } from "@/convex/_generated/dataModel";
import { CreateGroupDialog } from "@/components/dashboard/create-group-dialog";

/**
 * Convex group shape (from the database).
 */
export interface ConvexGroup {
  _id: Id<"groups">;
  title: string;
  color: string;
  _creationTime: number;
}

/**
 * A normalised item so the selector can render either shape.
 */
interface NormalisedGroup {
  id: string;
  label: string;
  color: string;
  bookmarkCount?: number;
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

type GroupSelectorProps =
  | {
    /** Legacy / demo mode — uses dummy-data Group[] */
    groups: Group[];
    selectedGroupId: string;
    onSelect: (groupId: string) => void;
    userId?: undefined;
  }
  | {
    /** Live mode — uses Convex groups */
    groups: ConvexGroup[];
    selectedGroupId: string;
    onSelect: (groupId: string) => void;
    userId: string;
  };

function isConvexGroup(g: Group | ConvexGroup): g is ConvexGroup {
  return "_id" in g;
}

function normalise(groups: Group[] | ConvexGroup[]): NormalisedGroup[] {
  return (groups as (Group | ConvexGroup)[]).map((g, i) => {
    if (isConvexGroup(g)) {
      return {
        id: g._id,
        label: g.title,
        color: g.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      };
    }
    return {
      id: g.id,
      label: g.name,
      color: g.color,
      bookmarkCount: g.bookmarkCount,
    };
  });
}

export function GroupSelector(props: GroupSelectorProps) {
  const { groups: rawGroups, selectedGroupId, onSelect, userId } = props;

  const groups = normalise(rawGroups);

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLiveMode = !!userId;

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          id="group-selector-trigger"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{
              backgroundColor:
                selectedGroup?.color ?? FALLBACK_COLORS[0],
            }}
          />
          {selectedGroup?.label ?? "Select Group"}
          <ChevronsUpDownIcon
            className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1.5">
              {groups.map((group) => (
                <button
                  key={group.id}
                  id={`group-option-${group.id}`}
                  onClick={() => {
                    onSelect(group.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="flex-1 text-left font-medium">
                    {group.label}
                  </span>
                  {group.id === selectedGroupId ? (
                    <Check className="size-4 text-foreground" />
                  ) : group.bookmarkCount !== undefined ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {group.bookmarkCount}
                    </span>
                  ) : null}
                </button>
              ))}

              <div className="my-1 h-px bg-border" />

              <button
                id="create-group-button"
                onClick={() => {
                  setOpen(false);
                  if (isLiveMode) {
                    setDialogOpen(true);
                  }
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                <span>Create Group</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create group dialog — only rendered in live mode */}
      {isLiveMode && (
        <CreateGroupDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={userId}
          onCreated={(newGroupId) => onSelect(newGroupId)}
        />
      )}
    </>
  );
}
