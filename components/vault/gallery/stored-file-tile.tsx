import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download-file";
import { formatBytes } from "@/hooks/use-file-upload";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import { VaultFile } from "@/components/dashboard/bookmark-list/types";
import { VaultTilePreview } from "./vault-tile-preview";
import { isImage, isPdf } from "./gallery-utils";

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
  onDeleteFileAction: (file: VaultFile) => void;
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
  onDeleteFileAction,
}: StoredFileTileProps) {
  const id = file._id;
  const showSpinner = loadingThumbnails[id] !== false;

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
        onImageClick={
          !isSmallMobile ? () => openLightbox(file.url, file.name) : undefined
        }
        imageObjectFit="cover"
      />

      {isSmallMobile ? (
        <Popover
          open={openPopoverId === id}
          onOpenChange={(open) => !open && setOpenPopoverId(null)}
        >
          <PopoverTrigger asChild>
            <div
              className="absolute inset-0 z-20 cursor-pointer rounded-lg"
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
        <div className="bg-black/50 absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
          {isPdf(file.type) ? (
            <Button
              variant="secondary"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                window.open(file.url, "_blank");
              }}
            >
              <ExternalLink className="size-4" />
            </Button>
          ) : isImage(file.type) && !failedThumbnails.has(id) ? (
            <Button
              variant="secondary"
              size="icon"
              className="size-7"
              onClick={() => openLightbox(file.url, file.name)}
            >
              <Plus className="size-4" />
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="icon"
            className="size-7"
            disabled={downloadingId === id}
            onClick={async (e) => {
              e.stopPropagation();
              setDownloadingId(id);
              try {
                await downloadFile(file.url, file.name, file.type);
              } catch {
                toast.error("Download failed");
              } finally {
                setDownloadingId(null);
              }
            }}
          >
            <Download className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFileAction(file);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity z-20">
        <p className="truncate text-xs font-medium">{file.name}</p>
        <p className="text-xs text-gray-300">{formatBytes(file.size)}</p>
      </div>
    </>
  );
}
