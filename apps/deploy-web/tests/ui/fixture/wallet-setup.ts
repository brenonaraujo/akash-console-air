import { netConfig } from "@akashnetwork/net";
import type { BrowserContext, Page } from "@playwright/test";
import { setTimeout as wait } from "timers/promises";

import { isWalletConnected } from "../uiState/isWalletConnected";
import { testEnvConfig } from "./test-env.config";

const WALLET_PASSWORD = "12345678";

export async function connectWalletViaKeplr(_context: BrowserContext, page: Page) {
  if (await isWalletConnected(page)) return;

  await page.getByRole("button", { name: /connect wallet/i }).first().click({ timeout: 30_000 });

  // The injected Keplr mock satisfies the cosmos-kit proxy protocol entirely
  // in-page, so no popup ever opens — skip the legacy context.waitForEvent
  // path that the real-extension flow needed and just wait for the connected
  // wallet UI to render.
  await page.getByRole("button", { name: "Keplr Keplr" }).click({ timeout: 30_000 }).catch(() => null);
  await page.getByLabel("Connected wallet name and balance").waitFor({ state: "visible", timeout: 30_000 });
}

async function connectOrUnlockWallet(popupPage: Page) {
  const buttonLocator = popupPage
    .getByRole("button", { name: /Unlock wallet/i })
    .or(popupPage.getByRole("button", { name: /connect button in approve connection flow/i }))
    .or(popupPage.getByRole("button", { name: /Approve/i }));
  const buttonText = (await buttonLocator.textContent())?.trim();
  if (buttonText === "Unlock wallet") {
    await unlockWallet(popupPage);
  } else if (buttonText === "Connect" || buttonText === "Approve") {
    await buttonLocator.click();
  } else {
    throw new Error(`Unexpected state in wallet popup: ${buttonText}`);
  }
}

async function unlockWallet(page: Page) {
  await page.waitForEvent("load", { timeout: 2_000 }).catch(() => {});
  await page.locator("input").fill(WALLET_PASSWORD);
  await page.getByRole("button", { name: /unlock wallet/i }).click();
}

export async function topUpWallet(address: string, attempt = 0) {
  try {
    const balance = await getBalance(address);

    if (balance > 50 * 1_000_000) {
      // 50 AKT should be enough
      return;
    }

    let faucetUrl = netConfig.getFaucetUrl(testEnvConfig.NETWORK_ID);
    if (!faucetUrl) {
      console.error(`Faucet URL is not set for this network: ${testEnvConfig.NETWORK_ID}. Cannot auto top up wallet`);
      return;
    }

    if (faucetUrl.endsWith("/")) {
      faucetUrl = faucetUrl.slice(0, -1);
    }

    const response = await fetch(`${faucetUrl}/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `address=${encodeURIComponent(address)}`
    });
    if (response.status >= 300) {
      const error = await response.text();
      console.error(`Unexpected faucet response status: ${response.status}`);
      console.error(error);

      if (error.includes("account sequence mismatch") && attempt < 10) {
        console.log("retrying top up attempt...", attempt + 1);
        await wait(2000);
        await topUpWallet(address, attempt + 1);
        return;
      }
    }
  } catch (error) {
    console.error("Unable to top up wallet");
    console.error(error);
  }
}

async function getBalance(address: string) {
  const response = await fetch(`${netConfig.getBaseAPIUrl(testEnvConfig.NETWORK_ID)}/cosmos/bank/v1beta1/balances/${address}`);
  const data = await response.json();
  if (!response.ok) return 0;
  return data.balances.find((balance: Record<string, string>) => balance.denom === "uakt")?.amount || 0;
}
