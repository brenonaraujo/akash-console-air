import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { useServices } from "@src/context/ServicesProvider";
import type { DepositParams, RpcDeploymentParams } from "@src/types/deployment";
import { ApiUrlService } from "@src/utils/apiUtils";
import { QueryKeys } from "./queryKeys";

async function getDepositParams(chainApiHttpClient: AxiosInstance): Promise<DepositParams[]> {
  const response = await chainApiHttpClient.get<RpcDeploymentParams>(ApiUrlService.depositParams(""));
  return response.data.params?.min_deposits ?? [];
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
export function useDepositParams(options?: Omit<UseQueryOptions<DepositParams[]>, "queryKey" | "queryFn">) {
  const { chainApiHttpClient } = useServices();
  return useQuery({
    queryKey: QueryKeys.getDepositParamsKey(),
    queryFn: () => getDepositParams(chainApiHttpClient),
    staleTime: ONE_HOUR_IN_MS,
    gcTime: ONE_HOUR_IN_MS,
    ...options,
    enabled: options?.enabled !== false && !chainApiHttpClient.isFallbackEnabled
  });
}
