"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { downloadFile } from "@/lib/download-file";
import { formatBytes } from "@/hooks/use-file-upload";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  Plus,
  Trash2,
  Download,
  ExternalLink,
  ChevronsRight,
} from "lucide-react";
import { VaultFile } from "@/components/dashboard/bookmark-list/types";
import { VaultTilePreview } from "./vault-tile-preview";
import { VaultDesktopFileMenu } from "./vault-desktop-file-menu";
import {
  buildOtherVaultGroups,
  isImage,
  isPdf,
  FIRST_SCREEN_TILE_PRIORITY_COUNT,
  type VaultGroupPickRow,
} from "./gallery-utils";
import type { Id } from "@/convex/_generated/dataModel";

type StoredFileTileProps = {
  file: VaultFile;
  isSmallMobile: boolean;
  openPopoverId: string | null;
  setOpenPopoverId: (id: string | null) => void;
  ignoreNextClickId: React.MutableRefObject<string | null>;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: () => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  failedThumbnails: Set<string>;
  setFailedThumbnails: React.Dispatch<React.SetStateAction<Set<string>>>;
  loadingThumbnails: Record<string, boolean>;
  updateLoadingThumbnails: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  downloadingId: string | null;
  setDownloadingId: (id: string | null) => void;
  openLightbox: (src: string, alt: string) => void;
  closePopover: () => void;
  vaultGroups: VaultGroupPickRow[];
  onMoveFileAction: (
    file: VaultFile,
    targetGroupId: Id<"vaultGroups">,
  ) => void;
  onDeleteFileAction: (file: VaultFile) => void;
  /** Grid index for LCP: first tiles use Next/Image priority. */
  tileIndex: number;
};

export function StoredFileTile({
  file,
  isSmallMobile,
  openPopoverId,
  setOpenPopoverId,
  ignoreNextClickId,
  handleTouchStart,
  handleTouchEnd,
  handleContextMenu,
  failedThumbnails,
  setFailedThumbnails,
  loadingThumbnails,
  updateLoadingThumbnails,
  downloadingId,
  setDownloadingId,
  openLightbox,
  closePopover,
  vaultGroups,
  onMoveFileAction,
  onDeleteFileAction,
  tileIndex,
}: StoredFileTileProps) {
  const id = file._id;
  const showSpinner = loadingThumbnails[id] !== false;
  const [moveTargetsOpen, setMoveTargetsOpen] = useState(false);

  const otherVaultGroups = useMemo(
    () => buildOtherVaultGroups(vaultGroups, file.groupId),
    [vaultGroups, file.groupId],
  );

  useEffect(() => {
    if (openPopoverId !== id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset submenu when another tile opens
      setMoveTargetsOpen(false);
    }
  }, [openPopoverId, id]);

  function handleDesktopTileClick() {
    if (isImage(file.type) && !failedThumbnails.has(id)) {
      openLightbox(file.url, file.name);
      return;
    }
    window.open(file.url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <VaultTilePreview
        fileName={file.name}
        mimeType={file.type}
        imageSrc={isImage(file.type) ? file.url : undefined}
        showThumbnailSpinner={showSpinner}
        onThumbnailLoad={() =>
          updateLoadingThumbnails((prev) => ({ ...prev, [id]: false }))
        }
        onThumbnailError={() => {
          setFailedThumbnails((prev) => new Set(prev).add(id));
          updateLoadingThumbnails((prev) => ({ ...prev, [id]: false }));
        }}
        onImageClick={undefined}
        imageObjectFit="cover"
        imagePriority={tileIndex < FIRST_SCREEN_TILE_PRIORITY_COUNT}
      />

      {isSmallMobile ? (
        <Popover
          open={openPopoverId === id}
          onOpenChange={(open) => !open && setOpenPopoverId(null)}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Open ${file.name}`}
              className="absolute inset-0 z-20 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              onTouchStart={(e) => handleTouchStart(e, id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onContextMenu={handleContextMenu}
              onClick={() => {
                if (ignoreNextClickId.current === id) {
                  ignoreNextClickId.current = null;
                  return;
                }
                if (isImage(file.type) && !failedThumbnails.has(id)) {
                  openLightbox(file.url, file.name);
                } else if (isPdf(file.type)) {
                  window.open(file.url, "_blank");
                }
              }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="center" sideOffset={4}>
            <div className="flex flex-col gap-0.5">
              {isPdf(file.type) ? (
                <button
                  type="button"
                  onClick={() => {
                    window.open(file.url, "_blank");
                    closePopover();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <ExternalLink className="size-4" />
                  Open in new tab
                </button>
              ) : null}
              {isImage(file.type) && !failedThumbnails.has(id) ? (
                <button
                  type="button"
                  onClick={() => {
                    openLightbox(file.url, file.name);
                    closePopover();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Plus className="size-4" />
                  View
                </button>
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  setDownloadingId(id);
                  try {
                    await downloadFile(file.url, file.name, file.type);
                  } catch {
                    toast.error("Download failed");
                  } finally {
                    setDownloadingId(null);
                  }
                  closePopover();
                }}
                disabled={downloadingId === id}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
              >
                <Download className="size-4" />
                Download
              </button>
              {otherVaultGroups.length > 0 ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setMoveTargetsOpen((open) => !open)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <ChevronsRight
                      className={`size-4 shrink-0 transition-transform ${moveTargetsOpen ? "rotate-90" : ""}`}
                    />
                    Move to
                  </button>
                  {moveTargetsOpen ? (
                    <div className="mt-1 ml-2 space-y-0.5 border-l border-border pl-2">
                      {otherVaultGroups.map(({ group, fallbackColor }) => (
                        <button
                          key={group._id}
                          type="button"
                          onClick={() => {
                            onMoveFileAction(file, group._id);
                            setMoveTargetsOpen(false);
                            closePopover();
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: group.color || fallbackColor,
                            }}
                          />
                          <span className="min-w-0 truncate">
                            {group.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onDeleteFileAction(file);
                  closePopover();
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              aria-label={`${file.name} — right-click for options`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleDesktopTileClick();
                }
              }}
              onClick={handleDesktopTileClick}
              className="absolute inset-0 z-20 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </ContextMenuTrigger>
          <VaultDesktopFileMenu
            file={file}
            vaultGroups={vaultGroups}
            failedThumbnails={failedThumbnails}
            id={id}
            downloadingId={downloadingId}
            setDownloadingId={setDownloadingId}
            openLightbox={openLightbox}
            onMoveFileAction={onMoveFileAction}
            onDeleteFileAction={onDeleteFileAction}
          />
        </ContextMenu>
      )}

      <div className="rounded-b-lg absolute right-0 bottom-0 left-0 z-10 bg-black/70 p-2 text-white">
        <p className="truncate text-xs font-medium">{file.name}</p>
        <p className="text-xs text-zinc-300">{formatBytes(file.size)}</p>
      </div>
    </>
  );
}
