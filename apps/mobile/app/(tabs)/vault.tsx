import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FileTile } from "@/components/vault";
import {
  Modal,
  Loading,
  EmptyState,
  Input,
  Button,
  OrgNoteLogo,
} from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { useVaultUpload } from "@/hooks/use-vault-upload";
import { GROUP_COLORS } from "@/lib/group-colors";
import { promptOpenExternalUrl } from "@/lib/open-external-url";
import { downloadAndShareFile } from "@/lib/download-file-native";
import { spacing, borderRadius } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function makeVaultStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
    },
    logoContainer: {
      marginRight: spacing.sm,
    },
    logoBox: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    divider: {
      fontSize: 18,
      color: colors.textMuted,
      marginRight: spacing.sm,
    },
    groupSelector: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      flex: 1,
      gap: spacing.sm,
    },
    groupSelectorPressed: {
      backgroundColor: colors.muted,
    },
    groupDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    groupText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    stats: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    statsText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    listContent: {
      padding: spacing.md,
    },
    row: {
      justifyContent: "space-between",
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    modalList: {
      maxHeight: 300,
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
    },
    modalItemActive: {
      backgroundColor: colors.muted,
    },
    modalItemContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    modalItemText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    modalItemTextActive: {
      fontWeight: "600",
    },
    createContent: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    actionsContent: {
      padding: spacing.lg,
    },
    actionsTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    actionItemTextDestructive: {
      fontSize: 14,
      color: colors.error,
    },
    cancelButton: {
      marginTop: spacing.md,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: borderRadius.sm,
    },
    cancelText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    uploadBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    uploadHint: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
    colorRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    uploadCard: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.sm,
      alignItems: "center",
    },
    uploadTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    uploadStep: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    uploadFileName: {
      fontSize: 13,
      color: colors.text,
      textAlign: "center",
      fontWeight: "500",
    },
    uploadCounter: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}

