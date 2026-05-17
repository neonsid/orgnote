/** Palette used when a group has no saved color — keep in sync with create-group presets. */
export const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
] as const;

/** Max size of a single vault upload (bytes). */
export const VAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Max files per picker / drop batch for vault uploads. */
export const VAULT_MAX_FILES_PER_BATCH = 10;
