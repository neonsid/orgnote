"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Plus, ChevronsUpDownIcon, Trash2Icon } from "lucide-react";
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

interface GroupSelectorProps {
    groups: ConvexGroup[];
    selectedGroupId: string;
    onSelect: (groupId: string) => void;
    userId: string;
}

export function GroupSelector({
    groups,
    selectedGroupId,
    onSelect,
    userId,
}: GroupSelectorProps) {
    const [open, setOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedGroup = groups.find((g) => g._id === selectedGroupId);

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
                    {selectedGroup?.title ?? "Select Group"}
                    <ChevronsUpDownIcon
                        className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                </button>

                {open && (
                    <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
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
                    </div>
                )}
            </div>

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
                        // If the deleted group was selected, switch to the first available group
                        if (deletedId === selectedGroupId && groups.length > 1) {
                            const nextGroup = groups.find((g) => g._id !== deletedId);
                            if (nextGroup) onSelect(nextGroup._id);
                        }
                    }}
                />
            )}
        </>
    );
}
