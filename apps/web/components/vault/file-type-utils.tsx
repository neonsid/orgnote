import {
  ImageIcon,
  VideoIcon,
  HeadphonesIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
  FileIcon,
  type LucideIcon,
} from 'lucide-react'

export type FileTypeConfig = {
  label: string
  icon: LucideIcon
  test: (type: string) => boolean
}

export const FILE_TYPES: FileTypeConfig[] = [
  {
    label: 'Image',
    icon: ImageIcon,
    test: (t) => t.startsWith('image/'),
  },
  {
    label: 'Video',
    icon: VideoIcon,
    test: (t) => t.startsWith('video/'),
  },
  {
    label: 'Audio',
    icon: HeadphonesIcon,
    test: (t) => t.startsWith('audio/'),
  },
  {
    label: 'PDF',
    icon: FileTextIcon,
    test: (t) => t.includes('pdf'),
  },
  {
    label: 'Word',
    icon: FileTextIcon,
    test: (t) => t.includes('word') || t.includes('doc'),
  },
  {
    label: 'Excel',
    icon: FileSpreadsheetIcon,
    test: (t) => t.includes('excel') || t.includes('sheet'),
  },
  {
    label: 'Archive',
    icon: FileArchiveIcon,
    test: (t) => t.includes('zip') || t.includes('rar'),
  },
  {
    label: 'JSON',
    icon: FileTextIcon,
    test: (t) => t.includes('json'),
  },
  {
    label: 'Text',
    icon: FileTextIcon,
    test: (t) => t.includes('text'),
  },
]

const DEFAULT_FILE_TYPE: Omit<FileTypeConfig, 'test'> = {
  label: 'File',
  icon: FileIcon,
}

export function getFileType(type: string): FileTypeConfig {
  return (
    FILE_TYPES.find((ft) => ft.test(type)) ??
    (DEFAULT_FILE_TYPE as FileTypeConfig)
  )
}

export function getFileIcon(type: string) {
  const { icon: Icon } = getFileType(type)
  return <Icon className="size-4" />
}

export function getFileTypeLabel(type: string) {
  return getFileType(type).label
}
