'use client'
import {
  CloudUpload as CloudUploadIcon,
  Trash2 as Trash2Icon,
  Loader2,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { VaultFileGallery } from './vault-file-gallery'
import { VaultFile } from '../dashboard/bookmark-list/types'
import { useFileUploader } from './hooks/useFileUploader'
import { Button } from '@/components/ui/button'

interface VaultGroup {
  _id: string
  title: string
  color: string
}

interface VaultUploadProps {
  selectedGroupId: string | null
  groups: VaultGroup[]
  files: VaultFile[]
  isLoading?: boolean
  onDeleteFileAction: (file: VaultFile) => void
}

function EmptyState({
  isLoading,
  groupsLength,
}: {
  isLoading?: boolean
  groupsLength: number
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Gallery</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gallery</h3>
      </div>
      <p className="text-sm text-muted-foreground py-4 text-center">
        {groupsLength === 0
          ? 'Create a group to start uploading files'
          : 'Select a group to start uploading files'}
      </p>
    </div>
  )
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES = 3

export function VaultUpload({
  selectedGroupId,
  groups,
  files,
  isLoading,
  onDeleteFileAction,
}: VaultUploadProps) {
  const {
    uploadFiles,
    isDragging,
    removeFile,
    retryUpload,
    clearAll,
    openFileDialog,
    getInputProps,
    dragHandlers,
  } = useFileUploader({
    selectedGroupId,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE,
  })

  if (groups.length === 0 || !selectedGroupId) {
    return <EmptyState isLoading={isLoading} groupsLength={groups.length} />
  }

  const hasContent = uploadFiles.length > 0 || files.length > 0 || isLoading

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Gallery</h3>
        <div className="flex gap-2">
          <Button onClick={openFileDialog} variant="outline" size="sm">
            <CloudUploadIcon className="h-4 w-4 mr-2" />
            Add files
          </Button>
          {uploadFiles.length > 0 && (
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2Icon className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <input {...getInputProps()} className="sr-only" />

      {hasContent ? (
        <>
          <VaultFileGallery
            files={files}
            uploadFiles={uploadFiles}
            onDeleteFileAction={onDeleteFileAction}
            onRemoveUpload={removeFile}
            onRetryUpload={retryUpload}
            isLoading={isLoading}
          />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            'flex flex-col items-center justify-center py-12 text-muted-foreground rounded-lg transition-colors',
            isDragging && 'bg-primary/5'
          )}
          {...dragHandlers}
        >
          <p className="text-sm font-medium">No files yet</p>
          <p className="text-xs mt-1 text-center">
            Click <span className="font-medium text-foreground/80">Add files</span>{' '}
            above to upload
          </p>
        </motion.div>
      )}
    </div>
  )
}
