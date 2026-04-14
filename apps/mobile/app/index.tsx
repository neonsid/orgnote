import { SignedIn, SignedOut, useSSO } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "../../../convex/_generated/api";

function SignInPanel() {
  const { startSSOFlow } = useSSO();

  async function onGoogle() {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.warn(err);
      Alert.alert(
        "Sign in failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.muted}>
        Use the same Clerk account as the web app (Google OAuth).
      </Text>
      <Pressable onPress={onGoogle} style={styles.signInBox}>
        <Text style={styles.signInLabel}>Continue with Google</Text>
      </Pressable>
    </View>
  );
}

function MissingEnvBanner() {
  const missingConvex = !process.env.EXPO_PUBLIC_CONVEX_URL;
  const missingClerk = !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!missingConvex && !missingClerk) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>Configuration</Text>
      {missingConvex ? (
        <Text style={styles.bannerText}>Set EXPO_PUBLIC_CONVEX_URL</Text>
      ) : null}
      {missingClerk ? (
        <Text style={styles.bannerText}>
          Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
        </Text>
      ) : null}
      <Text style={styles.bannerHint}>
        Add them to apps/mobile/.env (see .env.example at repo root).
      </Text>
    </View>
  );
}

function BookmarkList() {
  const groups = useQuery(api.groups.queries.list);
  const [groupIndex, setGroupIndex] = useState(0);

  const selectedGroupId = useMemo(() => {
    if (!groups || groups.length === 0) return undefined;
    const idx = Math.min(groupIndex, groups.length - 1);
    return groups[idx]?._id;
  }, [groups, groupIndex]);

  const bookmarks = useQuery(
    api.bookmarks.queries.listBookmarksMinimal,
    selectedGroupId ? { groupId: selectedGroupId } : "skip",
  );

  if (groups === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading groups…</Text>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>No groups yet</Text>
        <Text style={styles.muted}>
          Create a group in the web app to see bookmarks here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.groupRow}>
        <Text style={styles.groupLabel}>Group</Text>
        <View style={styles.groupChips}>
          {groups.map((g, i) => (
            <Pressable
              key={g._id}
              onPress={() => setGroupIndex(i)}
              style={[
                styles.chip,
                i === Math.min(groupIndex, groups.length - 1) &&
                  styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  i === Math.min(groupIndex, groups.length - 1) &&
                    styles.chipTextActive,
                ]}
                numberOfLines={1}
              >
                {g.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {bookmarks === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.muted}>No bookmarks in this group.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.bookmarkTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.url} numberOfLines={1}>
                {item.url}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <MissingEnvBanner />

      {/* @ts-expect-error Clerk Expo types don't include children (React 19 compat issue) */}
      <SignedOut>
        <SignInPanel />
      </SignedOut>

      {/* @ts-expect-error Clerk Expo types don't include children (React 19 compat issue) */}
      <SignedIn>
        <BookmarkList />
      </SignedIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fafafa",
  },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  muted: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    maxWidth: 280,
  },
  signInBox: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#e0e7ff",
  },
  signInLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d4ed8",
    textAlign: "center",
  },
  banner: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  bannerTitle: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#92400e",
  },
  bannerText: {
    color: "#78350f",
    fontSize: 14,
  },
  bannerHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#92400e",
  },
  groupRow: { marginBottom: 12 },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  groupChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e5e5",
    maxWidth: "100%",
  },
  chipActive: {
    backgroundColor: "#111",
  },
  chipText: { color: "#111", fontSize: 14, maxWidth: 200 },
  chipTextActive: { color: "#fff" },
  listContent: { paddingBottom: 32, gap: 0 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },
  url: { fontSize: 13, color: "#2563eb", marginTop: 4 },
});
