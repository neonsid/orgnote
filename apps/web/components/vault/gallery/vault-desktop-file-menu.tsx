"use client";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { toast } from "@/lib/toast";
import { downloadFile } from "@/lib/download-file";
import type { VaultFile } from "@/components/dashboard/bookmark-list/types";
import {
  Download,
  ExternalLink,
  Plus,
  Trash2,
  ChevronsRight,
} from "lucide-react";
import {
  buildOtherVaultGroups,
  isImage,
  type VaultGroupPickRow,
} from "./gallery-utils";
import type { Id } from "@/convex/_generated/dataModel";

type VaultDesktopFileMenuProps = {
  file: VaultFile;
  vaultGroups: VaultGroupPickRow[];
  failedThumbnails: Set<string>;
  id: string;
  downloadingId: string | null;
  setDownloadingId: (id: string | null) => void;
  openLightbox: (src: string, alt: string) => void;
  onMoveFileAction: (
    file: VaultFile,
    targetGroupId: Id<"vaultGroups">,
  ) => void;
  onDeleteFileAction: (file: VaultFile) => void;
};

export function VaultDesktopFileMenu({
  file,
  vaultGroups,
  failedThumbnails,
  id,
  downloadingId,
  setDownloadingId,
  openLightbox,
  onMoveFileAction,
  onDeleteFileAction,
}: VaultDesktopFileMenuProps) {
  const otherVaultGroups = buildOtherVaultGroups(vaultGroups, file.groupId);
  const showImageView = isImage(file.type) && !failedThumbnails.has(id);

  return (
    <ContextMenuContent className="w-56">
      <ContextMenuItem
        onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}
      >
        <ExternalLink className="size-4" />
        Open in new tab
      </ContextMenuItem>

      {showImageView ? (
        <ContextMenuItem onClick={() => openLightbox(file.url, file.name)}>
          <Plus className="size-4" />
          View
        </ContextMenuItem>
      ) : null}

      <ContextMenuItem
        disabled={downloadingId === id}
        onClick={async () => {
          setDownloadingId(id);
          try {
            await downloadFile(file.url, file.name, file.type);
          } catch {
            toast.error("Download failed");
          } finally {
            setDownloadingId(null);
          }
        }}
      >
        <Download className="size-4" />
        Download
      </ContextMenuItem>

      {otherVaultGroups.length > 0 ? (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <ChevronsRight className="size-4" />
            Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="max-h-64 overflow-y-auto">
            {otherVaultGroups.map(({ group, fallbackColor }) => (
              <ContextMenuItem
                key={group._id}
                onClick={() => onMoveFileAction(file, group._id)}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: group.color || fallbackColor,
                  }}
                />
                <span className="truncate">{group.title}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      ) : null}

      <ContextMenuSeparator />

      <ContextMenuItem
        variant="destructive"
        onClick={() => onDeleteFileAction(file)}
      >
        <Trash2 className="size-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
