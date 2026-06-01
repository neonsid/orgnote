import { useMutation } from 'convex/react'
import * as Clipboard from 'expo-clipboard'
import { useRef, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EditBookmarkModal } from '@/components/dialogs/edit-bookmark-modal'
import { DetailSheet } from '@/components/ui/detail-sheet'
import {
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuSubItem,
  MenuSubTrigger,
} from '@/components/ui/menu-item'
import { showThemedAlert } from '@/contexts/themed-alert'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { useTabBarHeight } from '@/hooks/use-tab-bar-height'
import { openInAppBrowser } from '@/lib/open-in-app-browser'
import { FALLBACK_COLORS } from '@goldfish/shared'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import type { BookmarkData } from './bookmark-card'

export type BookmarkMenuAnchor = {
  x: number
  y: number
  width: number
  height: number
}

interface Group {
  _id: Id<'groups'>
  title: string
  color?: string
}

interface BookmarkContextMenuProps {
  bookmark: BookmarkData | null
  anchor: BookmarkMenuAnchor | null
  groups: Group[]
  currentGroupId: Id<'groups'> | null
  onClose: () => void
  onEnterMultiSelect: (bookmarkId: Id<'bookmarks'>) => void
}

const MENU_WIDTH = 224
const MENU_EDGE = 12
const AUTO_CLOSE_MS = 4000

