"use client";

import { useState, useMemo, useCallback } from "react";
import { Fish } from "lucide-react";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { GroupSelector } from "@/components/dashboard/group-selector";
import { BookmarkSearch } from "@/components/dashboard/bookmark-search";
import { BookmarkList } from "@/components/dashboard/bookmark-list";
import { groups, bookmarks as initialBookmarks, type Bookmark } from "@/lib/dummy-data";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function extractDomain(input: string): string {
    try {
        const url = new URL(input.startsWith("http") ? input : `https://${input}`);
        return url.hostname.replace("www.", "");
    } catch {
        return "";
    }
}

export default function DashboardPage() {
    const [selectedGroupId, setSelectedGroupId] = useState("personal");
    const [search, setSearch] = useState("");
    const [tempBookmarks, setTempBookmarks] = useState<Bookmark[]>([]);

    const handleSubmit = useCallback(
        (value: string) => {
            const domain = extractDomain(value);
            const isUrl = domain.includes(".");
            const title = isUrl ? domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1) : value;

            const newBookmark: Bookmark = {
                id: `temp-${Date.now()}`,
                title,
                domain: isUrl ? domain : "",
                url: isUrl ? (value.startsWith("http") ? value : `https://${value}`) : "#",
                favicon: isUrl
                    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                    : null,
                fallbackColor: COLORS[Math.floor(Math.random() * COLORS.length)],
                createdAt: new Date().toISOString().split("T")[0],
                groupId: selectedGroupId,
            };

            setTempBookmarks((prev) => [newBookmark, ...prev]);
            setSearch("");
        },
        [selectedGroupId]
    );

    const allBookmarks = useMemo(() => {
        const groupTemp = tempBookmarks.filter((b) => b.groupId === selectedGroupId);
        const groupInitial = initialBookmarks.filter((b) => b.groupId === selectedGroupId);
        return [...groupTemp, ...groupInitial];
    }, [selectedGroupId, tempBookmarks]);

    const filteredBookmarks = useMemo(() => {
        if (!search.trim()) return allBookmarks;
        const q = search.toLowerCase();
        return allBookmarks.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                b.domain.toLowerCase().includes(q)
        );
    }, [allBookmarks, search]);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Dashboard header */}
            <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-14 items-center justify-between px-3 sm:px-6">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
                        >
                            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center">
                                <Fish className="size-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                            </div>
                        </Link>
                        <span className="text-muted-foreground select-none">/</span>
                        <GroupSelector
                            groups={groups}
                            selectedGroupId={selectedGroupId}
                            onSelect={setSelectedGroupId}
                        />
                    </div>

                    <div className="flex items-center justify-center rounded-md border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <AnimatedThemeToggler aria-label="Toggle theme" />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                <div className="mb-4 sm:mb-6">
                    <BookmarkSearch
                        value={search}
                        onChange={setSearch}
                        onSubmit={handleSubmit}
                    />
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <BookmarkList bookmarks={filteredBookmarks} />
                </div>

                <div className="mt-3 sm:mt-4 px-1 text-xs text-muted-foreground">
                    {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? "s" : ""}
                    {search && " found"}
                </div>
            </main>
        </div>
    );
}
