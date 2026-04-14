import { Redirect } from "expo-router";

import { useAuth } from "@clerk/expo";

import { Loading } from "@/components/ui";

export default function SsoCallbackScreen() {
  const auth = useAuth();

  if (!auth.isLoaded) {
    return <Loading message="Finishing sign in..." size="large" />;
  }

  if (auth.isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/" />;
}
