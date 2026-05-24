import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useReducer } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

function publicProfileSeed(profile: Doc<"userProfile"> | null) {
  let githubUrl = "";
  let twitterUrl = "";
  let portfolioUrl = "";
  for (const link of profile?.links ?? []) {
    const url = link.url ?? "";
    switch (link.label) {
      case "GitHub":
        if (!githubUrl) githubUrl = url;
        break;
      case "Twitter":
        if (!twitterUrl) twitterUrl = url;
        break;
      case "Portfolio":
        if (!portfolioUrl) portfolioUrl = url;
        break;
      default:
        break;
    }
  }
  return {
    isPublic: profile?.isPublic ?? false,
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    githubUrl,
    twitterUrl,
    portfolioUrl,
  };
}

type LinkLabel = "GitHub" | "Twitter" | "Portfolio";

type PublicProfileFormState = {
  isPublic: boolean;
  username: string;
  bio: string;
  githubUrl: string;
  twitterUrl: string;
  portfolioUrl: string;
  loading: boolean;
};

type PublicProfileFormAction =
  | { type: "setIsPublic"; value: boolean }
  | { type: "setUsername"; value: string }
  | { type: "setBio"; value: string }
  | { type: "setGithubUrl"; value: string }
  | { type: "setTwitterUrl"; value: string }
  | { type: "setPortfolioUrl"; value: string }
  | { type: "setLoading"; loading: boolean };

function publicProfileSeedToFormState(
  profile: Doc<"userProfile"> | null,
): Omit<PublicProfileFormState, "loading"> {
  const s = publicProfileSeed(profile);
  return {
    isPublic: s.isPublic,
    username: s.username,
    bio: s.bio,
    githubUrl: s.githubUrl,
    twitterUrl: s.twitterUrl,
    portfolioUrl: s.portfolioUrl,
  };
}

function publicProfileFormReducer(
  state: PublicProfileFormState,
  action: PublicProfileFormAction,
): PublicProfileFormState {
  switch (action.type) {
    case "setIsPublic":
      return { ...state, isPublic: action.value };
    case "setUsername":
      return { ...state, username: action.value };
    case "setBio":
      return { ...state, bio: action.value };
    case "setGithubUrl":
      return { ...state, githubUrl: action.value };
    case "setTwitterUrl":
      return { ...state, twitterUrl: action.value };
    case "setPortfolioUrl":
      return { ...state, portfolioUrl: action.value };
    case "setLoading":
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

function PublicProfileModalSkeleton({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Public Profile</Text>
        <View className="w-7" />
      </View>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
}

function PublicProfileForm({
  profile,
  onClose,
}: {
  profile: Doc<"userProfile"> | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const upsertProfile = useMutation(api.profile.mutations.upsertProfile);

  const [state, dispatch] = useReducer(
    publicProfileFormReducer,
    profile,
    (p): PublicProfileFormState => ({
      ...publicProfileSeedToFormState(p ?? null),
      loading: false,
    }),
  );

  const {
    isPublic,
    username,
    bio,
    githubUrl,
    twitterUrl,
    portfolioUrl,
    loading,
  } = state;

  async function handleSave() {
    dispatch({ type: "setLoading", loading: true });
    try {
      const links: { label: LinkLabel; url: string }[] = [];
      if (githubUrl.trim()) {
        links.push({ label: "GitHub", url: githubUrl.trim() });
      }
      if (twitterUrl.trim()) {
        links.push({ label: "Twitter", url: twitterUrl.trim() });
      }
      if (portfolioUrl.trim()) {
        links.push({ label: "Portfolio", url: portfolioUrl.trim() });
      }

      await upsertProfile({
        isPublic,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        links: links.length > 0 ? links : undefined,
      });
      showThemedAlert("Success", "Profile updated");
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      dispatch({ type: "setLoading", loading: false });
    }
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
        <Text className="text-base font-semibold text-foreground">Public Profile</Text>
        <Pressable onPress={handleSave} disabled={loading} hitSlop={8}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-sm font-semibold text-foreground">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-4 flex-row items-center justify-between rounded-sm border border-border bg-surface p-3">
          <View className="mr-3 flex-1">
            <Text className="text-sm font-semibold text-foreground">Enable Public Profile</Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Allow others to see your public collections
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={(v) => dispatch({ type: "setIsPublic", value: v })}
            trackColor={{ false: colors.border, true: colors.text }}
            thumbColor="#fff"
          />
        </View>

        <Input
          label="Username"
          value={username}
          onChangeText={(t) => dispatch({ type: "setUsername", value: t })}
          placeholder="your-username"
          autoCapitalize="none"
          containerClassName="mb-3"
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={(t) => dispatch({ type: "setBio", value: t })}
          placeholder="Tell others about yourself..."
          multiline
          numberOfLines={3}
          className="h-20"
          style={{ textAlignVertical: "top" }}
          containerClassName="mb-3"
        />

        <Input
          label="GitHub URL"
          value={githubUrl}
          onChangeText={(t) => dispatch({ type: "setGithubUrl", value: t })}
          placeholder="https://github.com/username"
          autoCapitalize="none"
          keyboardType="url"
          containerClassName="mb-3"
        />

        <Input
          label="Twitter/X URL"
          value={twitterUrl}
          onChangeText={(t) => dispatch({ type: "setTwitterUrl", value: t })}
          placeholder="https://twitter.com/username"
          autoCapitalize="none"
          keyboardType="url"
          containerClassName="mb-3"
        />

        <Input
          label="Portfolio/Website"
          value={portfolioUrl}
          onChangeText={(t) => dispatch({ type: "setPortfolioUrl", value: t })}
          placeholder="https://your-website.com"
          autoCapitalize="none"
          keyboardType="url"
          containerClassName="mb-3"
        />
      </ScrollView>
    </View>
  );
}

interface PublicProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PublicProfileModal({ visible, onClose }: PublicProfileModalProps) {
  const profile = useQuery(api.profile.queries.getProfile);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {profile === undefined ? (
        <PublicProfileModalSkeleton onClose={onClose} />
      ) : (
        <PublicProfileForm
          key={profile?._id ?? "new-profile"}
          profile={profile}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
