import { useMemo } from "react";
import type { TemplateCategory, TemplateHttpService, TemplateOutputSummary } from "@akashnetwork/http-sdk";
import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { secondsInDay } from "date-fns/constants";

import { useServices } from "@src/context/ServicesProvider/ServicesProvider";
import type { ITemplate } from "@src/types";
import { QueryKeys } from "./queryKeys";

export function useTemplate(id: string, options?: Omit<UseQueryOptions<ITemplate, Error, any, QueryKey>, "queryKey" | "queryFn">) {
  const { consoleApiHttpClient } = useServices();

  return useQuery<ITemplate, Error>({
    queryKey: QueryKeys.getTemplateKey(id),
    queryFn: () => consoleApiHttpClient.get<ITemplate>(`/v1/user/template/${id}`).then(response => response.data),
    ...options
  });
}

async function getTemplates(templateService: TemplateHttpService) {
  const response = await templateService.findGroupedByCategory();

  if (!response.data) {
    return { categories: [], templates: [] };
  }

  const categories = response.data.filter(x => !!x.templates?.length);
  const modifiedCategories = categories.map(category => {
    const templatesWithCategory = category.templates.map(template => ({
      ...template,
      category: category.title
    }));

    return { ...category, templates: templatesWithCategory };
  });
  const templates = modifiedCategories.flatMap(category => category.templates);

  return { categories: modifiedCategories, templates };
}

export interface EnhancedTemplateCategory extends Omit<TemplateCategory, "templates"> {
  templates: TemplateOutputSummaryWithCategory[];
}

export interface TemplateOutputSummaryWithCategory extends TemplateOutputSummary {
  category: TemplateCategory["title"];
}

export interface CategoriesAndTemplates {
  categories: EnhancedTemplateCategory[];
  templates: TemplateOutputSummaryWithCategory[];
}

export interface CategoriesAndTemplatesResult extends CategoriesAndTemplates {
  isLoading: boolean;
}

export function useTemplates(options = {}): CategoriesAndTemplatesResult {
  const { template: templateService } = useServices();
  const query = useQuery({
    queryKey: QueryKeys.getTemplatesKey(),
    queryFn: () => getTemplates(templateService),
    staleTime: secondsInDay * 1000,
    gcTime: secondsInDay * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options
  });

  return useMemo(
    () => ({
      isLoading: query.isFetching,
      categories: query.data?.categories || [],
      templates: query.data?.templates || []
    }),
    [query.isFetching, query.data]
  );
}
