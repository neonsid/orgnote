import { useAuth, useClerk } from "@clerk/expo";
import { useConvexAuth, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ProfileCard,
  SettingsSection,
  SettingsItem,
  PublicProfileModal,
} from "@/components/settings";
import { Loading } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { spacing } from "@/lib/constants";
import { api } from "../../../../convex/_generated/api";

function ThemeOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingVertical: 12,
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: pressed ? colors.muted : "transparent",
        },
      ]}
    >
      <Text style={{ fontSize: 14, color: colors.text, fontWeight: selected ? "600" : "400" }}>
        {label}
      </Text>
      {selected ? (
        <Text style={{ fontSize: 14, color: colors.primaryAccent }}>✓</Text>
      ) : null}
    </Pressable>
  );
}

function SettingsContent() {
  const { signOut } = useClerk();
  const profile = useQuery(api.profile.queries.getProfile);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { preference, setPreference, colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        header: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.surface,
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: "600",
          color: colors.text,
        },
        footer: {
          alignItems: "center",
          paddingVertical: spacing.xxxl,
        },
        footerText: {
          fontSize: 12,
          color: colors.textMuted,
        },
      }),
    [colors]
  );

  function handleSignOut() {
    showThemedAlert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ProfileCard />

      <SettingsSection title="Appearance">
        <ThemeOption
          label="System"
          selected={preference === "system"}
          onPress={() => setPreference("system")}
        />
        <ThemeOption
          label="Light"
          selected={preference === "light"}
          onPress={() => setPreference("light")}
        />
        <ThemeOption
          label="Dark"
          selected={preference === "dark"}
          onPress={() => setPreference("dark")}
        />
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsItem
          icon="person-outline"
          label="Public Profile"
          value={profile?.isPublic ? "On" : "Off"}
          onPress={() => setShowProfileModal(true)}
        />
        <SettingsItem
          icon="globe-outline"
          label="View Public Profile"
          onPress={() => {
            if (profile?.username && profile?.isPublic) {
              Linking.openURL(`https://orgnote.store/u/${profile.username}`);
            } else {
              showThemedAlert("Profile not public", "Enable your public profile first.");
            }
          }}
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsItem
          icon="download-outline"
          label="Export Bookmarks"
          onPress={() =>
            showThemedAlert("Coming soon", "Export functionality will be available soon.")
          }
        />
        <SettingsItem
          icon="cloud-upload-outline"
          label="Import Bookmarks"
          onPress={() =>
            showThemedAlert("Coming soon", "Use the web app to import bookmarks.")
          }
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsItem
          icon="information-circle-outline"
          label="Version"
          value="1.0.0"
          showChevron={false}
        />
        <SettingsItem
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => Linking.openURL("https://orgnote.store/terms")}
        />
        <SettingsItem
          icon="shield-outline"
          label="Privacy Policy"
          onPress={() => Linking.openURL("https://orgnote.store/privacy")}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsItem
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
          showChevron={false}
          destructive
        />
      </SettingsSection>

      <View style={styles.footer}>
        <Text style={styles.footerText}>OrgNote</Text>
      </View>

      <PublicProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </ScrollView>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const { colors } = useAppTheme();

  const screenStyle = useMemo(
    () => ({
      flex: 1,
      backgroundColor: colors.background,
    }),
    [colors.background]
  );

  if (!clerkLoaded) {
    return (
      <View style={[screenStyle, { paddingTop: insets.top }]}>
        <Loading message="Loading..." />
      </View>
    );
  }

  if (!isSignedIn) {
    return <View style={[screenStyle, { paddingTop: insets.top }]} />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <View style={[screenStyle, { paddingTop: insets.top }]}>
        <Loading message="Connecting..." />
      </View>
    );
  }

  return (
    <View style={[screenStyle, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <SettingsContent />
    </View>
  );
}
