import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Loading, EmptyState } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
import { openInAppBrowser } from "@/lib/open-in-app-browser";
import { getHostname } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

function ProfileHeader({
  profile,
}: {
  profile: {
    username?: string;
    bio?: string;
    links?: Array<{ label: string; url: string }>;
  };
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-4 items-center rounded-lg bg-surface p-6">
      <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-primary">
        <Text className="text-[32px] font-bold text-white">
          {profile.username?.[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>
      <Text className="text-[22px] font-bold text-foreground">@{profile.username}</Text>
      {profile.bio ? (
        <Text className="mt-2 text-center text-[15px] leading-[22px] text-secondary-foreground">
          {profile.bio}
        </Text>
      ) : null}

      {profile.links && profile.links.length > 0 ? (
        <View className="mt-4 flex-row flex-wrap justify-center gap-2">
          {profile.links.map((link) => (
            <Pressable
              key={link.url}
              className="flex-row items-center gap-1 rounded-full bg-muted px-3 py-2 active:bg-muted"
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
              <Text className="text-sm font-medium text-primary">{link.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function GroupChips({
  groups,
  selectedGroupId,
  onSelectGroup,
}: {
  groups: Array<{ _id: string; title: string; color: string }>;
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row items-center gap-2 pr-4"
    >
      <Pressable
        className={cn(
          "rounded-full border border-border bg-surface px-4 py-2 active:bg-muted",
          !selectedGroupId && "border-primary bg-primary"
        )}
        onPress={() => onSelectGroup(null)}
      >
        <Text
          className={cn(
            "text-sm font-medium text-secondary-foreground",
            !selectedGroupId && "text-white"
          )}
        >
          All
        </Text>
      </Pressable>
      {groups.map((group) => {
        const isActive = selectedGroupId === group._id;
        return (
          <Pressable
            key={group._id}
            className={cn(
              "rounded-full border border-border bg-surface px-4 py-2 active:bg-muted",
              isActive && "border-primary bg-primary"
            )}
            onPress={() => onSelectGroup(group._id)}
          >
            <Text
              className={cn(
                "text-sm font-medium text-secondary-foreground",
                isActive && "text-white"
              )}
              numberOfLines={1}
            >
              {group.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function BookmarkItem({
  bookmark,
}: {
  bookmark: {
    _id: string;
    title: string;
    url: string;
    description?: string;
    groupTitle: string;
    groupColor: string;
  };
}) {
  const hostname = getHostname(bookmark.url);

  return (
    <Pressable
      className="rounded-lg bg-surface p-4 active:scale-[0.98] active:bg-background"
      onPress={() => void openInAppBrowser(bookmark.url, bookmark.title)}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold leading-[22px] text-foreground" numberOfLines={2}>
          {bookmark.title || "Untitled"}
        </Text>
        <View
          className="rounded-sm px-2 py-0.5"
          style={{ backgroundColor: bookmark.groupColor + "20" }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: bookmark.groupColor }}>
            {bookmark.groupTitle}
          </Text>
        </View>
      </View>
      <Text className="mt-1 text-[13px] text-primary" numberOfLines={1}>
        {hostname}
      </Text>
      {bookmark.description ? (
        <Text className="mt-2 text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={2}>
          {bookmark.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

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
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Loading message="Loading profile..." />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Profile</Text>
          <View className="w-6" />
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">@{profileData.profile.username}</Text>
        <View className="w-6" />
      </View>

      <FlatList
        data={filteredBookmarks}
        keyExtractor={(item) => item._id}
        contentContainerClassName="gap-3 p-4"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ProfileHeader profile={profileData.profile} />
            {profileData.groups.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Collections
                </Text>
                <GroupChips
                  groups={profileData.groups}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                />
              </View>
            ) : null}
            <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {filteredBookmarks.length} Bookmarks
            </Text>
          </>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-[15px] text-muted-foreground">No public bookmarks</Text>
          </View>
        }
        renderItem={({ item }) => <BookmarkItem bookmark={item} />}
      />
    </View>
  );
}
