import { useServices } from "@src/context/ServicesProvider";
import { getUsdcDenom } from "@src/utils/priceUtils";

export const DEPENDENCIES = {
  useServices
};

export const useUsdcDenom = (dependencies: typeof DEPENDENCIES = DEPENDENCIES): string => {
  const { networkStore } = dependencies.useServices();
  const selectedNetworkId = networkStore.useSelectedNetworkId();
  return getUsdcDenom(selectedNetworkId);
};

const SUPPORTED_DENOMS = [{ id: "uact", label: "uACT", tokenLabel: "ACT", value: "uact" }];

export const useSupportedDenoms = () => SUPPORTED_DENOMS;
