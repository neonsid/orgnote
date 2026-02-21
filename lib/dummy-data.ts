export interface Bookmark {
  id: string;
  title: string;
  domain: string;
  url: string;
  favicon: string | null;
  fallbackColor: string;
  createdAt: string;
  groupId: string;
}

export interface Group {
  id: string;
  name: string;
  color: string; // dot color
  bookmarkCount: number;
}

export const groups: Group[] = [
  { id: "personal", name: "Personal", color: "#f59e0b", bookmarkCount: 6 },
  { id: "x", name: "X", color: "#3b82f6", bookmarkCount: 3 },
];

export const bookmarks: Bookmark[] = [
  {
    id: "1",
    title: "Ephraim Duncan",
    domain: "ephraimduncan.com",
    url: "https://ephraimduncan.com",
    favicon: null,
    fallbackColor: "#3b82f6",
    createdAt: "2026-02-21",
    groupId: "personal",
  },
  {
    id: "2",
    title: "Documenso",
    domain: "documenso.com",
    url: "https://documenso.com",
    favicon: "https://www.google.com/s2/favicons?domain=documenso.com&sz=64",
    fallbackColor: "#6b7280",
    createdAt: "2026-02-21",
    groupId: "personal",
  },
  {
    id: "3",
    title: "Blocks",
    domain: "blocks.so",
    url: "https://blocks.so",
    favicon: null,
    fallbackColor: "#111827",
    createdAt: "2026-02-21",
    groupId: "personal",
  },
  {
    id: "4",
    title: "Writer",
    domain: "writer.so",
    url: "https://writer.so",
    favicon: null,
    fallbackColor: "#7c3aed",
    createdAt: "2026-02-21",
    groupId: "personal",
  },
  {
    id: "5",
    title: "Refine",
    domain: "refine.so",
    url: "https://refine.so",
    favicon: "https://www.google.com/s2/favicons?domain=refine.dev&sz=64",
    fallbackColor: "#6b7280",
    createdAt: "2026-02-21",
    groupId: "personal",
  },
  {
    id: "6",
    title: "Weekday",
    domain: "weekday.so",
    url: "https://weekday.so",
    favicon: null,
    fallbackColor: "#374151",
    createdAt: "2026-02-21",
    groupId: "personal",
  },
  {
    id: "7",
    title: "Vercel",
    domain: "vercel.com",
    url: "https://vercel.com",
    favicon: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64",
    fallbackColor: "#000000",
    createdAt: "2026-02-20",
    groupId: "x",
  },
  {
    id: "8",
    title: "Next.js",
    domain: "nextjs.org",
    url: "https://nextjs.org",
    favicon: "https://www.google.com/s2/favicons?domain=nextjs.org&sz=64",
    fallbackColor: "#000000",
    createdAt: "2026-02-20",
    groupId: "x",
  },
  {
    id: "9",
    title: "Tailwind CSS",
    domain: "tailwindcss.com",
    url: "https://tailwindcss.com",
    favicon: "https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64",
    fallbackColor: "#06b6d4",
    createdAt: "2026-02-19",
    groupId: "x",
  },
];

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
