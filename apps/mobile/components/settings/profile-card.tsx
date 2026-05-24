import { Text, View } from "react-native";
import { useUser } from "@clerk/expo";

export function ProfileCard() {
  const { user } = useUser();

  const initials =
    user?.firstName?.[0] ??
    user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ??
    "?";

  return (
    <View className="mx-4 my-3 flex-row items-center gap-3 rounded-md border border-border bg-surface p-3">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Text className="text-lg font-semibold text-background">{initials}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-foreground">
          {user?.fullName ?? user?.firstName ?? "User"}
        </Text>
        <Text className="mt-0.5 text-[13px] text-muted-foreground">
          {user?.emailAddresses[0]?.emailAddress ?? ""}
        </Text>
      </View>
    </View>
  );
}
