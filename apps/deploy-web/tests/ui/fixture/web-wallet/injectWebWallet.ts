import type { Page } from "@playwright/test";

import type { FeeType } from "./CosmjsWebWallet";
import { CosmjsWebWallet } from "./CosmjsWebWallet";
import { initKeplrWebWalletMock } from "./initKeplrWebWalletMock";

export type { FeeType } from "./CosmjsWebWallet";

const WALLETS = new Map<Page, CosmjsWebWallet>();
const getWallet = (page: Page): CosmjsWebWallet => {
  let wallet = WALLETS.get(page);
  if (!wallet) {
    wallet = new CosmjsWebWallet();
    WALLETS.set(page, wallet);
    page.once("close", () => WALLETS.delete(page));
  }
  return wallet;
};

export function setFeeType(page: Page, feeType: FeeType) {
  getWallet(page).setFeeType(feeType);
}

export async function switchWebWallet(page: Page, mnemonic: string) {
  await getWallet(page).switchWallet(mnemonic);
  await page.evaluate(() => window.dispatchEvent(new Event("keplr_keystorechange")));
}

const RPC_HANDLER_NAME = "__akashCosmjsWalletRpc";

const UINT8ARRAY_TAG = "__akashUint8Array__";

function encodeUint8Arrays(value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { [UINT8ARRAY_TAG]: Array.from(value) };
  }
  if (Array.isArray(value)) return value.map(encodeUint8Arrays);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = encodeUint8Arrays(v);
    }
    return out;
  }
  return value;
}

export async function injectWebWallet(page: Page, mnemonic: string) {
  const wallet = getWallet(page);
  await wallet.switchWallet(mnemonic);
  await page.exposeFunction(RPC_HANDLER_NAME, async (method: keyof typeof wallet, args: unknown[]) => {
    if (!wallet[method]) throw new Error(`Unknown wallet RPC method: ${method}`);
    const result = await (wallet[method] as (...args: unknown[]) => Promise<unknown>)(...args);
    // Playwright serializes Uint8Array values as plain numeric-keyed objects, which loses the
    // Uint8Array prototype on the browser side. Tag them with a sentinel so the in-page mock
    // can rebuild Uint8Array instances before handing the value back to cosmos-kit.
    return encodeUint8Arrays(result);
  });
  await page.addInitScript(initKeplrWebWalletMock, {
    rpcHandlerName: RPC_HANDLER_NAME
  });
}
