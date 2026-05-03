import { browserEnvConfig } from "@src/config/browser-env.config";
import type { FaqAnchorType } from "@src/pages/faq";
import networkStore from "@src/store/networkStore";

export type NewDeploymentParams = {
  step?: string;
  dseq?: string | number;
  redeploy?: string | number;
  templateId?: string;
  page?: "new-deployment" | "deploy-linux";
};

export const domainName = browserEnvConfig.NEXT_PUBLIC_APP_URL;
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return domainName;
}

export class UrlService {
  static home = () => "/";

  static sdlBuilder = (id?: string) => `/sdl-builder${appendSearchParams({ id })}`;
  static plainLinux = () => `/deploy-linux`;
  static priceCompare = () => "/price-compare";
  static analytics = () => "/analytics";
  static graph = (snapshot: string) => `/graph/${snapshot}`;
  static providerGraph = (snapshot: string) => `/provider-graph/${snapshot}`;
  static priceCompareCustom = (cpu: number, memory: number, storage: number, memoryUnit: string, storageUnit: string) =>
    `/price-compare${appendSearchParams({ cpu, memory, storage, memoryUnit, storageUnit })}`;
  static contact = () => "/contact";
  static faq = (q?: FaqAnchorType) => `/faq${q ? "#" + q : ""}`;
  static privacyPolicy = () => "/privacy-policy";
  static termsOfService = () => "/terms-of-service";

  static template = (id: string) => `/template/${id}`;
  static mintBurn = () => "/mint-burn";

  static getStarted = () => "/get-started";
  static getStartedWallet = (section?: string) => `/get-started/wallet${appendSearchParams({ section })}`;

  // Deploy
  static deploymentList = () => `/deployments`;
  static deploymentDetails = (dseq: string, tab?: string, logsMode?: string) => `/deployments/${dseq}${appendSearchParams({ tab, logsMode })}`;
  static templates = (category?: string | null, search?: string) => `/templates${appendSearchParams({ category, search })}`;
  static templateDetails = (templateId: string) => `/templates/${templateId}`;
  static providers = (sort?: string) => `/providers${appendSearchParams({ sort })}`;
  static providerDetail = (owner: string) => `/providers/${owner}${appendSearchParams({ network: networkStore.selectedNetworkId })}`;
  static providerDetailLeases = (owner: string) => `/providers/${owner}/leases`;
  static providerDetailRaw = (owner: string) => `/providers/${owner}/raw`;
  static providerDetailEdit = (owner: string) => `/providers/${owner}/edit`;
  static settings = () => "/settings";
  static settingsAuthorizations = () => "/settings/authorizations";

  static newDeployment = (params: NewDeploymentParams = {}) => {
    const { step, dseq, redeploy, templateId } = params;
    const page = params.page || "new-deployment";
    return `/${page}${appendSearchParams({ dseq, step, templateId, redeploy })}`;
  };
}

export function appendSearchParams(params: { [key: string]: string | number | boolean | null | undefined } = {}) {
  const urlParams = new URLSearchParams("");
  Object.keys(params).forEach(p => {
    const value = params[p];
    if (value) {
      urlParams.set(p, value.toString());
    }
  });

  const res = urlParams.toString();

  return res ? `?${res}` : res;
}

export function removeEmptyFilters(obj: { [key: string]: string }) {
  const copy = { ...obj };
  Object.keys(copy).forEach(key => {
    if (copy[key] === "*") {
      delete copy[key];
    }
  });

  return copy;
}

export function handleDocClick(ev: React.MouseEvent<any>, url: string): void {
  ev.preventDefault();

  window.open(url, "_blank");
}
