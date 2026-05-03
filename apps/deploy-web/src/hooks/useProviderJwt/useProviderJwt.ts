import { useCallback, useEffect, useMemo } from "react";
import { JwtTokenManager, type JwtTokenPayload } from "@akashnetwork/chain-sdk/web";
import { atom, useAtom } from "jotai";

import { useSelectedChain } from "@src/context/CustomChainProvider";
import { useServices } from "@src/context/ServicesProvider";
import { useWallet } from "@src/context/WalletProvider";

const JWT_TOKEN_ATOM = atom<string | null>(null);

export const DEPENDENCIES = {
  useSelectedChain,
  useWallet,
  useServices
};

export function useProviderJwt({ dependencies: d = DEPENDENCIES }: { dependencies?: typeof DEPENDENCIES } = {}): UseProviderJwtResult {
  const { storedWalletsService, networkStore } = d.useServices();
  const { address, isWalletConnected } = d.useWallet();
  const selectedChain = d.useSelectedChain();
  const selectedNetworkId = networkStore.useSelectedNetworkId();
  const [accessToken, setAccessToken] = useAtom(JWT_TOKEN_ATOM);

  useEffect(() => {
    const token = storedWalletsService.getStorageWallets(selectedNetworkId).find(w => w.address === address)?.token;
    setAccessToken(token || null);
  }, [storedWalletsService, selectedNetworkId, address]);

  const jwtTokenManager = useMemo(
    () =>
      new JwtTokenManager({
        signArbitrary: selectedChain
          ? selectedChain.signArbitrary
          : () => {
              throw new Error("Cannot sign jwt token: custodial wallet not found");
            }
      }),
    [selectedChain]
  );
  const parsedToken = useMemo(() => {
    if (!accessToken) return null;
    return jwtTokenManager.decodeToken(accessToken);
  }, [accessToken, jwtTokenManager]);

  const generateToken = useCallback(async () => {
    if (!isWalletConnected) return;

    const leasesAccess: JwtTokenPayload["leases"] = {
      access: "scoped",
      scope: ["status", "shell", "events", "logs"]
    };
    const tokenLifetimeInSeconds = 30 * 60;
    const now = Math.floor(Date.now() / 1000);
    const token = await jwtTokenManager.generateToken({
      version: "v1",
      iss: address,
      exp: now + tokenLifetimeInSeconds,
      iat: now,
      leases: leasesAccess
    });

    storedWalletsService.updateWallet(address, w => ({ ...w, token }));
    setAccessToken(token);
  }, [isWalletConnected, selectedChain, jwtTokenManager, address]);

  return useMemo(
    () => ({
      get isTokenExpired() {
        return !!parsedToken && parsedToken.exp <= Math.floor(Date.now() / 1000);
      },
      accessToken,
      generateToken
    }),
    [accessToken, generateToken]
  );
}

export interface UseProviderJwtResult {
  isTokenExpired: boolean;
  accessToken: string | null;
  generateToken: () => Promise<void>;
}
