import type { CustomUserProfile } from "@src/types/user";

export class UserTracker {
  track(_user?: CustomUserProfile | null) {
    // No-op in custodial-only mode (no Sentry tracking)
  }
}
