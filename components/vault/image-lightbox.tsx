'use client'

import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  src: string
  alt: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageLightbox({
  src,
  alt,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className={cn(
            'bg-black/60 backdrop-blur-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'duration-200 outline-none p-0'
          )}
        >
          <DialogTitle className="sr-only">
            View image: {alt}
          </DialogTitle>
          <div className="relative">
            <img
              src={src}
              alt={alt}
              className="max-w-[min(42rem,95vw)] max-h-[85vh] w-auto h-auto object-contain rounded-lg border shadow-2xl"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 size-8 rounded-full bg-black/70 text-white hover:bg-black/90 hover:text-white shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
