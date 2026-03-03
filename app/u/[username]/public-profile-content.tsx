"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicProfileHeader } from "@/components/public-profile-header";
import { ProfileSidebar } from "./profile-sidebar";
import { PublicBookmarkList } from "./public-bookmark-list";

interface PublicProfileContentProps {
  username: string;
}

export default function PublicProfileContent({
  username,
}: PublicProfileContentProps) {
  const data = useQuery(api.profile.getPublicProfileData, { username });

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Profile not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The user @{username} does not exist.
          </p>
        </div>
      </div>
    );
  }

  const { profile, groups, bookmarks } = data;

  return (
    <div className="min-h-screen bg-background">
      <PublicProfileHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Left Sidebar - Memoized, doesn't re-render when groups/bookmarks change */}
          <ProfileSidebar
            username={username}
            name={profile.name || profile.username || username}
            bio={profile.bio}
            links={profile.links}
          />

          {/* Main Content - Bookmark List (isolated, re-renders independently) */}
          <PublicBookmarkList groups={groups} bookmarks={bookmarks} />
        </div>
      </main>
    </div>
  );
}
