import { extractDomain } from "@/lib/domain-utils";
import { MAX_BOOKMARK_URL_LENGTH } from "@/lib/url-limits";

export type ParsedImportItem = {
  /** Stable id for React keys and selection across filter changes */
  id: string;
  sourceIndex: number;
  title: string;
  url: string;
  folderPath: readonly string[];
};

const ALL_FOLDERS_VALUE = "__all__";

/** Select value for bookmarks with no Chrome folder path (flat export). */
export const UNCATEGORIZED_CHROME_FOLDER = "__uncategorized__";

export { ALL_FOLDERS_VALUE };

function isAllowedHttpUrl(href: string): boolean {
  try {
    const u = new URL(href.startsWith("http") ? href : `https://${href}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isBookmarkUrlLengthOk(href: string): boolean {
  return href.length <= MAX_BOOKMARK_URL_LENGTH;
}

function titleFromUrlLikeQuickAdd(value: string): string {
  const domain = extractDomain(value);
  const isUrl = domain.includes(".");
  if (!isUrl) return value.trim() || value;
  const first = domain.split(".")[0] ?? "";
  if (!first) return value.trim() || value;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

type RawParsed = {
  title: string;
  url: string;
  folderPath: string[];
};

/** Chrome wraps folder contents in `<p>` inside `<dl>` (invalid HTML but what they emit). */
function isWrapperTag(tag: string): boolean {
  const u = tag.toUpperCase();
  return u === "P" || u === "DD";
}

/**
 * Folder `<dl>` after a heading `<dt>`: usually next sibling, sometimes inside a following `<p>`.
 */
function findFolderDlAfterDt(dt: Element): Element | null {
  let sib: Element | null = dt.nextElementSibling;
  while (sib) {
    const tag = sib.tagName.toUpperCase();
    if (tag === "DL") return sib;
    if (tag === "P" || tag === "DD") {
      const inner = sib.querySelector(":scope > dl");
      if (inner) return inner;
    }
    sib = sib.nextElementSibling;
  }
  return null;
}

/**
 * Walk bookmark nodes inside a `<dl>` or wrapper (`<p>` / `<dd>`).
 * Do not use `dl > dt` only — real exports nest `dt` under `<p>`.
 */
function directChildAnchor(dt: Element): HTMLAnchorElement | null {
  for (const c of dt.children) {
    if (c.tagName.toUpperCase() === "A" && c.hasAttribute("href")) {
      return c as HTMLAnchorElement;
    }
  }
  return null;
}

function directChildH3(dt: Element): Element | null {
  for (const c of dt.children) {
    if (c.tagName.toUpperCase() === "H3") return c;
  }
  return null;
}

function walkBookmarkNodes(
  container: Element,
  folderPath: string[],
  out: RawParsed[],
  stats: { skippedTooLong: number },
): void {
  // Snapshot: `HTMLCollection` is live; some parsers couple oddly with for..of iteration.
  for (const child of Array.from(container.children)) {
    const tag = child.tagName.toUpperCase();

    if (isWrapperTag(tag)) {
      walkBookmarkNodes(child, folderPath, out, stats);
      continue;
    }

    // Do not recurse into sibling <dl> here — Chrome nests <dt><h3></dt><dl> and entering
    // that <dl> twice (via h3 + via this branch) duplicates rows and breaks folder paths.

    if (tag !== "DT") continue;

    const dt = child;
    // Only a direct child <a> is a bookmark row — `querySelector('a')` would match
    // links inside nested folders when <h3>+</h3><dl> live in the same <dt>.
    const link = directChildAnchor(dt);
    if (link) {
      const href = link.getAttribute("href")?.trim() ?? "";
      if (!isAllowedHttpUrl(href)) continue;
      if (!isBookmarkUrlLengthOk(href)) {
        stats.skippedTooLong += 1;
        continue;
      }
      const rawTitle = link.textContent?.trim() ?? "";
      const title = rawTitle || titleFromUrlLikeQuickAdd(href);
      out.push({
        title,
        url: href,
        folderPath: [...folderPath],
      });
      continue;
    }

    const h3 = directChildH3(dt) ?? dt.querySelector("h3");
    if (h3) {
      const name = h3.textContent?.trim() ?? "";
      // Chrome omits `</dt>` before the nested `<dl>`, so parsers put `<dl>` inside
      // the `<dt>`. Also support a following sibling `<dl>` (valid dt/dd structure).
      let nestedDl: Element | null = null;
      for (const c of dt.children) {
        if (c.tagName.toUpperCase() === "DL") {
          nestedDl = c;
          break;
        }
      }
      nestedDl ??= findFolderDlAfterDt(dt);
      if (nestedDl) {
        walkBookmarkNodes(
          nestedDl,
          name ? [...folderPath, name] : folderPath,
          out,
          stats,
        );
      }
    }
  }
}

/**
 * Record every Chrome folder (<dt><h3>…</h3><dl>…) path, including folders with
 * no bookmarks, so empty folders still appear in the import UI.
 */
function collectChromeFolderLabels(
  container: Element,
  folderPath: string[],
  out: Set<string>,
): void {
  for (const child of Array.from(container.children)) {
    const tag = child.tagName.toUpperCase();

    if (isWrapperTag(tag)) {
      collectChromeFolderLabels(child, folderPath, out);
      continue;
    }

    if (tag !== "DT") continue;

    const dt = child;
    const h3 = directChildH3(dt) ?? dt.querySelector("h3");
    if (!h3) continue;

    const name = h3.textContent?.trim() ?? "";
    if (!name) continue;

    const nextPath = [...folderPath, name];
    out.add(folderPathLabel(nextPath));

    let nestedDl: Element | null = null;
    for (const c of dt.children) {
      if (c.tagName.toUpperCase() === "DL") {
        nestedDl = c;
        break;
      }
    }
    nestedDl ??= findFolderDlAfterDt(dt);
    if (nestedDl) {
      collectChromeFolderLabels(nestedDl, nextPath, out);
    }
  }
}

export function sortChromeFolderKeys(set: Set<string>): string[] {
  const arr = [...set];
  arr.sort((a, b) => {
    if (a === UNCATEGORIZED_CHROME_FOLDER) return -1;
    if (b === UNCATEGORIZED_CHROME_FOLDER) return 1;
    return a.localeCompare(b);
  });
  return arr;
}

function parseFlatHttpLinksFromDoc(
  doc: Document,
  stats: { skippedTooLong: number },
): RawParsed[] {
  const out: RawParsed[] = [];
  for (const a of doc.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = a.getAttribute("href")?.trim() ?? "";
    if (!isAllowedHttpUrl(href)) continue;
    if (!isBookmarkUrlLengthOk(href)) {
      stats.skippedTooLong += 1;
      continue;
    }
    const rawTitle = a.textContent?.trim() ?? "";
    out.push({
      title: rawTitle || titleFromUrlLikeQuickAdd(href),
      url: href,
      folderPath: [],
    });
  }
  return out;
}

/**
 * Chrome emits invalid HTML: `<dl><p><dt>…` (a `<p>` directly inside `<dl>`).
 * The HTML5 tree builder reparents or closes nodes so our recursive walk only
 * sees a fragment of the tree; we then skip the flat fallback because `raw` is
 * non-empty. Strip these wrapper `<p>` tags so `<dt>` / `<dl>` nesting matches
 * the file intent.
 */
export function normalizeChromeBookmarkExportHtml(html: string): string {
  return html.replace(/<\/?p\b[^>]*>/gi, "");
}

export type ParseBookmarkHtmlOptions = {
  /**
   * Strip Chrome’s invalid `<dl><p><dt>…` wrappers before parsing.
   * @default true
   */
  normalizeChromePWrappers?: boolean;
};

export type ParseBookmarkHtmlResult = {
  items: ParsedImportItem[];
  /**
   * Select options for Chrome folders: every `<h3>` folder path, including
   * empty folders, plus {@link UNCATEGORIZED_CHROME_FOLDER} when needed.
   */
  chromeFolderKeys: string[];
  /** HTTP(S) links skipped because URL length exceeded {@link MAX_BOOKMARK_URL_LENGTH}. */
  skippedTooLongCount: number;
};

/**
 * Parse Chrome / Netscape bookmark export HTML.
 */
export function parseBookmarkHtml(
  html: string,
  options?: ParseBookmarkHtmlOptions,
): ParseBookmarkHtmlResult {
  const normalize = options?.normalizeChromePWrappers !== false;
  const source = normalize ? normalizeChromeBookmarkExportHtml(html) : html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "text/html");
  const raw: RawParsed[] = [];
  const folderLabels = new Set<string>();
  const stats = { skippedTooLong: 0 };
  const rootDl = doc.body?.querySelector("dl") ?? doc.querySelector("dl");
  if (rootDl) {
    walkBookmarkNodes(rootDl, [], raw, stats);
    collectChromeFolderLabels(rootDl, [], folderLabels);
  }
  if (raw.length === 0) {
    const chromeOrNetscapeExport =
      /NETSCAPE-Bookmark-file/i.test(html) ||
      /ADD_DATE="\d+"/i.test(html);
    if (chromeOrNetscapeExport) {
      raw.push(...parseFlatHttpLinksFromDoc(doc, stats));
    }
  }
  const items = raw.map((item, i) => ({
    ...item,
    id: `html-${i}`,
    sourceIndex: i,
    folderPath: item.folderPath as readonly string[],
  }));

  for (const item of items) {
    if (item.folderPath.length === 0) {
      folderLabels.add(UNCATEGORIZED_CHROME_FOLDER);
      continue;
    }
    for (let len = 1; len <= item.folderPath.length; len++) {
      folderLabels.add(folderPathLabel(item.folderPath.slice(0, len)));
    }
  }

  return {
    items,
    chromeFolderKeys: sortChromeFolderKeys(folderLabels),
    skippedTooLongCount: stats.skippedTooLong,
  };
}

/**
 * One URL per line; optional dedupe by normalized URL.
 */
export function parsePastedUrlList(
  text: string,
  options?: { dedupe?: boolean },
): { items: ParsedImportItem[]; skippedTooLongCount: number } {
  const dedupe = options?.dedupe ?? false;
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const raw: RawParsed[] = [];
  let skippedTooLongCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    if (!isAllowedHttpUrl(url)) continue;
    if (!isBookmarkUrlLengthOk(url)) {
      skippedTooLongCount += 1;
      continue;
    }

    const key = normalizeUrlKey(url);
    if (dedupe && seen.has(key)) continue;
    if (dedupe) seen.add(key);

    raw.push({
      title: titleFromUrlLikeQuickAdd(url),
      url,
      folderPath: [],
    });
  }

  const items = raw.map((item, i) => ({
    ...item,
    id: `paste-${i}`,
    sourceIndex: i,
    folderPath: item.folderPath as readonly string[],
  }));
  return { items, skippedTooLongCount };
}

export function folderPathLabel(folderPath: readonly string[]): string {
  return folderPath.join(" / ");
}

/** Distinct non-empty folder paths from items (full path per bookmark). */
export function distinctFolderPaths(items: ParsedImportItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.folderPath.length === 0) continue;
    set.add(folderPathLabel(item.folderPath));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Every Chrome folder path that contains at least one bookmark (each prefix of
 * each item's folder path, plus {@link UNCATEGORIZED_CHROME_FOLDER} when needed).
 */
export function distinctChromeFolderKeys(items: ParsedImportItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.folderPath.length === 0) {
      set.add(UNCATEGORIZED_CHROME_FOLDER);
      continue;
    }
    for (let len = 1; len <= item.folderPath.length; len++) {
      set.add(folderPathLabel(item.folderPath.slice(0, len)));
    }
  }
  return sortChromeFolderKeys(set);
}

/** Bookmarks under this Chrome folder (prefix match), or uncategorized. */
export function itemsInChromeFolder(
  items: ParsedImportItem[],
  folderKey: string,
): ParsedImportItem[] {
  if (folderKey === UNCATEGORIZED_CHROME_FOLDER) {
    return items.filter((i) => i.folderPath.length === 0);
  }
  return items.filter((i) => {
    if (i.folderPath.length === 0) return false;
    const label = folderPathLabel(i.folderPath);
    return (
      label === folderKey || label.startsWith(`${folderKey} / `)
    );
  });
}

function pathsEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((seg, i) => seg === b[i]);
}

/** Selected folder key is joined path; "__all__" keeps everything. */
export function filterItemsByChromeFolder(
  items: ParsedImportItem[],
  selectedFolderKey: string,
): ParsedImportItem[] {
  if (selectedFolderKey === ALL_FOLDERS_VALUE) return items;
  const selectedSegments = selectedFolderKey.split(" / ").filter(Boolean);
  return items.filter((item) => {
    if (selectedSegments.length === 0) return true;
    if (item.folderPath.length < selectedSegments.length) return false;
    const prefix = item.folderPath.slice(0, selectedSegments.length);
    return pathsEqual(prefix, selectedSegments);
  });
}

/** Parse URL, strip hash, lowercase href — same key for import dedupe and duplicate checks. */
export function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.href.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function buildExistingKeysByGroupId(
  bookmarks: ReadonlyArray<{ groupId: string; url: string }>,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const b of bookmarks) {
    const key = normalizeUrlKey(b.url);
    let set = map.get(b.groupId);
    if (!set) {
      set = new Set();
      map.set(b.groupId, set);
    }
    set.add(key);
  }
  return map;
}

export type StagedImportPartition = {
  newItems: ParsedImportItem[];
  dbDuplicates: ParsedImportItem[];
  batchDuplicates: ParsedImportItem[];
};

/**
 * Classify staged items for one group: DB duplicates (normalized URL already in group),
 * batch duplicates (same URL listed more than once in this import), and new URLs.
 */
export function partitionStagedItemsForGroup(
  groupId: string,
  items: ParsedImportItem[],
  existingKeysByGroup: Map<string, Set<string>>,
): StagedImportPartition {
  const existing = existingKeysByGroup.get(groupId) ?? new Set<string>();
  const seenInStaged = new Set<string>();
  const newItems: ParsedImportItem[] = [];
  const dbDuplicates: ParsedImportItem[] = [];
  const batchDuplicates: ParsedImportItem[] = [];

  for (const item of items) {
    const key = normalizeUrlKey(item.url);
    if (existing.has(key)) {
      dbDuplicates.push(item);
      continue;
    }
    if (seenInStaged.has(key)) {
      batchDuplicates.push(item);
      continue;
    }
    seenInStaged.add(key);
    newItems.push(item);
  }
  return { newItems, dbDuplicates, batchDuplicates };
}

export function partitionPendingImport(
  pendingByGroup: Record<string, ParsedImportItem[]>,
  existingKeysByGroup: Map<string, Set<string>>,
): Record<string, StagedImportPartition> {
  const out: Record<string, StagedImportPartition> = {};
  for (const [gid, items] of Object.entries(pendingByGroup)) {
    if (items.length === 0) continue;
    out[gid] = partitionStagedItemsForGroup(gid, items, existingKeysByGroup);
  }
  return out;
}

export function hasImportDuplicateConflict(
  pendingByGroup: Record<string, ParsedImportItem[]>,
  existingKeysByGroup: Map<string, Set<string>>,
): boolean {
  for (const [gid, items] of Object.entries(pendingByGroup)) {
    if (items.length === 0) continue;
    const p = partitionStagedItemsForGroup(gid, items, existingKeysByGroup);
    if (p.dbDuplicates.length > 0 || p.batchDuplicates.length > 0) return true;
  }
  return false;
}

export function buildNewOnlyPendingByGroup(
  pendingByGroup: Record<string, ParsedImportItem[]>,
  existingKeysByGroup: Map<string, Set<string>>,
): Record<string, ParsedImportItem[]> {
  const out: Record<string, ParsedImportItem[]> = {};
  for (const [gid, items] of Object.entries(pendingByGroup)) {
    if (items.length === 0) continue;
    const { newItems } = partitionStagedItemsForGroup(gid, items, existingKeysByGroup);
    if (newItems.length > 0) out[gid] = newItems;
  }
  return out;
}

export function totalPartitionSkips(
  partitions: Record<string, StagedImportPartition>,
): { db: number; batch: number } {
  let db = 0;
  let batch = 0;
  for (const p of Object.values(partitions)) {
    db += p.dbDuplicates.length;
    batch += p.batchDuplicates.length;
  }
  return { db, batch };
}

/** Dedupe by URL; keeps first occurrence (document order). Preserves stable ids when possible. */
export function dedupeItemsByUrl(items: ParsedImportItem[]): ParsedImportItem[] {
  const seen = new Set<string>();
  const out: ParsedImportItem[] = [];
  for (const item of items) {
    const key = normalizeUrlKey(item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
