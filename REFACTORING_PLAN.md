# Refactoring Plan: vault-upload.tsx & vault_node.ts

## Goals

- Improve readability and maintainability
- Separate concerns (UI, state, business logic)
- Add proper error handling
- Fix security issues
- Make code more testable

---

## vault-upload.tsx Refactoring

### Current Problems

| Issue                                      | Impact                             |
| ------------------------------------------ | ---------------------------------- |
| Single component handles everything        | Hard to test, reason about         |
| `handleUpload` is ~100 lines               | Difficult to understand and modify |
| Duplicate condition checks (lines 348-367) | Repetitive, error-prone            |
| Silent thumbnail failures                  | Poor UX, hard to debug             |
| Mixed responsibilities                     | UI + state + upload logic          |

### Proposed Structure

```
components/vault/
├── VaultUpload.tsx           # Main component (thin, presentational)
├── hooks/
│   └── useFileUploader.ts    # Upload state & logic (new)
├── components/
│   └── UploadProgress.tsx   # Progress display (new, extracted)
```

### Step 1: Extract `useFileUploader` Hook

Create `hooks/useFileUploader.ts` with:

```typescript
interface UseFileUploaderOptions {
  selectedGroupId: string | null;
  maxFiles?: number;
  maxSize?: number;
}

interface UseFileUploaderReturn {
  // State
  uploadFiles: FileUploadItem[];
  isUploading: boolean;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  retryUpload: (id: string) => void;
  clearAll: () => void;

  // File selection
  openFileDialog: () => void;
  getInputProps: () => InputHTMLAttributes<HTMLInputElement>;
  dragHandlers: {
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
}
```

**Internal functions to extract:**

| Function                      | Responsibility                 |
| ----------------------------- | ------------------------------ |
| `getFileSignature()`          | Generate unique file ID        |
| `uploadToR2(file, uploadUrl)` | Direct R2 upload with progress |
| `extractThumbnail(file)`      | PDF cover extraction           |
| `uploadThumbnail(blob)`       | Thumbnail R2 upload            |
| `saveMetadata(file)`          | Save to Convex database        |
| `processFile(file)`           | Orchestrates full upload flow  |

### Step 2: Refactor VaultUpload Component

```typescript
export function VaultUpload(props: VaultUploadProps) {
  const { uploadFiles, isUploading, ...uploader } = useFileUploader({
    selectedGroupId: props.selectedGroupId,
  })

  // Render helpers
  const showDragZone = !isUploading && props.files.length === 0
  const showGallery = uploadFiles.length > 0 || props.files.length > 0 || props.isLoading

  if (!props.selectedGroupId) {
    return <EmptyState isLoading={props.isLoading} groups={props.groups} />
  }

  return (
    <div className="space-y-4">
      <Header
        onAddFiles={uploader.openFileDialog}
        onClear={uploader.clearAll}
        hasUploads={uploadFiles.length > 0}
      />

      <input {...uploader.getInputProps()} className="sr-only" />

      <UploadZone
        show={showDragZone}
        handlers={uploader.dragHandlers}
      />

      {showGallery && (
        <VaultFileGallery
          files={props.files}
          uploadFiles={transformToGalleryItems(uploadFiles)}
          onDeleteFile={props.onDeleteFile}
          onRemoveUpload={uploader.removeFile}
          onRetryUpload={uploader.retryUpload}
          isLoading={props.isLoading}
        />
      )}
    </div>
  )
}
```

### Step 3: Add Error Handling

Current: Thumbnail failure is silently ignored

```typescript
// Before (line 138-140)
catch {
  // ignore - thumbnail optional; show icon fallback
}
```

After:

```typescript
// In useFileUploader.ts
async function extractAndUploadThumbnail(
  file: File,
): Promise<string | undefined> {
  try {
    const coverBlob = await extractPdfCover(file);
    const { uploadUrl, thumbnailUrl } = await getPresignedThumbnailUploadUrl(
      {},
    );

    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: coverBlob,
      headers: { "Content-Type": "image/png" },
    });

    if (!response.ok) {
      console.warn("Thumbnail upload failed:", response.status);
      return undefined;
    }

    return thumbnailUrl;
  } catch (error) {
    console.warn("Thumbnail generation failed:", error);
    return undefined;
  }
}
```

