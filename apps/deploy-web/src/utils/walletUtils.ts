import type { NetworkId } from "@akashnetwork/chain-sdk/web";
import { LoggerService } from "@akashnetwork/logging";

import { ErrorHandlerService } from "@src/services/error-handler/error-handler.service";
import networkStore from "@src/store/networkStore";

const logger = new LoggerService({ name: "walletUtils" });
const errorHandler = new ErrorHandlerService(logger);

export interface LocalWallet {
  address: string;
  name: string;
  cert?: string;
  certKey?: string;
  token?: string;
  selected: boolean;
}

export function getSelectedStorageWallet() {
  const wallets = getStorageWallets();

  return wallets.find(w => w.selected) ?? wallets[0] ?? null;
}

export function getStorageWallets(networkId?: NetworkId): LocalWallet[] {
  if (typeof window === "undefined") {
    return [];
  }

  const selectedNetworkId: NetworkId = networkId || networkStore.selectedNetworkId;
  let wallets: LocalWallet[] = [];

  const walletsStr = localStorage.getItem(`${selectedNetworkId}/wallets`);
  if (walletsStr) {
    try {
      wallets = JSON.parse(walletsStr) as LocalWallet[];
    } catch (error) {
      errorHandler.reportError({
        error,
        severity: "warning",
        tags: { context: "walletUtils.getStorageWallets" },
        walletsStr
      });
    }
  }

  return wallets;
}

export function updateWallet(address: string, func: (w: LocalWallet) => LocalWallet, networkId?: NetworkId) {
  const wallets = getStorageWallets(networkId);
  let wallet = wallets.find(w => w.address === address);

  if (wallet) {
    wallet = func(wallet);

    const newWallets = wallets.map(w => (w.address === address ? (wallet as LocalWallet) : w));
    updateStorageWallets(newWallets, networkId);
  }
}

export function updateStorageWallets(wallets: LocalWallet[], networkId?: NetworkId) {
  const selectedNetworkId = networkId || networkStore.selectedNetworkId;
  localStorage.setItem(`${selectedNetworkId}/wallets`, JSON.stringify(wallets));
}

export function deleteWalletFromStorage(address: string, deleteDeployments: boolean, networkId?: NetworkId) {
  const selectedNetworkId = networkId || networkStore.selectedNetworkId;
  const wallets = getStorageWallets();
  const newWallets = wallets.filter(w => w.address !== address).map((w, i) => ({ ...w, selected: i === 0 }));

  updateStorageWallets(newWallets);

  localStorage.removeItem(`${selectedNetworkId}/${address}/settings`);
  localStorage.removeItem(`${selectedNetworkId}/${address}/provider.data`);

  if (deleteDeployments) {
    const deploymentKeys = Object.keys(localStorage).filter(key => key.startsWith(`${selectedNetworkId}/${address}/deployments/`));
    for (const deploymentKey of deploymentKeys) {
      localStorage.removeItem(deploymentKey);
    }
  }

  return newWallets;
}

export function useSelectedWalletFromStorage() {
  return getSelectedStorageWallet();
}