function VaultHeader({
  selectedGroup,
  onOpenGroupSelector,
}: {
  selectedGroup: { _id: Id<"vaultGroups">; title: string; color?: string } | null;
  onOpenGroupSelector: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeVaultStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <OrgNoteLogo size={28} />
        </View>
      </View>
      <Text style={styles.divider}>/</Text>
      <Pressable
        style={({ pressed }) => [
          styles.groupSelector,
          pressed && styles.groupSelectorPressed,
        ]}
        onPress={onOpenGroupSelector}
      >
        <View
          style={[
            styles.groupDot,
            {
              backgroundColor: selectedGroup?.color ?? FALLBACK_COLORS[0],
            },
          ]}
        />
        <Text style={styles.groupText} numberOfLines={1}>
          {selectedGroup?.title ?? "All Files"}
        </Text>
        <Ionicons name="chevron-expand" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function VaultGroupSelectorModal({
  visible,
  onClose,
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
}: {
  visible: boolean;
  onClose: () => void;
  groups: Array<{ _id: Id<"vaultGroups">; title: string }>;
  selectedGroupId: Id<"vaultGroups"> | null;
  onSelectGroup: (id: Id<"vaultGroups"> | null) => void;
  onCreateGroup: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeVaultStyles(colors), [colors]);

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Vault Collections</Text>
        <Pressable onPress={onCreateGroup} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView style={styles.modalList}>
        <Pressable
          style={[styles.modalItem, !selectedGroupId && styles.modalItemActive]}
          onPress={() => {
            onSelectGroup(null);
            onClose();
          }}
        >
          <View style={styles.modalItemContent}>
            <Ionicons
              name="folder-outline"
              size={16}
              color={!selectedGroupId ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.modalItemText, !selectedGroupId && styles.modalItemTextActive]}
            >
              All Files
            </Text>
          </View>
          {!selectedGroupId && <Ionicons name="checkmark" size={20} color={colors.primary} />}
        </Pressable>
        {groups.map((group) => {
          const isSelected = group._id === selectedGroupId;
          return (
            <Pressable
              key={group._id}
              style={[styles.modalItem, isSelected && styles.modalItemActive]}
              onPress={() => {
                onSelectGroup(group._id);
                onClose();
              }}
            >
              <View style={styles.modalItemContent}>
                <Ionicons
                  name="folder-outline"
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}
                  numberOfLines={1}
                >
                  {group.title}
                </Text>
              </View>
              {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </Modal>
  );
}

function CreateVaultGroupModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeVaultStyles(colors), [colors]);
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(GROUP_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const createGroup = useMutation(api.vault.mutations.createVaultGroup);

  async function handleCreate() {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await createGroup({ title: title.trim(), color: selectedColor });
      setTitle("");
      setSelectedColor(GROUP_COLORS[0].value);
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTitle("");
    setSelectedColor(GROUP_COLORS[0].value);
    onClose();
  }

  return (
    <Modal visible={visible} onClose={handleClose} title="Create collection" variant="bottom">
      <View style={styles.createContent}>
        <Input
          placeholder="Collection name..."
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>
          Color
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {GROUP_COLORS.map((c) => {
            const selected = selectedColor === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setSelectedColor(c.value)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: c.value,
                    borderColor: selected ? colors.text : "transparent",
                  },
                ]}
                accessibilityLabel={c.label}
              >
                {selected ? <Ionicons name="checkmark" size={18} color="#ffffff" /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        <Button onPress={handleCreate} disabled={!title.trim()} loading={loading}>
          Create
        </Button>
      </View>
    </Modal>
  );
}

function FileActionsModal({
  visible,
  onClose,
  file,
}: {
  visible: boolean;
  onClose: () => void;
  file: { _id: Id<"vaultFiles">; name: string; url: string; type: string } | null;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeVaultStyles(colors), [colors]);
  const deleteFile = useMutation(api.vault.mutations.deleteFile);
  const [downloading, setDownloading] = useState(false);

  if (!file) return null;

  const f = file;

  function handleOpen() {
    void promptOpenExternalUrl(f.url, f.name);
    onClose();
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAndShareFile(f.url, f.name, f.type);
      onClose();
    } catch (e) {
      showThemedAlert("Download failed", e instanceof Error ? e.message : "Could not download file.");
    } finally {
      setDownloading(false);
    }
  }

  function handleDelete() {
    showThemedAlert("Delete file", `Delete "${f.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFile({ fileId: f._id });
            onClose();
          } catch {
            showThemedAlert("Error", "Failed to delete file");
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.actionsContent}>
        <Text style={styles.actionsTitle} numberOfLines={1}>
          {f.name}
        </Text>
        <Pressable style={styles.actionItem} onPress={handleOpen}>
          <Ionicons name="open-outline" size={22} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.text }}>Open with…</Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={handleDownload} disabled={downloading}>
          <Ionicons name="download-outline" size={22} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.text }}>
            {downloading ? "Downloading…" : "Download"}
          </Text>
        </Pressable>
        <Pressable style={styles.actionItem} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text style={styles.actionItemTextDestructive}>Delete</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function VaultContent() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeVaultStyles(colors), [colors]);
  const vaultData = useQuery(api.vault.queries.getVaultData);
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"vaultGroups"> | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    _id: Id<"vaultFiles">;
    name: string;
    url: string;
    type: string;
  } | null>(null);

  const effectiveGroupId = useMemo(() => {
    if (!vaultData || vaultData.groups.length === 0) return null;
    if (selectedGroupId && vaultData.groups.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return vaultData.groups[0]?._id ?? null;
  }, [vaultData, selectedGroupId]);

  const { uploading, uploadStatus, pickAndUpload } = useVaultUpload(effectiveGroupId);

  const selectedGroup = useMemo(() => {
    if (!vaultData || !effectiveGroupId) return null;
    return vaultData.groups.find((g) => g._id === effectiveGroupId) ?? null;
  }, [vaultData, effectiveGroupId]);

  const filteredFiles = useMemo(() => {
    if (!vaultData) return [];
    if (!effectiveGroupId) return vaultData.files;
    return vaultData.files.filter((f) => f.groupId === effectiveGroupId);
  }, [vaultData, effectiveGroupId]);

  if (vaultData === undefined) {
    return <Loading message="Loading vault..." />;
  }

  return (
    <View style={styles.container}>
      <VaultHeader
        selectedGroup={selectedGroup}
        onOpenGroupSelector={() => setShowGroupSelector(true)}
      />

      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {vaultData.groups.length} collections • {filteredFiles.length} files
        </Text>
      </View>

      {vaultData.groups.length > 0 ? (
        <View style={styles.uploadBar}>
          <Button
            onPress={() => void pickAndUpload()}
            disabled={!effectiveGroupId || uploading}
            loading={uploading}
            variant="outline"
            style={{ flexShrink: 0 }}
          >
            Add files
          </Button>
          <Text style={styles.uploadHint}>
            {effectiveGroupId
              ? "Up to 3 files per batch, 5 MB each (images, PDF, zip, …)."
              : "Select a collection in the header to upload into it."}
          </Text>
        </View>
      ) : null}

      {filteredFiles.length === 0 ? (
        <EmptyState
          icon="cloud-upload-outline"
          title="No files yet"
          description={
            vaultData.groups.length === 0
              ? "Create a collection, then add files."
              : effectiveGroupId
                ? "Tap Add files to upload from this device."
                : "Choose a collection above, then use Add files."
          }
          actionLabel={effectiveGroupId ? "Add files" : undefined}
          onAction={effectiveGroupId ? () => void pickAndUpload() : undefined}
        />
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FileTile
              file={item}
              onLongPress={() =>
                setSelectedFile({
                  _id: item._id,
                  name: item.name,
                  url: item.url,
                  type: item.type,
                })
              }
            />
          )}
        />
      )}

      <VaultGroupSelectorModal
        visible={showGroupSelector}
        onClose={() => setShowGroupSelector(false)}
        groups={vaultData.groups}
        selectedGroupId={effectiveGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={() => {
          setShowGroupSelector(false);
          setShowCreateGroup(true);
        }}
      />

      <CreateVaultGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      <FileActionsModal
        visible={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        file={selectedFile}
      />

      {uploading && uploadStatus ? (
        <View style={styles.uploadOverlay} pointerEvents="auto">
          <View style={styles.uploadCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadTitle}>Uploading to vault</Text>
            <Text style={styles.uploadStep}>{uploadStatus.step}</Text>
            {uploadStatus.fileName ? (
              <Text style={styles.uploadFileName} numberOfLines={2}>
                {uploadStatus.fileName}
              </Text>
            ) : null}
            <Text style={styles.uploadCounter}>
              File {uploadStatus.current} of {uploadStatus.total}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeVaultStyles(colors), [colors]);
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  if (!clerkLoaded) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Loading message="Loading..." />
      </View>
    );
  }

  if (!isSignedIn) {
    return <View style={[styles.screen, { paddingTop: insets.top }]} />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Loading message="Connecting..." />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <VaultContent />
    </View>
  );
}
