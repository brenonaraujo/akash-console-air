import { useMemo } from "react";
import { atom, useAtom } from "jotai";

import { useSettings } from "../context/SettingsProvider";

interface ITopBannerContext {
  hasBanner: boolean;
  setIsMaintenanceBannerOpen: (isMaintenanceBannerOpen: boolean) => void;
  isMaintenanceBannerOpen: boolean;
  setIsGenericBannerOpen: (isGenericBannerOpen: boolean) => void;
  isGenericBannerOpen: boolean;
  isBlockchainDown: boolean;
}

const IS_MAINTENANCE_ATOM = atom(false);
const IS_GENERIC_BANNER_ATOM = atom(false);

export function useTopBanner(): ITopBannerContext {
  const { settings } = useSettings();

  const [isMaintenanceBannerOpen, setIsMaintenanceBannerOpen] = useAtom(IS_MAINTENANCE_ATOM);
  const [isGenericBannerOpen, setIsGenericBannerOpen] = useAtom(IS_GENERIC_BANNER_ATOM);

  const hasBanner = useMemo(
    () => isMaintenanceBannerOpen || isGenericBannerOpen || settings.isBlockchainDown,
    [isMaintenanceBannerOpen, isGenericBannerOpen, settings.isBlockchainDown]
  );

  return useMemo(
    () => ({
      hasBanner,
      isMaintenanceBannerOpen,
      setIsMaintenanceBannerOpen,
      isGenericBannerOpen,
      setIsGenericBannerOpen,
      isBlockchainDown: settings.isBlockchainDown
    }),
    [
      hasBanner,
      isMaintenanceBannerOpen,
      setIsMaintenanceBannerOpen,
      isGenericBannerOpen,
      setIsGenericBannerOpen,
      settings.isBlockchainDown
    ]
  );
}

export type ChainMaintenanceDetails = { date: string };
export function useChainMaintenanceDetails(): ChainMaintenanceDetails {
  return { date: "" };
}

export type GenericBannerDetails = { message: string };
export function useGenericBannerDetails(): GenericBannerDetails {
  return { message: "" };
}
