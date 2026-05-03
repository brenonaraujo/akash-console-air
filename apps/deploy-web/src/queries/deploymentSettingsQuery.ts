import { useMemo } from "react";
import { isHttpError } from "@akashnetwork/http-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { millisecondsInMinute } from "date-fns/constants";

import { useServices } from "@src/context/ServicesProvider";
import { QueryKeys } from "./queryKeys";

export function useDeploymentSettingQuery(params: { dseq: string }) {
  const queryKey = useMemo(() => QueryKeys.getDeploymentSettingKey(params.dseq), [params.dseq]);
  const { deploymentSetting } = useServices();

  const query = useQuery({
    queryKey,
    queryFn: () => deploymentSetting.findByDseq(params.dseq),
    enabled: !!params.dseq,
    staleTime: 5 * millisecondsInMinute,
    retry: (failureCount, error) => {
      if (isHttpError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isLoading,
    error: query.error
  };
}
