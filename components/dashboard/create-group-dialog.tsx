"use client";

import { useState, useCallback } from "react";
import { Loader2, Check } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GROUP_COLORS = [
    { value: "#f59e0b", label: "Amber" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#10b981", label: "Emerald" },
    { value: "#ef4444", label: "Red" },
    { value: "#8b5cf6", label: "Violet" },
    { value: "#ec4899", label: "Pink" },
    { value: "#06b6d4", label: "Cyan" },
    { value: "#f97316", label: "Orange" },
    { value: "#84cc16", label: "Lime" },
    { value: "#6366f1", label: "Indigo" },
    { value: "#14b8a6", label: "Teal" },
    { value: "#a855f7", label: "Purple" },
];

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    onCreated?: (groupId: string) => void;
}

export function CreateGroupDialog({
    open,
    onOpenChange,
    userId,
    onCreated,
}: CreateGroupDialogProps) {
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0].value);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createGroup = useMutation(api.groups.create);

    const handleCreate = useCallback(async () => {
        const trimmed = name.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newGroupId = await createGroup({
                title: trimmed,
                color: selectedColor,
                userId,
            });
            setName("");
            setSelectedColor(GROUP_COLORS[0].value);
            onOpenChange(false);
            onCreated?.(newGroupId);
        } catch (err) {
            console.error("Failed to create group:", err);
        } finally {
            setIsSubmitting(false);
        }
    }, [name, selectedColor, isSubmitting, createGroup, userId, onOpenChange, onCreated]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
            }
        },
        [handleCreate],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Create Group
                    </DialogTitle>
                    <DialogDescription>
                        Create a new group to organize your bookmarks.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 pt-1">
                    {/* Name field */}
                    <div className="grid gap-2">
                        <Label htmlFor="group-name" className="font-semibold">
                            Name
                        </Label>
                        <Input
                            id="group-name"
                            type="text"
                            placeholder="Enter group name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Color picker */}
                    <div className="grid gap-2">
                        <Label className="font-semibold">Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {GROUP_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    title={color.label}
                                    onClick={() => setSelectedColor(color.value)}
                                    className="relative size-8 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    style={{ backgroundColor: color.value }}
                                >
                                    {selectedColor === color.value && (
                                        <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow-sm" />
                                    )}
                                    {selectedColor === color.value && (
                                        <span className="absolute inset-0 rounded-full ring-2 ring-foreground/30 ring-offset-2 ring-offset-background" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Creating…
                            </>
                        ) : (
                            "Create"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
