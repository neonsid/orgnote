"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface UserInfoProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function UserInfo({ user }: UserInfoProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const initial = user.name?.charAt(0)?.toUpperCase() ?? "U";

  // Truncate name for display
  const maxLen = 14;
  const displayName =
    user.name.length > maxLen ? user.name.slice(0, maxLen) + "…" : user.name;

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

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id="user-info-trigger"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        {/* Avatar */}
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="size-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex items-center justify-center size-6 rounded-full bg-muted-foreground text-background text-xs font-bold select-none">
            {initial}
          </span>
        )}
        <span className="max-w-[120px] truncate">{displayName}</span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center size-8 rounded-full bg-muted-foreground text-background text-sm font-bold select-none">
                  {initial}
                </span>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
          <div className="p-1.5">
            <button
              id="user-settings-button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </button>
            <button
              id="user-signout-button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="size-4 text-muted-foreground" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
