import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Loading, EmptyState } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { spacing, borderRadius } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";
import { getHostname } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

function makePublicUserProfileStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },

    profileHeader: {
      alignItems: "center",
      padding: spacing.xl,
      backgroundColor: colors.surface,
      marginBottom: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: "700",
      color: "#fff",
    },
    username: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    bio: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.sm,
      lineHeight: 22,
    },
    links: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.borderLight,
      borderRadius: borderRadius.full,
    },
    linkText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.primary,
    },

    groupSection: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    groupChipsContainer: {
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: "#fff",
    },

    listContent: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    bookmarkCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    bookmarkCardPressed: {
      backgroundColor: colors.background,
      transform: [{ scale: 0.98 }],
    },
    bookmarkHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    bookmarkTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 22,
    },
    groupBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    groupBadgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    bookmarkUrl: {
      fontSize: 13,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    bookmarkDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 18,
    },
    emptyList: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
    },
  });
}

type PublicUserProfileStyles = ReturnType<typeof makePublicUserProfileStyles>;

function ProfileHeader({
  profile,
  styles,
  colors,
}: {
  profile: {
    username?: string;
    bio?: string;
    links?: Array<{ label: string; url: string }>;
  };
  styles: PublicUserProfileStyles;
  colors: AppColors;
}) {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {profile.username?.[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>
      <Text style={styles.username}>@{profile.username}</Text>
      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {profile.links && profile.links.length > 0 && (
        <View style={styles.links}>
          {profile.links.map((link, i) => (
            <Pressable
              key={i}
              style={styles.linkButton}
              onPress={() => Linking.openURL(link.url)}
            >
              <Ionicons
                name={
                  link.label === "GitHub"
                    ? "logo-github"
                    : link.label === "Twitter"
                      ? "logo-twitter"
                      : "globe-outline"
                }
                size={18}
                color={colors.primary}
              />
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function GroupChips({
  groups,
  selectedGroupId,
  onSelectGroup,
  styles,
}: {
  groups: Array<{ _id: string; title: string; color: string }>;
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  styles: PublicUserProfileStyles;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.groupChipsContainer}
    >
      <Pressable
        style={[styles.chip, !selectedGroupId && styles.chipActive]}
        onPress={() => onSelectGroup(null)}
      >
        <Text style={[styles.chipText, !selectedGroupId && styles.chipTextActive]}>
          All
        </Text>
      </Pressable>
      {groups.map((group) => (
        <Pressable
          key={group._id}
          style={[styles.chip, selectedGroupId === group._id && styles.chipActive]}
          onPress={() => onSelectGroup(group._id)}
        >
          <Text
            style={[
              styles.chipText,
              selectedGroupId === group._id && styles.chipTextActive,
            ]}
            numberOfLines={1}
          >
            {group.title}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function BookmarkItem({
  bookmark,
  styles,
}: {
  bookmark: {
    _id: string;
    title: string;
    url: string;
    description?: string;
    groupTitle: string;
    groupColor: string;
  };
  styles: PublicUserProfileStyles;
}) {
  const hostname = getHostname(bookmark.url);

  return (
    <Pressable
      style={({ pressed }) => [styles.bookmarkCard, pressed && styles.bookmarkCardPressed]}
      onPress={() => Linking.openURL(bookmark.url)}
    >
      <View style={styles.bookmarkHeader}>
        <Text style={styles.bookmarkTitle} numberOfLines={2}>
          {bookmark.title || "Untitled"}
        </Text>
        <View style={[styles.groupBadge, { backgroundColor: bookmark.groupColor + "20" }]}>
          <Text style={[styles.groupBadgeText, { color: bookmark.groupColor }]}>
            {bookmark.groupTitle}
          </Text>
        </View>
      </View>
      <Text style={styles.bookmarkUrl} numberOfLines={1}>
        {hostname}
      </Text>
      {bookmark.description && (
        <Text style={styles.bookmarkDescription} numberOfLines={2}>
          {bookmark.description}
        </Text>
      )}
    </Pressable>
  );
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makePublicUserProfileStyles(colors), [colors]);

  const profileData = useQuery(
    api.profile.queries.getPublicProfileData,
    username ? { username } : "skip"
  );

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const filteredBookmarks = useMemo(() => {
    if (!profileData) return [];
    if (!selectedGroupId) return profileData.bookmarks;
    return profileData.bookmarks.filter((b) => b.groupId === selectedGroupId);
  }, [profileData, selectedGroupId]);

  if (profileData === undefined) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Loading message="Loading profile..." />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          icon="person-outline"
          title="Profile not found"
          description="This user doesn't exist or their profile is private."
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>@{profileData.profile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={filteredBookmarks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ProfileHeader
              profile={profileData.profile}
              styles={styles}
              colors={colors}
            />
            {profileData.groups.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.sectionLabel}>Collections</Text>
                <GroupChips
                  groups={profileData.groups}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                  styles={styles}
                />
              </View>
            )}
            <Text style={styles.sectionLabel}>
              {filteredBookmarks.length} Bookmarks
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>No public bookmarks</Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookmarkItem bookmark={item} styles={styles} />
        )}
      />
    </View>
  );
}
