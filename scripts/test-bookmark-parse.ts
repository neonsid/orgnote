/**
 * Bookmark HTML parse diagnostics (Node + jsdom).
 *
 * Compares parsing with and without Chrome `<dl><p>` normalization, runs small
 * structural fixtures, and optionally loads repo-root `Bookmarks.html`.
 *
 * Run: `pnpm test:bookmark-parse`
 *
 * Past issues this helped catch:
 * - Chrome’s `<DL><p><DT>…` breaks tree walking unless `<p>` tags are stripped first.
 * - `:scope > a` / `:scope > h3` can fail under jsdom; falling back to
 *   `dt.querySelector("a")` treated folder `<dt>` nodes as the first nested link and
 *   skipped `<h3>` + nested `<dl>`. Production parser uses direct-child `<a>` / `<h3>` /
 *   `<dl>` only (see `lib/bookmark-import.ts`).
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import {
  normalizeChromeBookmarkExportHtml,
  parseBookmarkHtml,
  type ParsedImportItem,
} from '../lib/bookmark-import'

function installDomParser(): void {
  const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  globalThis.DOMParser = window.DOMParser as typeof DOMParser
}

function isHttpHref(href: string): boolean {
  try {
    const u = new URL(href.trim().startsWith('http') ? href : `https://${href}`)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function inspectDom(html: string, label: string): void {
  const { window } = new JSDOM(html)
  const doc = window.document
  const dls = doc.querySelectorAll('dl').length
  const dts = doc.querySelectorAll('dt').length
  let httpAnchors = 0
  doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href') ?? ''
    if (isHttpHref(h)) httpAnchors++
  })
  console.info(
    `  [DOM ${label}] <dl>: ${dls}, <dt>: ${dts}, http <a>: ${httpAnchors}`
  )
}

function summarize(items: ParsedImportItem[]): {
  total: number
  withFolders: number
  distinctFolderLeaves: number
} {
  const withFolders = items.filter((i) => i.folderPath.length > 0).length
  const leaves = new Set(
    items
      .filter((i) => i.folderPath.length > 0)
      .map((i) => i.folderPath.join(' / '))
  )
  return {
    total: items.length,
    withFolders,
    distinctFolderLeaves: leaves.size,
  }
}

function runParse(
  html: string,
  normalize: boolean
): ReturnType<typeof summarize> {
  const { items } = parseBookmarkHtml(html, {
    normalizeChromePWrappers: normalize,
  })
  return summarize(items)
}

function folderKeyCount(html: string, normalize: boolean): number {
  return parseBookmarkHtml(html, { normalizeChromePWrappers: normalize })
    .chromeFolderKeys.length
}

interface Fixture {
  name: string
  html: string
}

const FIXTURES: Fixture[] = [
  {
    name: 'minimal_dl_dt_anchor (valid)',
    html: `<!DOCTYPE html><html><body>
<dl>
  <dt><a href="https://example.com/one">One</a></dt>
  <dt><a href="https://example.com/two">Two</a></dt>
</dl>
</body></html>`,
  },
  {
    name: 'chrome_dl_p_wrapper (invalid — same as export)',
    html: `<!DOCTYPE html><html><body>
<dl><p>
  <dt><a href="https://example.com/a">A</a></dt>
  <dt><a href="https://example.com/b">B</a></dt>
</dl>
</body></html>`,
  },
  {
    name: 'chrome_nested_folders_snippet (matches export shape)',
    html: `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<title>Bookmarks</title>
<h1>Bookmarks</h1>
<DL><p>
    <DT><H3>Bookmark Bar</H3>
    <DL><p>
        <DT><H3>Subfolder</H3>
        <DL><p>
            <DT><A HREF="https://nested.example/x">Nested X</A>
            <DT><A HREF="https://nested.example/y">Nested Y</A>
        </DL>
    </DL>
</DL>`,
  },
  {
    name: 'valid_html_dl_dd_inner_dl (not Chrome export — walker skips inner dl)',
    html: `<!DOCTYPE html><html><body>
<dl>
  <dd>
    <dl>
      <dt><a href="https://dd-wrap.example/z">Z</a></dt>
    </dl>
  </dd>
</dl>
</body></html>`,
  },
  {
    name: 'empty_h3_folder_still_in_folder_list (Chrome)',
    html: `<!DOCTYPE html><html><body>
<dl><dt><h3>Bookmark Bar</h3><dl>
  <dt><h3>Finally doneee</h3><dl>
    <dt><a href="https://example.com/a">A</a></dt>
  </dl>
  <dt><h3>Final bookmarks</h3><dl></dl>
</dl></dt></dl>
</body></html>`,
  },
]

function printComparison(name: string, html: string): void {
  console.info(`\n=== ${name} ===`)
  inspectDom(html, 'raw parser tree')
  const normalized = normalizeChromeBookmarkExportHtml(html)
  if (normalized !== html) {
    inspectDom(normalized, 'after strip <p>')
  }
  const withoutNorm = runParse(html, false)
  const withNorm = runParse(html, true)
  const keysFalse = folderKeyCount(html, false)
  const keysTrue = folderKeyCount(html, true)
  console.info(
    `  parse normalize=false → total: ${withoutNorm.total}, with folder path: ${withoutNorm.withFolders}, distinct leaf folders: ${withoutNorm.distinctFolderLeaves}, chrome folder keys: ${keysFalse}`
  )
  console.info(
    `  parse normalize=true  → total: ${withNorm.total}, with folder path: ${withNorm.withFolders}, distinct leaf folders: ${withNorm.distinctFolderLeaves}, chrome folder keys: ${keysTrue}`
  )
  if (
    withoutNorm.total !== withNorm.total ||
    withoutNorm.withFolders !== withNorm.withFolders
  ) {
    console.warn(
      '  ^ mismatch: Chrome-style markup or parser quirks affect results; stripping `<p>` inside `<dl>` fixes typical exports.'
    )
  }
}

function main(): void {
  installDomParser()

  console.info('bookmark HTML parse diagnostics\n')

  for (const f of FIXTURES) {
    printComparison(f.name, f.html)
  }

  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
  )
  const bookmarksPath = path.join(repoRoot, 'Bookmarks.html')
  if (fs.existsSync(bookmarksPath)) {
    const html = fs.readFileSync(bookmarksPath, 'utf8')
    printComparison(`file: ${path.basename(bookmarksPath)}`, html)
  } else {
    console.info(
      '\n(no Bookmarks.html at repo root — add Chrome export to run full-file check)'
    )
  }

  console.info(`
Done.

Notes:
  • jsdom’s DOMParser is a decent stand-in for the in-browser parser; counts should
    match Chrome for standard exports after the fixes above.
  • The “dl > dd > dl” fixture stays empty: the walker follows Chrome’s <dt><h3>…<dl>
    pattern, not <dd>-wrapped inner <dl>.
`)
}

main()
