import Image from "next/image";
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
    const imageClassName = cn(
      "rounded-lg border transition-all group-hover/item:scale-105",
      imageObjectFit === "cover" ? "object-cover" : "object-contain",
      showThumbnailSpinner ? "opacity-0" : "opacity-100",
      onImageClick && "cursor-pointer",
    );

    const image = (
      <Image
        src={imageSrc}
        alt={fileName}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className={imageClassName}
        unoptimized
        onLoad={onThumbnailLoad}
        onError={onThumbnailError}
      />
    );

    return (
      <>
        {showThumbnailSpinner && (
          <div className="bg-muted/50 rounded-lg absolute inset-0 flex items-center justify-center border z-10">
            <Spinner className="text-muted-foreground size-6" />
          </div>
        )}
        {onImageClick ? (
          <button
            type="button"
            aria-label={`View ${fileName}`}
            onClick={onImageClick}
            className="relative block h-full w-full rounded-lg border-0 bg-transparent p-0"
          >
            {image}
          </button>
        ) : (
          <div className="relative h-full w-full">{image}</div>
        )}
      </>
    );
  }

  if (isPdf(mimeType)) {
    return (
      <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border p-2">
        <Image
          src="/pdf2.png"
          alt="PDF"
          width={160}
          height={160}
          sizes="160px"
          className={cn(
            "rounded-lg h-full w-full max-h-full",
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
