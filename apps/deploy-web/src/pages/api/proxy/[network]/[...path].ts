import type { NextApiRequest, NextApiResponse } from "next";

import { browserEnvConfig } from "@src/config/browser-env.config";
import { proxyRequest } from "@src/lib/nextjs/proxyRequest/proxyRequest";
import { ApiUrlService } from "@src/services/api-url/api-url.service";

const ALLOWED_NETWORKS = new Set(["mainnet", "sandbox", "testnet"]);

const apiUrlService = new ApiUrlService(browserEnvConfig);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const network = String(req.query.network || "");
  if (!ALLOWED_NETWORKS.has(network)) {
    res.status(400).json({ error: "Unsupported network", received: network });
    return;
  }

  const upstreamPath = (req.url ?? "").replace(new RegExp(`^/api/proxy/${network}/?`), "/");
  const upstreamOrigin = new URL(apiUrlService.getConsoleApiUrlFor(network)).origin;

  await proxyRequest(req, res, {
    target: upstreamOrigin + upstreamPath,
    onError: error => {
      console.error("PROXY_API_REQUEST_ERROR", error);
    }
  });
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false
  }
};
