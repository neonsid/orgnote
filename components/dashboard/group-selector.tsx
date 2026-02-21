"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, ChevronsUpDownIcon } from "lucide-react";
import { type Group } from "@/lib/dummy-data";

interface GroupSelectorProps {
  groups: Group[];
  selectedGroupId: string;
  onSelect: (groupId: string) => void;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        id="group-selector-trigger"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: selectedGroup?.color }}
        />
        {selectedGroup?.name}
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
                  {group.name}
                </span>
                {group.id === selectedGroupId ? (
                  <Check className="size-4 text-foreground" />
                ) : (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {group.bookmarkCount}
                  </span>
                )}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              id="create-group-button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="size-4" />
              <span>Create Group</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
