import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
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
  const links = profile?.links ?? [];
  const github = links.find((l) => l.label === "GitHub");
  const twitter = links.find((l) => l.label === "Twitter");
  const portfolio = links.find((l) => l.label === "Portfolio");
  return {
    isPublic: profile?.isPublic ?? false,
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    githubUrl: github?.url ?? "",
    twitterUrl: twitter?.url ?? "",
    portfolioUrl: portfolio?.url ?? "",
  };
}

type LinkLabel = "GitHub" | "Twitter" | "Portfolio";

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

  const [isPublic, setIsPublic] = useState(() => publicProfileSeed(profile).isPublic);
  const [username, setUsername] = useState(() => publicProfileSeed(profile).username);
  const [bio, setBio] = useState(() => publicProfileSeed(profile).bio);
  const [githubUrl, setGithubUrl] = useState(() => publicProfileSeed(profile).githubUrl);
  const [twitterUrl, setTwitterUrl] = useState(() => publicProfileSeed(profile).twitterUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(() => publicProfileSeed(profile).portfolioUrl);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
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
      setLoading(false);
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
            onValueChange={setIsPublic}
            trackColor={{ false: colors.border, true: colors.text }}
            thumbColor="#fff"
          />
        </View>

        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="your-username"
          autoCapitalize="none"
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others about yourself..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
          containerStyle={styles.inputContainer}
        />

        <Input
          label="GitHub URL"
          value={githubUrl}
          onChangeText={setGithubUrl}
          placeholder="https://github.com/username"
          autoCapitalize="none"
          keyboardType="url"
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Twitter/X URL"
          value={twitterUrl}
          onChangeText={setTwitterUrl}
          placeholder="https://twitter.com/username"
          autoCapitalize="none"
          keyboardType="url"
          containerStyle={styles.inputContainer}
        />

        <Input
          label="Portfolio/Website"
          value={portfolioUrl}
          onChangeText={setPortfolioUrl}
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
