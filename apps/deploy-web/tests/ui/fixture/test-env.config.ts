import { tmpdir } from "os";
import path from "path";
import { z } from "zod";

export const testEnvSchema = z.object({
  BASE_URL: z
    .string()
    .default("http://localhost:3000")
    .transform(url => url.replace(/\/+$/, "")),
  TEST_WALLET_MNEMONIC: z.string(),
  NETWORK_ID: z.enum(["mainnet", "sandbox", "testnet"]).default("sandbox"),
  USER_DATA_DIR: z.string().default(path.join(tmpdir(), "akash-console-web-ui-tests", crypto.randomUUID())),
  E2E_TESTING_CLIENT_TOKEN: z.string().default("console-crypto-e2e")
});

export const testEnvConfig = testEnvSchema.parse({
  BASE_URL: process.env.BASE_URL,
  TEST_WALLET_MNEMONIC: process.env.TEST_WALLET_MNEMONIC,
  NETWORK_ID: process.env.NETWORK_ID,
  USER_DATA_DIR: process.env.USER_DATA_DIR,
  E2E_TESTING_CLIENT_TOKEN: process.env.E2E_TESTING_CLIENT_TOKEN
});

export const PROVIDERS_WHITELIST = {
  mainnet: ["akash15tl6v6gd0nte0syyxnv57zmmspgju4c3xfmdhk", "akash18ga02jzaq8cw52anyhzkwta5wygufgu6zsz6xc"],
  sandbox: ["akash1d4fletej4cwn9x8jzpzmnk6zkqeh90ejjskpmu", "akash1rk090a6mq9gvm0h6ljf8kz8mrxglwwxsk4srxh"],
  testnet: []
} satisfies Record<"mainnet" | "sandbox" | "testnet", string[]>;
