import type { Id } from "@/convex/_generated/dataModel";

export interface Bookmark {
  id: Id<"bookmarks">;
  title: string;
  domain: string;
  url: string;
  favicon: string;
  fallbackColor: string;
  createdAt: string;
  groupId: Id<"groups">;
  doneReading: boolean;
  description?: string;
}
