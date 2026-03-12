"use client";

import { useReducer, useRef, useEffect, memo } from "react";
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  Keyboard,
  User,
  Loader2,
  ListTodo,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useIsSmallMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const KeyboardShortcutsDialog = dynamic(
  () =>
    import("@/components/dashboard/dialog").then(
      (m) => m.KeyboardShortcutsDialog,
    ),
  { ssr: false },
);

const UserSettingsDialog = dynamic(
  () =>
    import("@/components/dashboard/settings").then((m) => m.UserSettingsDialog),
  { ssr: false },
);

export const UserInfo = memo(function UserInfo() {
  const { user } = useUser();
  const { signOut } = useClerk();

  type UserInfoState = {
    open: boolean;
    shortcutsOpen: boolean;
    settingsOpen: boolean;
    isRedirectingToProfile: boolean;
    isRedirectingToTodos: boolean;
    isSigningOut: boolean;
  };

  type UserInfoAction =
    | { type: "toggleMenu" }
    | { type: "setMenuOpen"; open: boolean }
    | { type: "openShortcuts" }
    | { type: "setShortcutsOpen"; open: boolean }
    | { type: "openSettings" }
    | { type: "setSettingsOpen"; open: boolean }
    | { type: "setRedirectingToProfile"; redirecting: boolean }
    | { type: "setRedirectingToTodos"; redirecting: boolean }
    | { type: "setSigningOut"; signingOut: boolean };

  function reducer(
    state: UserInfoState,
    action: UserInfoAction,
  ): UserInfoState {
    switch (action.type) {
      case "toggleMenu":
        return { ...state, open: !state.open };
      case "setMenuOpen":
        return {
          ...state,
          open: action.open,
          isRedirectingToProfile: false,
          isRedirectingToTodos: false,
        };
      case "openShortcuts":
        return { ...state, open: false, shortcutsOpen: true };
      case "setShortcutsOpen":
        return { ...state, shortcutsOpen: action.open };
      case "openSettings":
        return { ...state, open: false, settingsOpen: true };
      case "setSettingsOpen":
        return { ...state, settingsOpen: action.open };
      case "setRedirectingToProfile":
        return { ...state, isRedirectingToProfile: action.redirecting };
      case "setRedirectingToTodos":
        return { ...state, isRedirectingToTodos: action.redirecting };
      case "setSigningOut":
        return { ...state, isSigningOut: action.signingOut };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, {
    open: false,
    shortcutsOpen: false,
    settingsOpen: false,
    isRedirectingToProfile: false,
    isRedirectingToTodos: false,
    isSigningOut: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isSmallMobile = useIsSmallMobile();
  const isTodosPage = pathname === "/dashboard/todos";

  const profile = useQuery(api.profile.getProfile);
  const hasPublicProfile = profile?.isPublic && profile?.username;

  const userName = user?.fullName ?? user?.firstName ?? "User";
  const initial = userName.charAt(0)?.toUpperCase() ?? "U";

  const maxLen = 14;
  const displayName =
    userName.length > maxLen ? userName.slice(0, maxLen) + "…" : userName;

  useEffect(() => {
    if (!state.open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        dispatch({ type: "setMenuOpen", open: false });
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state.open]);

  const themeToggleRef = useRef<{ toggle: () => void }>(null);

  const handlePublicProfileClick = () => {
    if (profile?.username) {
      dispatch({ type: "setRedirectingToProfile", redirecting: true });
      window.setTimeout(() => {
        router.push(`/u/${profile.username}`);
      }, 150);
    }
  };

  const handleTodosClick = () => {
    dispatch({ type: "setRedirectingToTodos", redirecting: true });
    window.setTimeout(() => {
      router.push("/dashboard/todos");
    }, 150);
  };

  const handleSignOut = () => {
    dispatch({ type: "setSigningOut", signingOut: true });
    signOut({ redirectUrl: "/" });
  };

  if (!user) return null;

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          id="user-info-trigger"
          onClick={() => dispatch({ type: "toggleMenu" })}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-1.5 sm:px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {user.imageUrl ? (
            <Image
              width={24}
              height={24}
              src={user.imageUrl}
              alt={userName}
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

        {state.open && (
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
                onClick={() => dispatch({ type: "openSettings" })}
                className="flex w-full items-center justify-between  gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Settings
                <Settings className="size-4 text-muted-foreground" />
              </button>
              {hasPublicProfile && (
                <button
                  id="public-profile"
                  onClick={handlePublicProfileClick}
                  disabled={state.isRedirectingToProfile}
                  className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-70 disabled:pointer-events-none"
                >
                  {state.isRedirectingToProfile
                    ? "Redirecting..."
                    : "Public Profile"}
                  {state.isRedirectingToProfile ? (
                    <Loader2 className="size-4 text-muted-foreground animate-spin" />
                  ) : (
                    <User className="size-4 text-muted-foreground" />
                  )}
                </button>
              )}
              {!isTodosPage && (
                <button
                  id="todos-button"
                  onClick={handleTodosClick}
                  disabled={state.isRedirectingToTodos}
                  className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-70 disabled:pointer-events-none"
                >
                  {state.isRedirectingToTodos
                    ? "Redirecting..."
                    : "Daily Activities"}
                  {state.isRedirectingToTodos ? (
                    <Loader2 className="size-4 text-muted-foreground animate-spin" />
                  ) : (
                    <ListTodo className="size-4 text-muted-foreground" />
                  )}
                </button>
              )}
              {!isSmallMobile && !isTodosPage && (
                <button
                  id="user-keyboard-shortcuts-button"
                  onClick={() => dispatch({ type: "openShortcuts" })}
                  className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Keyboard Shortcuts
                  <Keyboard className="size-4 text-muted-foreground" />
                </button>
              )}
              <div className="my-1 h-px bg-border" />
              <button
                id="user-signout-button"
                disabled={state.isSigningOut}
                onClick={handleSignOut}
                className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:pointer-events-none disabled:opacity-70"
              >
                {state.isSigningOut ? "Signing out..." : "Sign out"}
                {state.isSigningOut ? (
                  <Loader2 className="size-4 text-muted-foreground animate-spin" />
                ) : (
                  <LogOut className="size-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {state.shortcutsOpen && (
        <KeyboardShortcutsDialog
          open={state.shortcutsOpen}
          onOpenChange={(open) => dispatch({ type: "setShortcutsOpen", open })}
        />
      )}
      {state.settingsOpen && (
        <UserSettingsDialog
          open={state.settingsOpen}
          onOpenChange={(open) => dispatch({ type: "setSettingsOpen", open })}
        />
      )}
    </>
  );
});
