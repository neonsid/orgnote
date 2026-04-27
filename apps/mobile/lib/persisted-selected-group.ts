import AsyncStorage from "@react-native-async-storage/async-storage";

const key = (userId: string) => `orgnote:selectedGroupId:${userId}`;

export async function loadPersistedSelectedGroupId(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key(userId));
  } catch {
    return null;
  }
}

export async function savePersistedSelectedGroupId(userId: string, groupId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), groupId);
  } catch {
    /* best-effort */
  }
}
