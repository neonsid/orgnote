'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { downloadFile } from '@/lib/download-file'
import { formatBytes } from '@/hooks/use-file-upload'
import { getFileIcon } from './file-type-utils'
import { VaultFile } from '../dashboard/bookmark-list/types'
import {
  Plus,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { ImageLightbox } from './image-lightbox'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { useIsSmallMobile } from '@/hooks/use-mobile'
import { SortDropdown, type VaultSortType } from './sort-dropdown'

function isImage(type: string) {
  return type.startsWith('image/')
}

function isPdf(type: string) {
  return type.includes('pdf')
}

export interface UploadFileItem {
  id: string
  file: { name: string; type: string; size: number }
  progress: number
  status: 'uploading' | 'completed' | 'error'
  fileUrl?: string
}

interface VaultFileGalleryProps {
  files: VaultFile[]
  uploadFiles?: UploadFileItem[]
  onDeleteFile: (file: VaultFile) => void
  onRemoveUpload?: (fileId: string) => void
  onRetryUpload?: (file: UploadFileItem) => void
  isLoading?: boolean
}

export const VaultFileGallery = memo(function VaultFileGallery({
  files,
  uploadFiles = [],
  onDeleteFile,
  onRemoveUpload,
  onRetryUpload,
  isLoading,
}: VaultFileGalleryProps) {
  const isSmallMobile = useIsSmallMobile()
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const ignoreNextClickId = useRef<string | null>(null)
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set()
  )
  const [loadingThumbnails, setLoadingThumbnails] = useState<
    Record<string, boolean>
  >({})
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState({ src: '', alt: '' })
  const [sortBy, setSortBy] = useState<VaultSortType>('latest')

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'latest') return b.createdAt - a.createdAt
    if (sortBy === 'size') return b.size - a.size
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxSrc({ src, alt })
    setLightboxOpen(true)
  }, [])

  const closePopover = useCallback(() => setOpenPopoverId(null), [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (!isSmallMobile) return
      longPressTimer.current = setTimeout(() => {
        ignoreNextClickId.current = id
        setOpenPopoverId(id)
      }, 500)
    },
    [isSmallMobile]
  )

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isSmallMobile) {
      setTimeout(() => {
        ignoreNextClickId.current = null
      }, 200)
    }
  }, [isSmallMobile])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isSmallMobile) e.preventDefault()
    },
    [isSmallMobile]
  )

  useEffect(() => {
    if (!openPopoverId || !isSmallMobile) return
    const t = setTimeout(() => setOpenPopoverId(null), 4000)
    return () => clearTimeout(t)
  }, [openPopoverId, isSmallMobile])

  const totalSize =
    files.reduce((sum, f) => sum + f.size, 0) +
    uploadFiles.reduce((sum, f) => sum + f.file.size, 0)
  const totalCount = files.length + uploadFiles.length

  const hasContent = totalCount > 0

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
      )
    }
    return null
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
        {/* Stored files first (sorted), then uploads at end */}
        {sortedFiles.map((file) => (
          <motion.div
            key={file._id}
            layout={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="group/item relative aspect-square"
          >
            {(() => {
              if (isImage(file.type)) {
                return (
                  <>
                    {loadingThumbnails[file._id] !== false && (
                      <div className="bg-muted/50 rounded-lg absolute inset-0 flex items-center justify-center border z-10">
                        <Spinner className="text-muted-foreground size-6" />
                      </div>
                    )}
                    <img
                      src={file.url}
                      alt={file.name}
                      onLoad={() =>
                        setLoadingThumbnails((prev) => ({
                          ...prev,
                          [file._id]: false,
                        }))
                      }
                      onError={() => {
                        setFailedThumbnails((prev) =>
                          new Set(prev).add(file._id)
                        )
                        setLoadingThumbnails((prev) => ({
                          ...prev,
                          [file._id]: false,
                        }))
                      }}
                      onClick={() =>
                        !isSmallMobile && openLightbox(file.url, file.name)
                      }
                      className={cn(
                        'rounded-lg h-full w-full border object-cover transition-all group-hover/item:scale-105 cursor-pointer',
                        loadingThumbnails[file._id] !== false
                          ? 'opacity-0'
                          : 'opacity-100'
                      )}
                    />
                  </>
                )
              }
              if (isPdf(file.type)) {
                return (
                  <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
                    <img
                      src="/pdf2.png"
                      alt="PDF"
                      className="rounded-lg h-full w-full object-cover p-2"
                    />
                  </div>
                )
              }
              return (
                <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
                  {getFileIcon(file.type)}
                </div>
              )
            })()}

            {/* Overlay (desktop) or Popover (mobile) */}
            {isSmallMobile ? (
              <Popover
                open={openPopoverId === file._id}
                onOpenChange={(open) => !open && setOpenPopoverId(null)}
              >
                <PopoverTrigger asChild>
                  <div
                    className="absolute inset-0 z-20 cursor-pointer rounded-lg"
                    onTouchStart={(e) => handleTouchStart(e, file._id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    onContextMenu={handleContextMenu}
                    onClick={() => {
                      if (ignoreNextClickId.current === file._id) {
                        ignoreNextClickId.current = null
                        return
                      }
                      if (
                        isImage(file.type) &&
                        !failedThumbnails.has(file._id)
                      ) {
                        openLightbox(file.url, file.name)
                      } else if (isPdf(file.type)) {
                        window.open(file.url, '_blank')
                      }
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-1"
                  align="center"
                  sideOffset={4}
                >
                  <div className="flex flex-col gap-0.5">
                    {isPdf(file.type) ? (
                      <button
                        onClick={() => {
                          window.open(file.url, '_blank')
                          closePopover()
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <ExternalLink className="size-4" />
                        Open in new tab
                      </button>
                    ) : null}
                    {isImage(file.type) && !failedThumbnails.has(file._id) ? (
                      <button
                        onClick={() => {
                          openLightbox(file.url, file.name)
                          closePopover()
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <Plus className="size-4" />
                        View
                      </button>
                    ) : null}
                    <button
                      onClick={async () => {
                        setDownloadingId(file._id)
                        try {
                          await downloadFile(file.url, file.name, file.type)
                        } catch {
                          toast.error('Download failed')
                        } finally {
                          setDownloadingId(null)
                        }
                        closePopover()
                      }}
                      disabled={downloadingId === file._id}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                    >
                      <Download className="size-4" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        onDeleteFile(file)
                        closePopover()
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
                      e.stopPropagation()
                      window.open(file.url, '_blank')
                    }}
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                ) : isImage(file.type) && !failedThumbnails.has(file._id) ? (
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
                  disabled={downloadingId === file._id}
                  onClick={async (e) => {
                    e.stopPropagation()
                    setDownloadingId(file._id)
                    try {
                      await downloadFile(file.url, file.name, file.type)
                    } catch {
                      toast.error('Download failed')
                    } finally {
                      setDownloadingId(null)
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
                    e.stopPropagation()
                    onDeleteFile(file)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}

            {/* File info */}
            <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity z-20">
              <p className="truncate text-xs font-medium">{file.name}</p>
              <p className="text-xs text-gray-300">{formatBytes(file.size)}</p>
            </div>
          </motion.div>
        ))}

        {/* Uploads at end */}
        <AnimatePresence mode="popLayout">
          {uploadFiles.map((item) => (
            <motion.div
              key={item.id}
              layout={false}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="group/item relative aspect-square"
            >
              {item.status === 'uploading' ? (
                <div className="bg-muted/50 rounded-lg h-full w-full flex flex-col items-center justify-center gap-2 border">
                  <div className="relative">
                    <Loader2 className="size-10 animate-spin text-muted-foreground" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {item.progress}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-full px-2">
                    {item.file.name}
                  </span>
                </div>
              ) : item.status === 'error' ? (
                <div className="bg-muted rounded-lg h-full w-full flex flex-col items-center justify-center gap-2 border">
                  <span className="text-xs text-destructive">Error</span>
                  <span className="text-xs text-muted-foreground truncate max-w-full px-2 text-center">
                    {item.file.name}
                  </span>
                </div>
              ) : (
                (() => {
                  if (isImage(item.file.type)) {
                    return (
                      <>
                        {loadingThumbnails[item.id] !== false && (
                          <div className="bg-muted/50 rounded-lg absolute inset-0 flex items-center justify-center border z-10">
                            <Spinner className="text-muted-foreground size-6" />
                          </div>
                        )}
                        <img
                          src={item.fileUrl}
                          alt={item.file.name}
                          onLoad={() =>
                            setLoadingThumbnails((prev) => ({
                              ...prev,
                              [item.id]: false,
                            }))
                          }
                          onError={() => {
                            setFailedThumbnails((prev) =>
                              new Set(prev).add(item.id)
                            )
                            setLoadingThumbnails((prev) => ({
                              ...prev,
                              [item.id]: false,
                            }))
                          }}
                          onClick={() =>
                            !isSmallMobile &&
                            openLightbox(item.fileUrl!, item.file.name)
                          }
                          className={cn(
                            'rounded-lg h-full w-full border object-contain transition-all group-hover/item:scale-105 cursor-pointer',
                            loadingThumbnails[item.id] !== false
                              ? 'opacity-0'
                              : 'opacity-100'
                          )}
                        />
                      </>
                    )
                  }
                  if (isPdf(item.file.type)) {
                    return (
                      <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
                        <img
                          src="/pdf2.png"
                          alt="PDF"
                          className="rounded-lg h-full w-full object-contain p-2"
                        />
                      </div>
                    )
                  }
                  return (
                    <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
                      {getFileIcon(item.file.type)}
                    </div>
                  )
                })()
              )}

              {/* Overlay (desktop) or Popover (mobile) - only for completed/error */}
              {(item.status === 'completed' || item.status === 'error') &&
                (isSmallMobile ? (
                  <Popover
                    open={openPopoverId === item.id}
                    onOpenChange={(open) => !open && setOpenPopoverId(null)}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className="absolute inset-0 z-20 cursor-pointer rounded-lg"
                        onTouchStart={(e) => handleTouchStart(e, item.id)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onContextMenu={handleContextMenu}
                        onClick={() => {
                          if (ignoreNextClickId.current === item.id) {
                            ignoreNextClickId.current = null
                            return
                          }
                          if (item.status === 'completed') {
                            if (
                              isImage(item.file.type) &&
                              !failedThumbnails.has(item.id)
                            ) {
                              openLightbox(item.fileUrl!, item.file.name)
                            } else if (isPdf(item.file.type)) {
                              window.open(item.fileUrl, '_blank')
                            }
                          }
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-1"
                      align="center"
                      sideOffset={4}
                    >
                      <div className="flex flex-col gap-0.5">
                        {item.status === 'completed' &&
                          isPdf(item.file.type) && (
                            <button
                              onClick={() => {
                                window.open(item.fileUrl, '_blank')
                                closePopover()
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                            >
                              <ExternalLink className="size-4" />
                              Open in new tab
                            </button>
                          )}
                        {item.status === 'completed' &&
                          isImage(item.file.type) &&
                          !failedThumbnails.has(item.id) && (
                            <button
                              onClick={() => {
                                openLightbox(item.fileUrl!, item.file.name)
                                closePopover()
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                            >
                              <Plus className="size-4" />
                              View
                            </button>
                          )}
                        {item.status === 'completed' && item.fileUrl && (
                          <button
                            onClick={async () => {
                              setDownloadingId(item.id)
                              try {
                                await downloadFile(
                                  item.fileUrl!,
                                  item.file.name,
                                  item.file.type
                                )
                              } catch {
                                toast.error('Download failed')
                              } finally {
                                setDownloadingId(null)
                              }
                              closePopover()
                            }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <Download className="size-4" />
                            Download
                          </button>
                        )}
                        {item.status === 'error' && onRetryUpload && (
                          <button
                            onClick={() => {
                              onRetryUpload(item)
                              closePopover()
                            }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <RefreshCw className="size-4" />
                            Retry
                          </button>
                        )}
                        {onRemoveUpload && (
                          <button
                            onClick={() => {
                              onRemoveUpload(item.id)
                              closePopover()
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
                    {item.status === 'completed' && item.fileUrl && (
                      <>
                        {isPdf(item.file.type) ? (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(item.fileUrl, '_blank')
                            }}
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        ) : isImage(item.file.type) &&
                          !failedThumbnails.has(item.id) ? (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7"
                            onClick={() =>
                              openLightbox(item.fileUrl!, item.file.name)
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
                            e.stopPropagation()
                            setDownloadingId(item.id)
                            try {
                              await downloadFile(
                                item.fileUrl!,
                                item.file.name,
                                item.file.type
                              )
                            } catch {
                              toast.error('Download failed')
                            } finally {
                              setDownloadingId(null)
                            }
                          }}
                        >
                          <Download className="size-4" />
                        </Button>
                      </>
                    )}
                    {item.status === 'error' && onRetryUpload && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7"
                        onClick={() => onRetryUpload(item)}
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
                          e.stopPropagation()
                          onRemoveUpload(item.id)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}

              {/* File info - visible on mobile, hover on desktop */}
              <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity z-20">
                <p className="truncate text-xs font-medium">{item.file.name}</p>
                <p className="text-xs text-gray-300">
                  {item.status === 'uploading'
                    ? `${item.progress}%`
                    : formatBytes(item.file.size)}
                </p>
              </div>
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
  )
})
