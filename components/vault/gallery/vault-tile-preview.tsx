import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { getFileIcon } from "@/components/vault/file-type-utils";
import { isImage, isPdf } from "./gallery-utils";

type VaultTilePreviewProps = {
  fileName: string;
  mimeType: string;
  imageSrc?: string | null;
  /** false once loaded or errored */
  showThumbnailSpinner: boolean;
  onThumbnailLoad: () => void;
  onThumbnailError: () => void;
  onImageClick?: () => void;
  imageObjectFit: "cover" | "contain";
};

export function VaultTilePreview({
  fileName,
  mimeType,
  imageSrc,
  showThumbnailSpinner,
  onThumbnailLoad,
  onThumbnailError,
  onImageClick,
  imageObjectFit,
}: VaultTilePreviewProps) {
  if (isImage(mimeType) && imageSrc) {
    return (
      <>
        {showThumbnailSpinner && (
          <div className="bg-muted/50 rounded-lg absolute inset-0 flex items-center justify-center border z-10">
            <Spinner className="text-muted-foreground size-6" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic vault URLs */}
        <img
          src={imageSrc}
          alt={fileName}
          onLoad={onThumbnailLoad}
          onError={onThumbnailError}
          onClick={onImageClick}
          className={cn(
            "rounded-lg h-full w-full border transition-all group-hover/item:scale-105 cursor-pointer",
            imageObjectFit === "cover" ? "object-cover" : "object-contain",
            showThumbnailSpinner ? "opacity-0" : "opacity-100",
          )}
        />
      </>
    );
  }

  if (isPdf(mimeType)) {
    return (
      <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
        {/* eslint-disable-next-line @next/next/no-img-element -- static asset */}
        <img
          src="/pdf2.png"
          alt="PDF"
          className={cn(
            "rounded-lg h-full w-full p-2",
            imageObjectFit === "cover" ? "object-cover" : "object-contain",
          )}
        />
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
      {getFileIcon(mimeType)}
    </div>
  );
}
