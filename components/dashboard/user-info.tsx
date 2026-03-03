"use client";

import { useState, useRef, useEffect, memo, useDeferredValue } from "react";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Settings from "lucide-react/dist/esm/icons/settings";
import Keyboard from "lucide-react/dist/esm/icons/keyboard";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useIsSmallMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import UserIcon from "lucide-react/dist/esm/icons/user";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const KeyboardShortcutsDialog = dynamic(
  () =>
    import("@/components/dashboard/keyboard-shortcuts-dialog").then(
      (m) => m.KeyboardShortcutsDialog,
    ),
  { ssr: false },
);

const UserSettingsDialog = dynamic(
  () =>
    import("@/components/dashboard/settings").then((m) => m.UserSettingsDialog),
  { ssr: false },
);

interface UserInfoProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export const UserInfo = memo(function UserInfo({ user }: UserInfoProps) {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isSmallMobile = useIsSmallMobile();

  // Defer profile query - not needed for initial page load
  const [enableProfileQuery, setEnableProfileQuery] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setEnableProfileQuery(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const profile = useQuery(
    api.profile.getProfile,
    enableProfileQuery ? { userId: user.id } : "skip",
  );
  const hasPublicProfile = profile?.isPublic && profile?.username;

  const initial = user.name?.charAt(0)?.toUpperCase() ?? "U";

  const maxLen = 14;
  const displayName =
    user.name.length > maxLen ? user.name.slice(0, maxLen) + "…" : user.name;

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };
  const themeToggleRef = useRef<{ toggle: () => void }>(null);

  const handlePublicProfileClick = () => {
    setOpen(false);
    if (profile?.username) {
      router.push(`/u/${profile.username}`);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          id="user-info-trigger"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-1.5 sm:px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {user.image ? (
            <Image
              width={24}
              height={24}
              src={user.image}
              alt={user.name}
              className="size-6 rounded-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center size-6 rounded-full bg-muted-foreground text-background text-xs font-bold select-none">
              {initial}
            </span>
          )}
          <span className="hidden sm:inline max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-55 rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1.5">
              {isSmallMobile && (
                <>
                  <button
                    id="theme-changing-button"
                    onClick={() => themeToggleRef.current?.toggle()}
                    className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <span>Theme</span>
                    <AnimatedThemeToggler
                      iconOnly
                      triggerRef={themeToggleRef}
                    />
                  </button>
                </>
              )}
              <button
                id="user-settings-button"
                onClick={() => {
                  setOpen(false);
                  setSettingsOpen(true);
                }}
                className="flex w-full items-center justify-between  gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Settings
                <Settings className="size-4 text-muted-foreground" />
              </button>
              {hasPublicProfile && (
                <button
                  id="public-profile"
                  onClick={handlePublicProfileClick}
                  className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Public Profile
                  <UserIcon className="size-4 text-muted-foreground" />
                </button>
              )}
              <button
                id="user-keyboard-shortcuts-button"
                onClick={() => {
                  setOpen(false);
                  setShortcutsOpen(true);
                }}
                className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Keyboard Shortcuts
                <Keyboard className="size-4 text-muted-foreground" />
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                id="user-signout-button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Sign out
                <LogOut className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>

      {shortcutsOpen && (
        <KeyboardShortcutsDialog
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      )}
      {settingsOpen && (
        <UserSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          user={user}
        />
      )}
    </>
  );
});
