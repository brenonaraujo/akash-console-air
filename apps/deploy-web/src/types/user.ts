import type { IPlan, PlanCode } from "@src/utils/plans";

export interface UserSettings {
  id?: string;
  userId?: string;
  username?: string;
  email?: string;
  subscribedToNewsletter?: boolean;
  bio?: string;
  youtubeUsername?: string;
  twitterUsername?: string;
  githubUsername?: string;
  planCode?: PlanCode;
  plan?: IPlan;
  emailVerified?: boolean;
}

export type CustomUserProfile = UserSettings;

export interface IUserSetting {
  username: string;
  bio: string;
}
