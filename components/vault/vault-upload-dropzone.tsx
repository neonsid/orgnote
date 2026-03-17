'use client'

import { Upload as UploadIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VaultUploadDropzoneProps {
  isDragging: boolean
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void
  onDragOver: (e: React.DragEvent<HTMLElement>) => void
  onDrop: (e: React.DragEvent<HTMLElement>) => void
  onClick: () => void
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
}

export function VaultUploadDropzone({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  inputProps,
}: VaultUploadDropzoneProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      <input {...inputProps} className="sr-only" />

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
