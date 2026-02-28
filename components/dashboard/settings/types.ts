export interface UserSettingsUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export type SettingsTab = "general" | "public-profile";
