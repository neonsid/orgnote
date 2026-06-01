import { Text, View } from "react-native";
import { useUser } from "@clerk/expo";

export function ProfileCard() {
  const { user } = useUser();

  const initials =
    user?.firstName?.[0] ??
    user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ??
    "?";

  return (
    <View className="flex-row items-center gap-4 p-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-accent/15">
        <Text className="font-sans text-xl font-semibold text-primary-accent">{initials}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base font-semibold text-foreground">
          {user?.fullName ?? user?.firstName ?? "User"}
        </Text>
        <Text className="mt-1 font-sans text-sm text-muted-foreground">
          {user?.emailAddresses[0]?.emailAddress ?? ""}
        </Text>
      </View>
    </View>
  );
}
