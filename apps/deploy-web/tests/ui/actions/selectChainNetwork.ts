import type { NetworkId } from "@akashnetwork/chain-sdk";
import type { Page } from "@playwright/test";

// Going through the UI (App Settings → Select Network → Save) requires the
// wallet to stay connected through the route transition; cosmos-kit's
// auto-reconnect briefly flips isWalletConnected on nav, which trips the
// SettingsContainer route guard and bounces back to "/". Switching the network
// by writing the store key directly avoids all of that.
//
// The store's selectedNetworkId is the NetworkId ("mainnet" / "sandbox" /
// "testnet") — not the chain id ("sandbox-2") — and matches the value
// netConfig accepts.
const STORAGE_KEY = "selectedNetworkId";

export async function selectChainNetwork(page: Page, networkId: NetworkId = "sandbox") {
  const current = await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }, STORAGE_KEY);

  if (current === networkId) return;

  await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [STORAGE_KEY, networkId] as const);
  await page.reload({ waitUntil: "networkidle" });
}
