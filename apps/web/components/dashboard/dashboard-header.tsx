import { memo } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { GroupSelector } from "./group-selector";
import { UserInfo } from "./user-info";
import { DashboardLogo } from "./dashboard-logo";
import type { ConvexGroup } from "./group-selector";
import type { Id } from "@/convex/_generated/dataModel";

interface DashboardHeaderProps {
  groups: ConvexGroup[];
  effectiveGroupId: Id<"groups"> | Id<"vaultGroups"> | null;
  onSelectGroup: (id: Id<"groups"> | Id<"vaultGroups">) => void;
  loading?: boolean;
  createGroup: (args: { title: string; color: string }) => Promise<string>;
  showPublicButton: boolean;
  variant?: "dashboard" | "vault";
}

export const DashboardHeader = memo(function DashboardHeader({
  groups,
  effectiveGroupId,
  onSelectGroup,
  loading = false,
  createGroup,
  showPublicButton,
  variant,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <DashboardLogo />
          <span className="text-muted-foreground select-none">/</span>
          <GroupSelector
            showPublicButtonOrNot={showPublicButton}
            createNewGroup={createGroup}
            groups={groups}
            selectedGroupId={effectiveGroupId}
            onSelect={onSelectGroup}
            loading={loading}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AnimatedThemeToggler
            aria-label="Toggle theme"
            className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          />
          <UserInfo variant={variant} />
        </div>
      </div>
    </header>
  );
});
