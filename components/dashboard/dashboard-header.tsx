import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { GroupSelector } from "./group-selector";
import { UserInfo } from "./user-info";
import type { ConvexGroup } from "./group-selector";

// Memoized logo - never rerenders
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

interface DashboardHeaderProps {
  groups: ConvexGroup[];
  effectiveGroupId: string;
  onSelectGroup: (id: string) => void;
  userId: string;
  user: { id: string; name: string; email: string; image?: string | null };
  loading?: boolean;
}

export const DashboardHeader = memo(function DashboardHeader({
  groups,
  effectiveGroupId,
  onSelectGroup,
  userId,
  user,
  loading = false,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Logo />
          <span className="text-muted-foreground select-none">/</span>
          <GroupSelector
            groups={groups}
            selectedGroupId={effectiveGroupId}
            onSelect={onSelectGroup}
            userId={userId}
            loading={loading}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme toggler — hidden on mobile, shown in UserInfo dropdown instead */}
          <AnimatedThemeToggler
            aria-label="Toggle theme"
            className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          />
          <UserInfo user={user} />
        </div>
      </div>
    </header>
  );
});
