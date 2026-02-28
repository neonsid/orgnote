import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  publicProfileSchema,
  type PublicProfileFormData,
} from "@/lib/validation";
import type { Doc } from "@/convex/_generated/dataModel";

interface UsePublicProfileFormOptions {
  userId: string;
  existingProfile: Doc<"userProfile"> | undefined | null;
}

export function usePublicProfileForm({
  userId,
  existingProfile,
}: UsePublicProfileFormOptions) {
  const upsertProfile = useMutation(api.profile.upsertProfile);

  const form = useForm({
    defaultValues: {
      isPublic: false,
      username: "",
      bio: "",
      github: "",
      twitter: "",
      website: "",
    } as PublicProfileFormData,
    validators: {
      onChange: publicProfileSchema,
      onSubmit: publicProfileSchema,
    },
    onSubmit: async ({ value }) => {
      // Only save if user has entered something
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
          userId,
          username: value.username || undefined,
          bio: value.bio || undefined,
          links: links.length > 0 ? links : undefined,
          isPublic: value.isPublic,
        });
      }
    },
  });

  // Load existing profile data
  useEffect(() => {
    if (existingProfile) {
      form.setFieldValue("isPublic", existingProfile.isPublic);
      if (existingProfile.username) {
        form.setFieldValue("username", existingProfile.username);
      }
      if (existingProfile.bio) {
        form.setFieldValue("bio", existingProfile.bio);
      }
      if (existingProfile.links && existingProfile.links.length > 0) {
        for (const link of existingProfile.links) {
          if (link.label === "GitHub") {
            form.setFieldValue("github", link.url);
          } else if (link.label === "Twitter") {
            // Extract username from https://x.com/username
            const match = link.url.match(/https:\/\/x\.com\/(\w+)/);
            if (match) {
              form.setFieldValue("twitter", match[1]);
            }
          } else if (link.label === "Portfolio") {
            // Extract domain from https://domain.com
            const match = link.url.match(/https:\/\/(.+)/);
            if (match) {
              form.setFieldValue("website", match[1]);
            }
          }
        }
      }
    }
  }, [existingProfile]);

  return form;
}

export type ReturnValue = ReturnType<typeof usePublicProfileForm>;
