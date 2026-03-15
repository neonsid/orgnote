'use client'

import { useState, useCallback } from 'react'
import { useMutation, useAction } from 'convex/react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  formatBytes,
  useFileUpload,
  type FileWithPreview,
} from '@/hooks/use-file-upload'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ImageIcon,
  VideoIcon,
  HeadphonesIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Trash2 as Trash2Icon,
  RefreshCw as RefreshCwIcon,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/reui/badge'

interface FileUploadItem extends FileWithPreview {
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  fileUrl?: string
}

interface VaultGroup {
  _id: string
  title: string
  color: string
}

interface VaultUploadProps {
  selectedGroupId: string | null
  groups: VaultGroup[]
  isLoading?: boolean
}

const getFileSignature = (file: FileWithPreview['file']) => {
  if (file instanceof File) {
    return `${file.name}-${file.size}-${file.type}-${file.lastModified}`
  }
  return `${file.name}-${file.size}-${file.type}-${file.id}`
}

export function VaultUpload({
  selectedGroupId,
  groups,
  isLoading,
}: VaultUploadProps) {
  const queryClient = useQueryClient()
  const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getPresignedUploadUrl = useAction(api.vault_node.getPresignedUploadUrl)
  const saveFileMetadata = useMutation(api.vault.saveFileMetadata)

  const handleUpload = useCallback(
    async (file: FileUploadItem) => {
      try {
        const { uploadUrl, fileUrl } = await getPresignedUploadUrl({
          fileName: file.file.name,
          fileType: file.file.type,
        })

        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.file.type)

        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setUploadFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
              )
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('Upload failed'))
          const fileToUpload = file.file as File
          xhr.send(fileToUpload)
        })

        await saveFileMetadata({
          fileName: file.file.name,
          fileType: file.file.type,
          fileSize: file.file.size,
          fileUrl: fileUrl,
          groupId: selectedGroupId
            ? (selectedGroupId as Id<'vaultGroups'>)
            : undefined,
        })

        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, progress: 100, status: 'completed', fileUrl }
              : f
          )
        )

        queryClient.invalidateQueries({ queryKey: [api.vault.getFiles] })
        toast.success('File uploaded successfully')
      } catch (error) {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'error',
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        )
        toast.error('Failed to upload file')
      }
    },
    [getPresignedUploadUrl, saveFileMetadata, selectedGroupId, queryClient]
  )

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024,
    accept: '*',
    multiple: true,
    onFilesAdded: (addedFiles) => {
      const existingSignatures = new Set(
        uploadFiles.map((fileItem) => getFileSignature(fileItem.file))
      )
      const existingIds = new Set(uploadFiles.map((fileItem) => fileItem.id))
      const uniqueFiles: FileWithPreview[] = []

      for (const file of addedFiles) {
        const signature = getFileSignature(file.file)
        if (existingSignatures.has(signature) || existingIds.has(file.id)) {
          continue
        }

        existingSignatures.add(signature)
        existingIds.add(file.id)
        uniqueFiles.push(file)
      }

      if (uniqueFiles.length === 0) return

      const newUploadFiles: FileUploadItem[] = uniqueFiles.map((file) => ({
        ...file,
        progress: 0,
        status: 'uploading' as const,
      }))

      setUploadFiles((prev) => [...prev, ...newUploadFiles])

      newUploadFiles.forEach((file) => {
        handleUpload(file)
      })
    },
  })

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="size-4" />
    if (type.startsWith('video/')) return <VideoIcon className="size-4" />
    if (type.startsWith('audio/')) return <HeadphonesIcon className="size-4" />
    if (type.includes('pdf')) return <FileTextIcon className="size-4" />
    if (type.includes('word') || type.includes('doc'))
      return <FileTextIcon className="size-4" />
    if (type.includes('excel') || type.includes('sheet'))
      return <FileSpreadsheetIcon className="size-4" />
    if (type.includes('zip') || type.includes('rar'))
      return <FileArchiveIcon className="size-4" />
    return <FileTextIcon className="size-4" />
  }

  const getFileTypeLabel = (type: string) => {
    if (type.startsWith('image/')) return 'Image'
    if (type.startsWith('video/')) return 'Video'
    if (type.startsWith('audio/')) return 'Audio'
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word') || type.includes('doc')) return 'Word'
    if (type.includes('excel') || type.includes('sheet')) return 'Excel'
    if (type.includes('zip') || type.includes('rar')) return 'Archive'
    if (type.includes('json')) return 'JSON'
    if (type.includes('text')) return 'Text'
    return 'File'
  }

  const handleCopyLink = (fileUrl: string, fileId: string) => {
    navigator.clipboard.writeText(fileUrl)
    setCopiedId(fileId)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Link copied to clipboard')
  }

  const removeUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId))
    removeFile(fileId)
  }

  const retryUpload = (file: FileUploadItem) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? {
              ...f,
              progress: 0,
              status: 'uploading' as const,
              error: undefined,
            }
          : f
      )
    )
    handleUpload({ ...file, progress: 0, status: 'uploading' })
  }

  const pendingFiles = uploadFiles.filter((f) => f.status === 'uploading')
  const completedFiles = uploadFiles.filter((f) => f.status === 'completed')
  const errorFiles = uploadFiles.filter((f) => f.status === 'error')

  if (groups.length === 0 || !selectedGroupId) {
    if (isLoading) {
      return (
        <div className="rounded-lg border-2 border-dashed p-8 text-center border-muted-foreground/25">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Loading...
              </p>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="relative rounded-lg border-2 border-dashed p-8 text-center border-muted-foreground/25">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <UploadIcon className="text-muted-foreground h-5 w-5" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {groups.length === 0
                ? 'Create a group to start uploading files'
                : 'Select a group to start uploading files'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border-2 border-dashed p-8 text-center border-muted-foreground/25">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Loading files...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (
    pendingFiles.length === 0 &&
    completedFiles.length === 0 &&
    errorFiles.length === 0
  ) {
    return (
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input {...getInputProps()} className="sr-only" />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'bg-muted flex h-12 w-12 items-center justify-center rounded-full transition-colors',
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25'
            )}
          >
            <UploadIcon className="text-muted-foreground h-5 w-5" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Drop files here or{' '}
              <span className="text-primary cursor-pointer underline-offset-4 hover:underline">
                browse files
              </span>
            </p>
            <p className="text-muted-foreground text-xs">
              Maximum file size: 5MB • Maximum files: 3
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Upload Progress</h3>
        <div className="flex gap-2">
          <Button onClick={openFileDialog} variant="outline" size="sm">
            <CloudUploadIcon className="h-4 w-4" />
            Add files
          </Button>
          {uploadFiles.length > 0 && (
            <Button
              onClick={() => {
                clearFiles()
                setUploadFiles([])
              }}
              variant="outline"
              size="sm"
            >
              <Trash2Icon className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table className="">
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="h-9 ps-4">Name</TableHead>
              <TableHead className="h-9">Type</TableHead>
              <TableHead className="h-9">Size</TableHead>
              <TableHead className="h-9 w-[150px] ps-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploadFiles.map((fileItem) => (
              <TableRow key={fileItem.id}>
                <TableCell className="py-2 ps-1.5">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground/80 relative flex size-8 shrink-0 items-center justify-center">
                      {fileItem.status === 'uploading' ? (
                        <div className="relative">
                          <svg
                            className="size-8 -rotate-90"
                            viewBox="0 0 32 32"
                          >
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-muted-foreground/20"
                            />
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeDasharray={`${2 * Math.PI * 14}`}
                              strokeDashoffset={`${2 * Math.PI * 14 * (1 - fileItem.progress / 100)}`}
                              className="text-primary transition-all duration-300"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {getFileIcon(fileItem.file.type)}
                          </div>
                        </div>
                      ) : (
                        getFileIcon(fileItem.file.type)
                      )}
                    </div>
                    <p className="flex items-center gap-2 truncate text-sm font-medium max-w-[200px]">
                      {fileItem.file.name}
                      {fileItem.status === 'error' && (
                        <Badge variant="destructive" size="sm">
                          Error
                        </Badge>
                      )}
                      {fileItem.status === 'completed' && (
                        <Badge
                          variant="secondary"
                          size="sm"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        >
                          Done
                        </Badge>
                      )}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant="secondary" className="text-xs">
                    {getFileTypeLabel(fileItem.file.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground py-2 text-sm">
                  {fileItem.status === 'uploading'
                    ? `${fileItem.progress}%`
                    : formatBytes(fileItem.file.size)}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    {fileItem.status === 'completed' && fileItem.fileUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() =>
                          handleCopyLink(fileItem.fileUrl!, fileItem.id)
                        }
                      >
                        {copiedId === fileItem.id ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    )}
                    {fileItem.status === 'error' ? (
                      <Button
                        onClick={() => retryUpload(fileItem)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive/80 hover:text-destructive size-8"
                      >
                        <RefreshCwIcon className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => removeUploadFile(fileItem.id)}
                        variant="ghost"
                        size="icon"
                        className="size-8"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  )
}