function BookmarkContextMenuContent({
  bookmark: b,
  anchor,
  groups,
  currentGroupId,
  onClose,
  onEnterMultiSelect,
  onEdit,
  onShowDescription,
}: {
  bookmark: BookmarkData
  anchor: BookmarkMenuAnchor
  groups: Group[]
  currentGroupId: Id<'groups'> | null
  onClose: () => void
  onEnterMultiSelect: (bookmarkId: Id<'bookmarks'>) => void
  onEdit: () => void
  onShowDescription: () => void
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const tabBarHeight = useTabBarHeight()
  const [moveOpen, setMoveOpen] = useState(false)
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteBookmark = useMutation(api.bookmarks.mutations.deleteBookMark)
  const toggleRead = useMutation(api.bookmarks.mutations.toggleReadStatus)
  const moveBookmark = useMutation(api.bookmarks.mutations.moveBookMark)

  const moveTargets = groups.filter((g) => g._id !== currentGroupId)

  function clearAutoCloseTimer() {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
  }

  function scheduleAutoClose() {
    clearAutoCloseTimer()
    autoCloseTimerRef.current = setTimeout(onClose, AUTO_CLOSE_MS)
  }

  useMountEffect(() => {
    scheduleAutoClose()
    return clearAutoCloseTimer
  })

  function handleClose() {
    clearAutoCloseTimer()
    onClose()
  }

  function toggleMoveOpen() {
    setMoveOpen((open) => {
      const next = !open
      if (next) {
        clearAutoCloseTimer()
      } else {
        scheduleAutoClose()
      }
      return next
    })
  }

  async function handleOpenUrl() {
    await openInAppBrowser(b.url, b.title)
    handleClose()
  }

  async function handleCopyUrl() {
    await Clipboard.setStringAsync(b.url)
    showThemedAlert('Copied', 'URL copied to clipboard')
    handleClose()
  }

  async function handleToggleRead() {
    try {
      await toggleRead({ bookmarkId: b._id })
      handleClose()
    } catch {
      showThemedAlert('Error', 'Failed to update bookmark')
    }
  }

  async function handleMove(groupId: Id<'groups'>) {
    try {
      await moveBookmark({ bookmarkId: b._id, groupId })
      handleClose()
    } catch {
      showThemedAlert('Error', 'Failed to move bookmark')
    }
  }

  async function handleDelete() {
    showThemedAlert(
      'Delete bookmark',
      'Are you sure you want to delete this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBookmark({ bookmarkId: b._id })
              handleClose()
            } catch {
              showThemedAlert('Error', 'Failed to delete bookmark')
            }
          },
        },
      ]
    )
  }

  const maxMenuHeightCap = Math.floor(screenHeight * 0.55)
  const preferredTop = anchor.y + anchor.height + 4
  const menuTop = Math.max(
    insets.top + MENU_EDGE,
    Math.min(
      preferredTop,
      screenHeight - tabBarHeight - insets.bottom - maxMenuHeightCap - MENU_EDGE
    )
  )
  const maxMenuHeight = Math.max(
    120,
    Math.min(
      maxMenuHeightCap,
      screenHeight - menuTop - tabBarHeight - insets.bottom - MENU_EDGE
    )
  )
  const menuLeft = Math.max(
    MENU_EDGE,
    Math.min(anchor.x, screenWidth - MENU_WIDTH - MENU_EDGE)
  )

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: menuTop,
        left: menuLeft,
        width: MENU_WIDTH,
      }}
    >
      <View className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg">
        <ScrollView
          style={{ maxHeight: maxMenuHeight }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={!moveOpen}
        >
          <MenuGroup>
            <MenuItem
              icon="open-outline"
              label="Open link"
              onPress={() => void handleOpenUrl()}
            />

            <MenuSeparator />

            <MenuItem
              icon={
                b.doneReading ? 'ellipse-outline' : 'checkmark-circle-outline'
              }
              label={b.doneReading ? 'Mark as unread' : 'Mark as read'}
              onPress={() => void handleToggleRead()}
            />

            <MenuSeparator />

            <MenuItem
              icon="copy-outline"
              label="Copy"
              onPress={() => void handleCopyUrl()}
            />
            <MenuItem icon="create-outline" label="Edit…" onPress={onEdit} />
            {b.description ? (
              <MenuItem
                icon="information-circle-outline"
                label="Description"
                onPress={onShowDescription}
              />
            ) : null}

            {moveTargets.length > 0 ? (
              <>
                <MenuSubTrigger
                  icon="chevron-forward-outline"
                  label="Move to"
                  expanded={moveOpen}
                  onPress={toggleMoveOpen}
                />
                {moveOpen ? (
                  <View className="ml-3 border-l border-border pl-1">
                    {moveTargets.map((group, i) => (
                      <MenuSubItem
                        key={group._id}
                        label={group.title}
                        dotColor={
                          group.color ??
                          FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                        }
                        onPress={() => void handleMove(group._id)}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}

            <MenuSeparator />

            <MenuItem
              icon="trash-outline"
              label="Delete"
              onPress={() => void handleDelete()}
              destructive
            />

            <MenuSeparator />

            <MenuItem
              icon="layers-outline"
              label="Select multiple"
              onPress={() => {
                onEnterMultiSelect(b._id)
                handleClose()
              }}
            />
          </MenuGroup>
        </ScrollView>
      </View>
    </View>
  )
}

export function BookmarkContextMenu({
  bookmark,
  anchor,
  groups,
  currentGroupId,
  onClose,
  onEnterMultiSelect,
}: BookmarkContextMenuProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDescription, setShowDescription] = useState(false)

  const visible = Boolean(bookmark && anchor && !showEdit && !showDescription)
  const b = bookmark

  function handleClose() {
    onClose()
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={StyleSheet.absoluteFill} className="bg-overlay">
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          {visible && anchor && b ? (
            <BookmarkContextMenuContent
              key={b._id}
              bookmark={b}
              anchor={anchor}
              groups={groups}
              currentGroupId={currentGroupId}
              onClose={handleClose}
              onEnterMultiSelect={onEnterMultiSelect}
              onEdit={() => setShowEdit(true)}
              onShowDescription={() => setShowDescription(true)}
            />
          ) : null}
        </View>
      </Modal>

      {b ? (
        <>
          <DetailSheet
            visible={showDescription}
            onClose={() => setShowDescription(false)}
            title="Description"
            subtitle={b.title || 'Untitled'}
          >
            {b.description ?? ''}
          </DetailSheet>

          <EditBookmarkModal
            visible={showEdit}
            onClose={() => setShowEdit(false)}
            onSaved={() => {
              setShowEdit(false)
              handleClose()
            }}
            bookmark={b}
          />
        </>
      ) : null}
    </>
  )
}
