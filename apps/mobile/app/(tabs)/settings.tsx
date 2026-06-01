import { useAuth, useClerk } from "@clerk/expo";
import { useConvexAuth } from "convex/react";
import { Linking, ScrollView, Text, View } from "react-native";

import {
  ProfileCard,
  SettingsSection,
  SettingsItem,
} from "@/components/settings";
import { Button, Loading, ScreenShell } from "@/components/ui";
import { showThemedAlert } from "@/lib/show-themed-alert";

function SettingsContent() {
  const { signOut } = useClerk();

  function handleSignOut() {
    showThemedAlert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  return (
    <View className="flex-1">
      <View className="gap-1 px-4 pb-4 pt-3">
        <Text className="font-sans text-2xl font-semibold text-foreground">Settings</Text>
        <Text className="font-sans text-sm text-muted-foreground">
          Manage your account
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <SettingsSection>
          <ProfileCard />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem icon="information-circle-outline" label="Version" value="1.0.0" showChevron={false} />
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

        <View className="px-4 pb-8 pt-2">
          <Button variant="destructive" onPress={handleSignOut}>
            <Button.Text>Sign out</Button.Text>
          </Button>
        </View>

        <View className="items-center pb-6">
          <Text className="font-sans text-xs text-muted-foreground">OrgNote</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function SettingsScreen() {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  if (!clerkLoaded) {
    return (
      <ScreenShell>
        <Loading message="Loading..." />
      </ScreenShell>
    );
  }

  if (!isSignedIn) {
    return <ScreenShell />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <ScreenShell>
        <Loading message="Connecting..." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SettingsContent />
    </ScreenShell>
  );
}
