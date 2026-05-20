import { useAuth, useClerk } from "@clerk/expo";
import { useConvexAuth, useQuery } from "convex/react";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
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
import { cn } from "@/lib/cn";
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
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3 active:bg-muted"
    >
      <Text
        className={cn("text-sm text-foreground", selected && "font-semibold")}
      >
        {label}
      </Text>
      {selected ? (
        <Text className="text-sm text-primary-accent">✓</Text>
      ) : null}
    </Pressable>
  );
}

function SettingsContent() {
  const { signOut } = useClerk();
  const profile = useQuery(api.profile.queries.getProfile);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { preference, setPreference } = useAppTheme();

  function handleSignOut() {
    showThemedAlert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="bg-surface px-4 py-3">
        <Text className="text-xl font-semibold text-foreground">Settings</Text>
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

      <View className="items-center py-8">
        <Text className="text-xs text-muted-foreground">OrgNote</Text>
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

  if (!clerkLoaded) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        <Loading message="Loading..." />
      </View>
    );
  }

  if (!isSignedIn) {
    return <View className="flex-1 bg-background" style={{ paddingTop: insets.top }} />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        <Loading message="Connecting..." />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <SettingsContent />
    </View>
  );
}
