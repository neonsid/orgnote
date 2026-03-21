import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
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
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { UploadFileItem } from "@/components/vault/hooks/useFileUploader";
import { VaultTilePreview } from "./vault-tile-preview";
import { isImage, isPdf } from "./gallery-utils";

type UploadFileTileProps = {
  item: UploadFileItem;
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
  setDownloadingId: (id: string | null) => void;
  openLightbox: (src: string, alt: string) => void;
  closePopover: () => void;
  onRemoveUpload?: (fileId: string) => void;
  onRetryUpload?: (fileId: string) => void;
};

export function UploadFileTile({
  item,
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
  setDownloadingId,
  openLightbox,
  closePopover,
  onRemoveUpload,
  onRetryUpload,
}: UploadFileTileProps) {
  const id = item.id;
  const { file } = item;

  if (item.status === "uploading") {
    return (
      <>
        <div className="bg-muted/50 rounded-lg h-full w-full flex flex-col items-center justify-center gap-2 border">
          <div className="relative">
            <Loader2 className="size-10 animate-spin text-muted-foreground" />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {item.progress}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-full px-2">
            {file.name}
          </span>
        </div>
        <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity z-20">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-xs text-gray-300">{item.progress}%</p>
        </div>
      </>
    );
  }

  if (item.status === "error") {
    return (
      <>
        <div className="bg-muted rounded-lg h-full w-full flex flex-col items-center justify-center gap-2 border">
          <span className="text-xs text-destructive">Error</span>
          <span className="text-xs text-muted-foreground truncate max-w-full px-2 text-center">
            {file.name}
          </span>
        </div>

        {(isSmallMobile ? (
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
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="center" sideOffset={4}>
              <div className="flex flex-col gap-0.5">
                {onRetryUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      onRetryUpload(id);
                      closePopover();
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <RefreshCw className="size-4" />
                    Retry
                  </button>
                )}
                {onRemoveUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveUpload(id);
                      closePopover();
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="bg-black/50 absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
            {onRetryUpload && (
              <Button
                variant="secondary"
                size="icon"
                className="size-7"
                onClick={() => onRetryUpload(id)}
              >
                <RefreshCw className="size-4" />
              </Button>
            )}
            {onRemoveUpload && (
              <Button
                variant="secondary"
                size="icon"
                className="size-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveUpload(id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}

        <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity z-20">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-xs text-gray-300">{formatBytes(file.size)}</p>
        </div>
      </>
    );
  }

  const showSpinner = loadingThumbnails[id] !== false;

  return (
    <>
      <VaultTilePreview
        fileName={file.name}
        mimeType={file.type}
        imageSrc={isImage(file.type) ? item.fileUrl : undefined}
        showThumbnailSpinner={showSpinner}
        onThumbnailLoad={() =>
          updateLoadingThumbnails((prev) => ({ ...prev, [id]: false }))
        }
        onThumbnailError={() => {
          setFailedThumbnails((prev) => new Set(prev).add(id));
          updateLoadingThumbnails((prev) => ({ ...prev, [id]: false }));
        }}
        onImageClick={
          !isSmallMobile && item.fileUrl
            ? () => openLightbox(item.fileUrl!, file.name)
            : undefined
        }
        imageObjectFit="contain"
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
                if (
                  isImage(file.type) &&
                  !failedThumbnails.has(id) &&
                  item.fileUrl
                ) {
                  openLightbox(item.fileUrl, file.name);
                } else if (isPdf(file.type) && item.fileUrl) {
                  window.open(item.fileUrl, "_blank");
                }
              }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="center" sideOffset={4}>
            <div className="flex flex-col gap-0.5">
              {isPdf(file.type) && item.fileUrl && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(item.fileUrl, "_blank");
                    closePopover();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <ExternalLink className="size-4" />
                  Open in new tab
                </button>
              )}
              {isImage(file.type) &&
                !failedThumbnails.has(id) &&
                item.fileUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      openLightbox(item.fileUrl!, file.name);
                      closePopover();
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    View
                  </button>
                )}
              {item.fileUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    setDownloadingId(id);
                    try {
                      await downloadFile(
                        item.fileUrl!,
                        file.name,
                        file.type,
                      );
                    } catch {
                      toast.error("Download failed");
                    } finally {
                      setDownloadingId(null);
                    }
                    closePopover();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Download className="size-4" />
                  Download
                </button>
              )}
              {onRemoveUpload && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveUpload(id);
                    closePopover();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="bg-black/50 absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
          {item.fileUrl && (
            <>
              {isPdf(file.type) ? (
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.fileUrl, "_blank");
                  }}
                >
                  <ExternalLink className="size-4" />
                </Button>
              ) : isImage(file.type) && !failedThumbnails.has(id) ? (
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-7"
                  onClick={() =>
                    openLightbox(item.fileUrl!, file.name)
                  }
                >
                  <Plus className="size-4" />
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="icon"
                className="size-7"
                onClick={async (e) => {
                  e.stopPropagation();
                  setDownloadingId(id);
                  try {
                    await downloadFile(
                      item.fileUrl!,
                      file.name,
                      file.type,
                    );
                  } catch {
                    toast.error("Download failed");
                  } finally {
                    setDownloadingId(null);
                  }
                }}
              >
                <Download className="size-4" />
              </Button>
            </>
          )}
          {onRemoveUpload && (
            <Button
              variant="secondary"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveUpload(id);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      )}

      <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity z-20">
        <p className="truncate text-xs font-medium">{file.name}</p>
        <p className="text-xs text-gray-300">{formatBytes(file.size)}</p>
      </div>
    </>
  );
}
