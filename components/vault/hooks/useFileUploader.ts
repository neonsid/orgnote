"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useFileUpload, type FileWithPreview } from "@/hooks/use-file-upload";
import { toast } from "@/lib/toast";
import { uploadFileToPresignedUrl } from "@/lib/upload-to-presigned-url";

export interface UploadFileItem {
  id: string;
  file: FileWithPreview["file"];
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  fileUrl?: string;
}

interface UseFileUploaderOptions {
  selectedGroupId: string | null;
  maxFiles?: number;
  maxSize?: number;
}

export interface UseFileUploaderReturn {
  uploadFiles: UploadFileItem[];
  isUploading: boolean;
  isDragging: boolean;
  errors: string[];
  addFiles: (files: FileWithPreview[]) => Promise<void>;
  removeFile: (id: string) => void;
  retryUpload: (id: string) => void;
  clearAll: () => void;
  openFileDialog: () => void;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

function getFileSignature(file: FileWithPreview["file"]): string {
  if (file instanceof File) {
    return `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
  }
  return `${file.name}-${file.size}-${file.type}-${file.id}`;
}

function createUploadFile(file: FileWithPreview): UploadFileItem {
  return {
    id: file.id,
    file: file.file,
    progress: 0,
    status: "uploading",
  };
}

export function useFileUploader({
  selectedGroupId,
  maxFiles = 3,
  maxSize = 5 * 1024 * 1024,
}: UseFileUploaderOptions): UseFileUploaderReturn {
  const queryClient = useQueryClient();
  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([]);
  const uploadFilesRef = useRef(uploadFiles);
  uploadFilesRef.current = uploadFiles;

  const removeFileFromHookRef = useRef<(id: string) => void>(() => {});

  const batchRef = useRef<{
    total: number;
    completed: number;
    successes: number;
  } | null>(null);

  const enqueueBatchContribution = useCallback((count: number) => {
    if (count <= 0) return;
    if (!batchRef.current) {
      batchRef.current = { total: count, completed: 0, successes: 0 };
    } else {
      batchRef.current.total += count;
    }
  }, []);

  const finalizeBatchItem = useCallback((success: boolean) => {
    const b = batchRef.current;
    if (!b) return;
    b.completed += 1;
    if (success) b.successes += 1;
    if (b.completed >= b.total) {
      const n = b.successes;
      if (n > 0) {
        toast.success(
          `${n} ${n === 1 ? "file" : "files"} uploaded successfully`,
        );
      }
      batchRef.current = null;
    }
  }, []);

  const getPresignedUploadUrl = useAction(api.vault_node.getPresignedUploadUrl);
  const saveFileMetadata = useMutation(api.vault.mutations.saveFileMetadata);

  const isUploading = uploadFiles.some((f) => f.status === "uploading");

  const onValidationError = useCallback((validationErrors: string[]) => {
    if (validationErrors.length === 0) return;
    if (validationErrors.length === 1) {
      toast.error(validationErrors[0]);
    } else {
      toast.error("Some files could not be added", {
        description: validationErrors.join("\n"),
      });
    }
  }, []);

  const processFile = useCallback(
    async (fileItem: UploadFileItem, options?: { isRetry?: boolean }) => {
      const isRetry = options?.isRetry ?? false;
      try {
        const file = fileItem.file as File;

        const { uploadUrl, fileUrl } = await getPresignedUploadUrl({
          fileName: file.name,
          fileType: file.type,
        });

        await uploadFileToPresignedUrl(file, uploadUrl, (progress) => {
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f)),
          );
        });

        await saveFileMetadata({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: fileUrl,
          groupId: selectedGroupId
            ? (selectedGroupId as Id<"vaultGroups">)
            : undefined,
        });

        queryClient.invalidateQueries({ queryKey: [api.vault.queries.getFiles] });

        if (isRetry) {
          toast.success("File uploaded successfully");
        } else {
          finalizeBatchItem(true);
        }

        removeFileFromHookRef.current(fileItem.id);
        setUploadFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
      } catch (error) {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        );
        if (!isRetry) {
          finalizeBatchItem(false);
        }
        toast.error("Failed to upload file");
      }
    },
    [
      getPresignedUploadUrl,
      saveFileMetadata,
      selectedGroupId,
      queryClient,
      finalizeBatchItem,
    ],
  );

  const [
    { isDragging, errors },
    {
      removeFile: removeFileFromHook,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept: "*",
    multiple: true,
    onError: onValidationError,
    onFilesAdded: (addedFiles) => {
      const existingSignatures = new Set(
        uploadFilesRef.current.map((fileItem) =>
          getFileSignature(fileItem.file),
        ),
      );
      const existingIds = new Set(
        uploadFilesRef.current.map((fileItem) => fileItem.id),
      );
      const uniqueFiles: FileWithPreview[] = [];

      for (const file of addedFiles) {
        const signature = getFileSignature(file.file);
        if (existingSignatures.has(signature) || existingIds.has(file.id)) {
          continue;
        }

        existingSignatures.add(signature);
        existingIds.add(file.id);
        uniqueFiles.push(file);
      }

      if (uniqueFiles.length === 0) return;

      enqueueBatchContribution(uniqueFiles.length);

      const newUploadFiles = uniqueFiles.map(createUploadFile);

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);

      newUploadFiles.forEach((file) => {
        processFile(file);
      });
    },
  });

  removeFileFromHookRef.current = removeFileFromHook;

  const addFiles = useCallback(
    async (files: FileWithPreview[]) => {
      const existingSignatures = new Set(
        uploadFilesRef.current.map((fileItem) =>
          getFileSignature(fileItem.file),
        ),
      );
      const existingIds = new Set(
        uploadFilesRef.current.map((fileItem) => fileItem.id),
      );
      const uniqueFiles: FileWithPreview[] = [];

      for (const file of files) {
        const signature = getFileSignature(file.file);
        if (existingSignatures.has(signature) || existingIds.has(file.id)) {
          continue;
        }

        existingSignatures.add(signature);
        existingIds.add(file.id);
        uniqueFiles.push(file);
      }

      if (uniqueFiles.length === 0) return;

      enqueueBatchContribution(uniqueFiles.length);

      const newUploadFiles = uniqueFiles.map(createUploadFile);

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);

      newUploadFiles.forEach((file) => {
        processFile(file);
      });
    },
    [processFile, enqueueBatchContribution],
  );

  const removeFile = useCallback(
    (fileId: string) => {
      setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
      removeFileFromHook(fileId);
    },
    [removeFileFromHook],
  );

  const retryUpload = useCallback(
    (fileId: string) => {
      setUploadFiles((prev) => {
        const next = prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress: 0,
                status: "uploading" as const,
                error: undefined,
              }
            : f,
        );
        const updated = next.find((f) => f.id === fileId);
        if (updated) {
          queueMicrotask(() => {
            processFile(
              { ...updated, progress: 0, status: "uploading" },
              { isRetry: true },
            );
          });
        }
        return next;
      });
    },
    [processFile],
  );

  const clearAll = useCallback(() => {
    clearFiles();
    setUploadFiles([]);
  }, [clearFiles]);

  return {
    uploadFiles,
    isUploading,
    isDragging,
    errors,
    addFiles,
    removeFile,
    retryUpload,
    clearAll,
    openFileDialog,
    getInputProps,
    dragHandlers: {
      onDragEnter: handleDragEnter as (e: React.DragEvent<Element>) => void,
      onDragLeave: handleDragLeave as (e: React.DragEvent<Element>) => void,
      onDragOver: handleDragOver as (e: React.DragEvent<Element>) => void,
      onDrop: handleDrop as (e: React.DragEvent<Element>) => void,
    },
  };
}
