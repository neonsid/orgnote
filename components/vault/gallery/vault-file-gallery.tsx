"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatBytes } from "@/hooks/use-file-upload";
import { VaultFile } from "@/components/dashboard/bookmark-list/types";
import { ImageLightbox } from "@/components/vault/image-lightbox";
import { SortDropdown, type VaultSortType } from "@/components/vault/sort-dropdown";
import { useIsSmallMobile } from "@/hooks/use-mobile";
import type { UploadFileItem } from "@/components/vault/hooks/useFileUploader";
import { filterUploadsNotYetInFiles, sortVaultFiles } from "./gallery-utils";
import { StoredFileTile } from "./stored-file-tile";
import { UploadFileTile } from "./upload-file-tile";

export type { UploadFileItem };

interface VaultFileGalleryProps {
  files: VaultFile[];
  uploadFiles?: UploadFileItem[];
  onDeleteFileAction: (file: VaultFile) => void;
  onRemoveUpload?: (fileId: string) => void;
  onRetryUpload?: (fileId: string) => void;
  isLoading?: boolean;
}

export const VaultFileGallery = memo(function VaultFileGallery({
  files,
  uploadFiles = [],
  onDeleteFileAction,
  onRemoveUpload,
  onRetryUpload,
  isLoading,
}: VaultFileGalleryProps) {
  const isSmallMobile = useIsSmallMobile();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const ignoreNextClickId = useRef<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set(),
  );
  const [loadingThumbnails, setLoadingThumbnails] = useState<
    Record<string, boolean>
  >({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState({ src: "", alt: "" });
  const [sortBy, setSortBy] = useState<VaultSortType>("latest");

  const sortedFiles = useMemo(
    () => sortVaultFiles(files, sortBy),
    [files, sortBy],
  );

  const visibleUploadFiles = useMemo(
    () => filterUploadsNotYetInFiles(uploadFiles, files),
    [uploadFiles, files],
  );

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxSrc({ src, alt });
    setLightboxOpen(true);
  }, [setLightboxOpen]);

  const closePopover = useCallback(() => setOpenPopoverId(null), []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!isSmallMobile) return;
      longPressTimer.current = setTimeout(() => {
        ignoreNextClickId.current = id;
        setOpenPopoverId(id);
      }, 500);
    },
    [isSmallMobile],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isSmallMobile) {
      setTimeout(() => {
        ignoreNextClickId.current = null;
      }, 200);
    }
  }, [isSmallMobile]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isSmallMobile) e.preventDefault();
    },
    [isSmallMobile],
  );

  useEffect(() => {
    if (!openPopoverId || !isSmallMobile) return;
    const t = setTimeout(() => setOpenPopoverId(null), 4000);
    return () => clearTimeout(t);
  }, [openPopoverId, isSmallMobile]);

  const totalSize =
    files.reduce((sum, f) => sum + f.size, 0) +
    visibleUploadFiles.reduce((sum, f) => sum + f.file.size, 0);
  const totalCount = files.length + visibleUploadFiles.length;

  const hasContent = files.length + uploadFiles.length > 0;

  if (!hasContent) {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Gallery ({totalCount}) Total: {formatBytes(totalSize)}
        </p>
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedFiles.map((file) => (
          <motion.div
            key={file._id}
            layout={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="group/item relative aspect-square"
          >
            <StoredFileTile
              file={file}
              isSmallMobile={isSmallMobile}
              openPopoverId={openPopoverId}
              setOpenPopoverId={setOpenPopoverId}
              ignoreNextClickId={ignoreNextClickId}
              handleTouchStart={handleTouchStart}
              handleTouchEnd={handleTouchEnd}
              handleContextMenu={handleContextMenu}
              failedThumbnails={failedThumbnails}
              setFailedThumbnails={setFailedThumbnails}
              loadingThumbnails={loadingThumbnails}
              updateLoadingThumbnails={setLoadingThumbnails}
              downloadingId={downloadingId}
              setDownloadingId={setDownloadingId}
              openLightbox={openLightbox}
              closePopover={closePopover}
              onDeleteFileAction={onDeleteFileAction}
            />
          </motion.div>
        ))}

        <AnimatePresence mode="popLayout">
          {visibleUploadFiles.map((item) => (
            <motion.div
              key={item.id}
              layout={false}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="group/item relative aspect-square"
            >
              <UploadFileTile
                item={item}
                isSmallMobile={isSmallMobile}
                openPopoverId={openPopoverId}
                setOpenPopoverId={setOpenPopoverId}
                ignoreNextClickId={ignoreNextClickId}
                handleTouchStart={handleTouchStart}
                handleTouchEnd={handleTouchEnd}
                handleContextMenu={handleContextMenu}
                failedThumbnails={failedThumbnails}
                setFailedThumbnails={setFailedThumbnails}
                loadingThumbnails={loadingThumbnails}
                updateLoadingThumbnails={setLoadingThumbnails}
                setDownloadingId={setDownloadingId}
                openLightbox={openLightbox}
                closePopover={closePopover}
                onRemoveUpload={onRemoveUpload}
                onRetryUpload={onRetryUpload}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ImageLightbox
        src={lightboxSrc.src}
        alt={lightboxSrc.alt}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
});
