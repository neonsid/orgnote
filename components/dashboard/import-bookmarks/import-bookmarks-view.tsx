'use client'

import { memo } from 'react'
import { FileUp } from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DuplicateUrlsReview } from './duplicate-urls-review'
import { BookmarkImportStagingPanel } from './staging-panel'
import { ImportHeader } from './import-header'
import { ImportActionBar } from './import-action-bar'
import { UploadDropZone } from './upload-drop-zone'
import { useImportBookmarks } from './use-import-bookmarks'

export const ImportBookmarksView = memo(function ImportBookmarksView() {
  const {
    fileInputRef,
    duplicateReviewRef,
    pendingSectionRef,
    groups,
    parsedItems,
    chromeFolderKeys,
    loadedFileLabel,
    effectiveChromeFolderKey,
    availableInFolder,
    selectedIds,
    effectiveTargetGroupId,
    targetGroupTitle,
    selectedInFolderCount,
    groupsWithPending,
    pendingByGroup,
    pendingGroupExpanded,
    totalPendingCount,
    duplicatePartitions,
    duplicateReviewVisible,
    isImporting,
    newOnlyImportCount,
    importButtonLabel,
    hasFile,
    importUrlKeys,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleChromeFolderChange,
    handleToggleRow,
    handleSelectAll,
    handleSelectNone,
    handleTargetGroupChange,
    handlePendingGroupExpandedChange,
    handleRemoveFromPending,
    handleAddToGroup,
    handleImportClick,
    handleImportAllDuplicates,
    handleImportNewOnlyDuplicates,
    handleDuplicateReviewCancel,
  } = useImportBookmarks()

  const importDisabled =
    isImporting ||
    totalPendingCount === 0 ||
    !parsedItems?.length ||
    (totalPendingCount > 0 && importUrlKeys === undefined) ||
    duplicateReviewVisible

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <ImportHeader />

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col"
      >
        <input
          id="bookmark-file-input"
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,text/html,application/xhtml+xml"
          className="sr-only"
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {!hasFile ? (
            <m.div
              key="empty-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10"
            >
              <UploadDropZone
                onClickBrowse={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            </m.div>
          ) : (
            <m.div
              key="staging"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col"
            >
              <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 shrink-0">
                <FileUp className="size-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground truncate" title={loadedFileLabel}>
                  <span className="font-medium text-foreground">{loadedFileLabel}</span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 px-2 text-xs shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change file
                </Button>
              </div>

              <BookmarkImportStagingPanel
                folderKeys={chromeFolderKeys}
                effectiveChromeFolderKey={effectiveChromeFolderKey}
                onChromeFolderChange={handleChromeFolderChange}
                availableInFolder={availableInFolder}
                selectedIds={selectedIds}
                onToggleRow={handleToggleRow}
                onSelectAll={handleSelectAll}
                onSelectNone={handleSelectNone}
                groups={groups}
                effectiveTargetGroupId={effectiveTargetGroupId}
                onTargetGroupChange={handleTargetGroupChange}
                targetGroupTitle={targetGroupTitle}
                onAddToGroup={handleAddToGroup}
                selectedInFolderCount={selectedInFolderCount}
                groupsWithPending={groupsWithPending}
                pendingByGroup={pendingByGroup}
                pendingGroupExpanded={pendingGroupExpanded}
                onPendingGroupExpandedChange={handlePendingGroupExpandedChange}
                onRemoveFromPending={handleRemoveFromPending}
                totalPendingCount={totalPendingCount}
                pendingSectionRef={pendingSectionRef}
              />

              <AnimatePresence>
                {duplicateReviewVisible && (
                  <m.div
                    ref={duplicateReviewRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden px-4 sm:px-6 shrink-0"
                  >
                    <div className="pb-4">
                      <DuplicateUrlsReview
                        duplicatePartitions={duplicatePartitions}
                        groups={groups}
                        isImporting={isImporting}
                        totalPendingCount={totalPendingCount}
                        newOnlyImportCount={newOnlyImportCount}
                        onImportAllDuplicates={handleImportAllDuplicates}
                        onImportNewOnlyDuplicates={handleImportNewOnlyDuplicates}
                        onCancel={handleDuplicateReviewCancel}
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <ImportActionBar
                onImportClick={handleImportClick}
                disabled={importDisabled}
                label={importButtonLabel}
              />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </div>
  )
})
