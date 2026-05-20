import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="mb-4 text-lg font-semibold text-foreground">
          This screen does not exist.
        </Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-base text-primary-accent">Go home</Text>
        </Link>
      </View>
    </>
  );
}
