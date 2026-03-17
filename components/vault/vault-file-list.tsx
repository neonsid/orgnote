'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { downloadFile } from '@/lib/download-file'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 as Trash2Icon, Download } from 'lucide-react'
import { formatBytes } from '@/hooks/use-file-upload'
import { getFileIcon, getFileTypeLabel } from './file-type-utils'
import { VaultFile } from '../dashboard/bookmark-list/types'

interface VaultFileListProps {
  files: VaultFile[]
  onDeleteFile: (file: VaultFile) => void
  isLoading?: boolean
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const VaultFileList = memo(function VaultFileList({
  files,
  onDeleteFile,
  isLoading,
}: VaultFileListProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  if (files.length === 0) {
    if (isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full space-y-1"
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="size-8 rounded bg-muted" />
              <div className="flex-1 flex items-center gap-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted hidden sm:block" />
              </div>
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          ))}
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <p className="text-sm font-medium">No files uploaded yet</p>
        <p className="text-xs mt-1">Upload files using the dropzone above</p>
      </motion.div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="h-9 ps-4">Name</TableHead>
            <TableHead className="h-9">Type</TableHead>
            <TableHead className="h-9">Size</TableHead>
            <TableHead className="h-9">Date</TableHead>
            <TableHead className="h-9 w-[150px] ps-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <motion.tr
                key={file._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <TableCell className="py-2 ps-1.5">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground/80 flex size-8 shrink-0 items-center justify-center">
                      {file.type.startsWith('image/') &&
                      file.url &&
                      !failedImages.has(file._id) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="size-8 rounded object-cover"
                          onError={() => {
                            setFailedImages((prev) =>
                              new Set(prev).add(file._id)
                            )
                          }}
                        />
                      ) : (
                        getFileIcon(file.type)
                      )}
                    </div>
                    <span className="truncate text-sm font-medium max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <span className="text-xs text-muted-foreground">
                    {getFileTypeLabel(file.type)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground py-2 text-sm">
                  {formatBytes(file.size)}
                </TableCell>
                <TableCell className="text-muted-foreground py-2 text-sm">
                  {formatDate(file.createdAt)}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      disabled={downloadingId === file._id}
                      onClick={async () => {
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
                      <Download className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive/80 hover:text-destructive"
                      onClick={() => onDeleteFile(file)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  )
})
