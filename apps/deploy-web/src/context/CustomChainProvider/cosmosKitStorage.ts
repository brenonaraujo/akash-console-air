export const COSMOS_KIT_CURRENT_WALLET_KEY = "cosmos-kit@2:core//current-wallet";

export function hasPersistedCosmosKitWallet(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(COSMOS_KIT_CURRENT_WALLET_KEY);
}
