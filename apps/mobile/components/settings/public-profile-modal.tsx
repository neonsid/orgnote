import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useReducer } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { spacing, borderRadius } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

function makePublicProfileModalStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.surface,
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
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    saveButton: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    toggleLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    toggleDescription: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    inputContainer: {
      marginBottom: spacing.md,
    },
    textArea: {
      height: 80,
      textAlignVertical: "top",
    },
  });
}

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
  const styles = useMemo(() => makePublicProfileModalStyles(colors), [colors]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Public Profile</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
  const styles = useMemo(() => makePublicProfileModalStyles(colors), [colors]);
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Public Profile</Text>
        <Pressable onPress={handleSave} disabled={loading} hitSlop={8}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Enable Public Profile</Text>
            <Text style={styles.toggleDescription}>
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
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={(t) => dispatch({ type: "setBio", value: t })}
          placeholder="Tell others about yourself..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
          containerStyle={styles.inputContainer}
        />

        <Input
          label="GitHub URL"
          value={githubUrl}
          onChangeText={(t) => dispatch({ type: "setGithubUrl", value: t })}
          placeholder="https://github.com/username"
          autoCapitalize="none"
          keyboardType="url"
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Twitter/X URL"
          value={twitterUrl}
          onChangeText={(t) => dispatch({ type: "setTwitterUrl", value: t })}
          placeholder="https://twitter.com/username"
          autoCapitalize="none"
          keyboardType="url"
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Portfolio/Website"
          value={portfolioUrl}
          onChangeText={(t) => dispatch({ type: "setPortfolioUrl", value: t })}
          placeholder="https://your-website.com"
          autoCapitalize="none"
          keyboardType="url"
          containerStyle={styles.inputContainer}
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
