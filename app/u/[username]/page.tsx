import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import GitHub from "lucide-react/dist/esm/icons/github";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Globe from "lucide-react/dist/esm/icons/globe";

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

  // Fetch the public profile
  const profile = await fetchQuery(api.profile.getProfileByUsername, {
    username,
  });

  if (!profile) {
    notFound();
  }

  // Fetch the user's public groups
  const groups = await fetchQuery(api.groups.getPublicGroupsByUsername, {
    username,
  });

  // Get user info (we need to fetch the user separately since profile only has userProvidedId)
  // For now, we'll use the profile data directly

  const initial = username.charAt(0).toUpperCase();

  // Get social links
  const githubLink = profile.links?.find((link) => link.label === "GitHub");
  const twitterLink = profile.links?.find((link) => link.label === "Twitter");
  const portfolioLink = profile.links?.find(
    (link) => link.label === "Portfolio",
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={24}
                height={24}
                className="size-6"
              />
              <span>minimal</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Left Sidebar */}
          <aside className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center justify-center size-20 rounded-full bg-muted text-foreground text-2xl font-bold select-none">
                {initial}
              </div>
            </div>

            {/* Name and Username */}
            <div className="text-center md:text-left">
              <h1 className="text-xl font-semibold text-foreground">
                {profile.username}
              </h1>
              <p className="text-muted-foreground">@{username}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground text-center md:text-left">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              {githubLink && (
                <a
                  href={githubLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GitHub className="size-5" />
                </a>
              )}
              {twitterLink && (
                <a
                  href={
                    twitterLink.url.startsWith("http")
                      ? twitterLink.url
                      : `https://twitter.com/${twitterLink.url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="size-5" />
                </a>
              )}
              {portfolioLink && (
                <a
                  href={portfolioLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="size-5" />
                </a>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Group Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
                All
              </button>
              {groups.map((group) => (
                <button
                  key={group._id}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.title}
                </button>
              ))}
            </div>

            {/* Bookmark List Header */}
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Title
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Updated
              </span>
            </div>

            {/* Bookmark List */}
            <div className="space-y-1">
              {/* Placeholder for bookmarks - in a real implementation, you'd fetch bookmarks from public groups */}
              <div className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded bg-muted flex items-center justify-center text-xs">
                    B
                  </div>
                  <span className="text-foreground font-medium">
                    The Copenhagen Book
                  </span>
                  <span className="text-muted-foreground text-sm">
                    thecopenhagenbook.com
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">Feb 28</span>
              </div>

              <div className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded bg-muted flex items-center justify-center text-xs">
                    G
                  </div>
                  <span className="text-foreground font-medium">Google</span>
                  <span className="text-muted-foreground text-sm">
                    google.com
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">Feb 25</span>
              </div>

              <div className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded bg-muted flex items-center justify-center text-xs">
                    X
                  </div>
                  <span className="text-foreground font-medium">x.com</span>
                  <span className="text-muted-foreground text-sm">x.com</span>
                </div>
                <span className="text-sm text-muted-foreground">Feb 20</span>
              </div>
            </div>

            {/* Empty state if no bookmarks */}
            {groups.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No public groups available
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
