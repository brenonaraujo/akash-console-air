import type { NextApiRequest, NextApiResponse } from "next";

import { proxyRequest } from "@src/lib/nextjs/proxyRequest/proxyRequest";

const ALLOWED_NETWORKS = new Set(["mainnet", "sandbox", "testnet"]);
const PROVIDER_PROXY_TEMPLATE = "https://console.akash.network/provider-proxy-%{NETWORK}";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const network = String(req.query.network || "");

  if (!ALLOWED_NETWORKS.has(network)) {
    res.status(400).json({ error: "Unsupported network", received: network });
    return;
  }

  const target = PROVIDER_PROXY_TEMPLATE.replace("%{NETWORK}", network) + "/";

  // Incoming request headers are forwarded transparently by proxyRequest, so the
  // upstream sees cf-connecting-ip / x-forwarded-for / traceparent / baggage when
  // they're actually present (e.g. behind a real Cloudflare or other reverse proxy)
  // and otherwise they're simply absent — no synthesised Cloudflare values.
  await proxyRequest(req, res, {
    target,
    timeout: 120_000,
    onError: error => {
      console.error("PROVIDER_PROXY_REQUEST_ERROR", error);
    }
  });
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false
  }
};
