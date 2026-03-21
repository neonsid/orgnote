import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  publicProfileSchema,
  type PublicProfileFormData,
} from "@/lib/validation";
import type { Doc } from "@/convex/_generated/dataModel";

/** Parse stored profile link URL (or plain handle) into an X/Twitter handle for the form. */
function twitterUsernameFromStoredUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Bare handle stored without URL (must run before URL() so "foo" is not parsed as hostname)
  if (
    !trimmed.includes("://") &&
    !trimmed.includes("/") &&
    /^[A-Za-z0-9_]{1,15}$/.test(trimmed)
  ) {
    return trimmed;
  }

  try {
    const withProtocol =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const isTwitterHost =
      host === "x.com" ||
      host === "twitter.com" ||
      host === "mobile.twitter.com";
    if (!isTwitterHost) return null;
    const segment = parsed.pathname.split("/").filter(Boolean)[0];
    if (!segment) return null;
    const handle = segment.replace(/^@/, "");
    if (/^[A-Za-z0-9_]{1,15}$/.test(handle)) return handle;
  } catch {
    return null;
  }

  return null;
}

function defaultValuesFromProfile(
  existingProfile: Doc<"userProfile"> | undefined | null,
): PublicProfileFormData {
  const base: PublicProfileFormData = {
    isPublic: false,
    username: "",
    bio: "",
    github: "",
    twitter: "",
    website: "",
  };

  if (!existingProfile) return base;

  const next: PublicProfileFormData = {
    ...base,
    isPublic: existingProfile.isPublic,
  };

  if (existingProfile.username) {
    next.username = existingProfile.username;
  }
  if (existingProfile.bio) {
    next.bio = existingProfile.bio;
  }

  if (existingProfile.links && existingProfile.links.length > 0) {
    for (const link of existingProfile.links) {
      if (link.label === "GitHub") {
        next.github = link.url;
      } else if (link.label === "Twitter") {
        const handle = twitterUsernameFromStoredUrl(link.url);
        if (handle) {
          next.twitter = handle;
        }
      } else if (link.label === "Portfolio") {
        const match = link.url.match(/https:\/\/(.+)/);
        if (match) {
          next.website = match[1];
        }
      }
    }
  }

  return next;
}

interface UsePublicProfileFormOptions {
  existingProfile: Doc<"userProfile"> | undefined | null;
}

export function usePublicProfileForm({
  existingProfile,
}: UsePublicProfileFormOptions) {
  const upsertProfile = useMutation(api.profile.mutations.upsertProfile);

  const defaultValues = useMemo(
    () => defaultValuesFromProfile(existingProfile),
    [existingProfile],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onChange: publicProfileSchema,
      onSubmit: publicProfileSchema,
    },
    onSubmit: async ({ value }) => {
      if (
        value.username ||
        value.bio ||
        value.github ||
        value.twitter ||
        value.website
      ) {
        const links = [] as Array<{
          label: "GitHub" | "Twitter" | "Portfolio";
          url: string;
        }>;
        if (value.github) links.push({ label: "GitHub", url: value.github });
        if (value.twitter)
          links.push({
            label: "Twitter",
            url: `https://x.com/${value.twitter}`,
          });
        if (value.website)
          links.push({
            label: "Portfolio",
            url: `https://${value.website}`,
          });

        await upsertProfile({
          username: value.username || undefined,
          bio: value.bio || undefined,
          links: links.length > 0 ? links : undefined,
          isPublic: value.isPublic,
        });
      }
    },
  });

  return form;
}

export type ReturnValue = ReturnType<typeof usePublicProfileForm>;
