import { netConfig } from "@akashnetwork/net";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const network = req.query.network as string;

  const supportedNetworks = ["mainnet", "sandbox"];

  if (!supportedNetworks.includes(network)) {
    res.status(422).json({ error: `Invalid network: ${network}` });
    return;
  }

  try {
    const node =
      network === "mainnet"
        ? { api: "https://rpc.akt.dev/rest", rpc: "https://rpc.akt.dev/rpc" }
        : { api: netConfig.getBaseAPIUrl(network), rpc: netConfig.getBaseRpcUrl(network) };
    const nodes = [nodeWithId(node)];
    res.status(200).json(nodes);
  } catch (error) {
    res.status(500).json({ error: `Network ${network} not supported` });
  }
}

function nodeWithId(node: { api: string; rpc: string }) {
  return {
    ...node,
    id: new URL(node.api).hostname
  };
}
