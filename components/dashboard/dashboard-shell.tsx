"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/convex/_generated/api";
import { DashboardHeader } from "./dashboard-header";
import { FilterDropdown, type FilterType } from "./filter-dropdown";
import { BookmarkSearch } from "./bookmark-search";
import { DashboardContent } from "./dashboard-content";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

export function DashboardShell() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const handleSubmit = useCallback(async (_value: string) => {
    // This will be handled by the DashboardContent component
    // For now, just clear the input
    setDebouncedQuery("");
  }, []);

  // Loading state - full page spinner
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Please sign in to view your dashboard.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Header with loading state for groups */}
      <DashboardHeaderWrapper user={session.user} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-2 sm:mt-10">
        {/* Search and Filter - always visible */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1">
            <BookmarkSearch
              onSearch={setDebouncedQuery}
              onSubmit={handleSubmit}
            />
          </div>
          <FilterDropdown value={filter} onChange={setFilter} />
        </div>

        {/* Column Headers - always visible */}
        <div className="flex items-center justify-between px-3 mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Title
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Created At
          </span>
        </div>

        {/* Animated Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="origin-left mb-2 px-2"
        >
          <div className="h-px bg-foreground/20 dark:bg-white/80" />
        </motion.div>

        {/* Content Area with Motion Loading */}
        <DashboardContent debouncedQuery={debouncedQuery} filter={filter} />
      </main>
    </div>
  );
}

// Wrapper component to handle header with groups data
function DashboardHeaderWrapper({
  user,
}: {
  user: { id: string; name: string; email: string; image?: string | null };
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const groups = useQuery(api.groups.list, userId ? { userId } : "skip");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const effectiveGroupId = useMemo(() => {
    if (selectedGroupId && groups?.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groups?.[0]?._id ?? "";
  }, [selectedGroupId, groups]);

  // Show simplified header while loading
  if (groups === undefined) {
    return (
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center p-1 animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="size-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <DashboardHeader
          groups={groups}
          effectiveGroupId={effectiveGroupId}
          onSelectGroup={setSelectedGroupId}
          userId={userId}
          user={user}
        />
      </motion.div>
    </AnimatePresence>
  );
}
