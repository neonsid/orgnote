"use client";

import { memo } from "react";
import Image from "next/image";
import GitHub from "lucide-react/dist/esm/icons/github";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Globe from "lucide-react/dist/esm/icons/globe";

interface ProfileSidebarProps {
  username: string;
  name: string;
  bio?: string;
  links?: Array<{ label: string; url: string }>;
}

export const ProfileSidebar = memo(function ProfileSidebar({
  username,
  name,
  bio,
  links,
}: ProfileSidebarProps) {
  const initial = username.charAt(0).toUpperCase();

  // Single pass to find all social links
  const socialLinks = links?.reduce<
    Record<string, { label: string; url: string }>
  >((acc, link) => {
    acc[link.label] = link;
    return acc;
  }, {});

  const githubLink = socialLinks?.["GitHub"];
  const twitterLink = socialLinks?.["Twitter"];
  const portfolioLink = socialLinks?.["Portfolio"];

  return (
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
          {name || username}
        </h1>
        <p className="text-muted-foreground">@{username}</p>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-muted-foreground text-center md:text-left">
          {bio}
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
  );
});