---

## vault_node.ts Refactoring

### Current Problems

| Issue                               | Severity | Impact                         |
| ----------------------------------- | -------- | ------------------------------ |
| Debug console.log in production     | Medium   | Logs sensitive config presence |
| No input validation                 | Medium   | Potential abuse                |
| deleteFromR2 has no ownership check | High     | Security vulnerability         |

### Refactoring Steps

### Step 1: Remove Debug Logging

```typescript
// Before (lines 41-46)
console.log("R2 config:", {
  accountId: R2_ACCOUNT_ID ? "set" : "missing",
  // ...
});

// After: Use proper logging or remove entirely
// Consider using a logger that can be toggled based on environment
```

### Step 2: Add Input Validation

```typescript
// Add validation schema
const fileNameSchema = v.string();
const fileTypeSchema = v.string();

// Or add validation in handler
function validateFileInput(fileName: string, fileType: string): void {
  if (fileName.length > 255) {
    throw new Error("Filename too long");
  }

  const allowedTypes = [
    "image/",
    "video/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.",
  ];

  const isAllowed = allowedTypes.some((type) => fileType.startsWith(type));
  if (!isAllowed) {
    throw new Error("File type not allowed");
  }
}
```

### Step 3: Fix deleteFromR2 Security

Current issue: Any authenticated user can delete any file if they know the key.

```typescript
// Before (line 84-106)
export const deleteFromR2 = internalAction({
  args: { fileKey: v.string() },
  handler: async (ctx, args) => {
    // No ownership check!
    await s3Client.send(new DeleteObjectCommand({ ... }))
  }
})

// After: Add ownership validation
export const deleteFromR2 = internalAction({
  args: {
    fileKey: v.string(),
    thumbnailFileKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Extract owner from fileKey format: {ownerId}/{uuid}-{filename}
    const [ownerId] = args.fileKey.split('/')

    if (ownerId !== userId) {
      throw new Error('Unauthorized: cannot delete files you do not own')
    }

    await s3Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: args.fileKey,
    }))

    if (args.thumbnailFileKey) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: args.thumbnailFileKey,
      }))
    }
  }
})
```

### Step 4: Add Rate Limiting (Optional)

Consider adding rate limiting to prevent abuse:

```typescript
import { rateLimit } from "./lib/rateLimit";

export const getPresignedUploadUrl = action({
  // ...
  handler: async (ctx, args) => {
    await rateLimit(ctx, "uploads", { limit: 10, window: 60000 });
    // ... rest of handler
  },
});
```

---

## File Structure After Refactoring

```
convex/
├── vault_node.ts              # Simplified, secure
├── lib/
│   ├── auth.ts                # Already exists
│   └── rateLimit.ts           # Optional addition

components/vault/
├── VaultUpload.tsx            # Thin presentational component
├── VaultFileGallery.tsx       # Already exists
├── hooks/
│   └── useFileUploader.ts     # NEW: Upload logic & state
├── components/
│   └── UploadZone.tsx         # NEW: Drag & drop zone (optional extract)
```

---

## Testing Strategy

1. **useFileUploader hook**
   - Test file filtering (duplicates)
   - Test progress calculation
   - Test error handling paths
   - Mock Convex actions

2. **vault_node.ts**
   - Test ownership validation in deleteFromR2
   - Test input validation
   - Mock S3 client

---

## Migration Steps

1. Create `hooks/useFileUploader.ts`
2. Move logic from VaultUpload to hook
3. Simplify VaultUpload to use hook
4. Fix vault_node.ts security issues
5. Remove debug logging
6. Add tests
7. Remove unused code

---

## Estimated Changes

| File               | Current Lines | Target Lines | Reduction |
| ------------------ | ------------- | ------------ | --------- |
| vault-upload.tsx   | 403           | ~150         | ~63%      |
| vault_node.ts      | 106           | ~90          | ~15%      |
| useFileUploader.ts | 0             | ~200         | New       |
