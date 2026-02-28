import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import PublicProfileContent from "./public-profile-content";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await fetchQuery(api.profile.getProfileByUsername, {
      username,
    });

    if (!profile) {
      return {
        title: "Profile Not Found — Orgnote",
        icons: { icon: "/logo.svg" },
      };
    }

    return {
      title: `${profile.name} (@${username}) — Orgnote`,
      icons: { icon: "/logo.svg" },
    };
  } catch {
    return {
      title: "Orgnote",
      icons: { icon: "/logo.svg" },
    };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;

  return <PublicProfileContent username={username} />;
}
