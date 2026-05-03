// cosmos-kit's @keplr-wallet/provider-extension does NOT use window.keplr for
// detection or method dispatch. It speaks a postMessage proxy protocol with the
// real Keplr extension: the page posts `proxy-request-${metaId}` messages with
// JSON-encoded args and waits for `proxy-request-response` replies. Detection
// gates on `window.keplrRequestMetaIdSupport` being non-null.
//
// This mock satisfies that protocol so cosmos-kit treats the test browser as
// having Keplr installed, then dispatches each call back to the Playwright-side
// CosmjsWebWallet via the existing exposed RPC binding.
export function initKeplrWebWalletMock(options: { rpcHandlerName: string }) {
  // metaId is hardcoded in @keplr-wallet/provider-extension/build/constants.js.
  // If the dependency bumps and the value changes the proxy will silently stop
  // matching — re-read that constant when upgrading. Must be inline because
  // Playwright's addInitScript only serializes the function body, not its
  // module-scope constants.
  const KEPLR_PROVIDER_META_ID = "d_2hxd99brRo";

  type ProxyRequest = {
    type: string;
    id: string;
    method: string;
    args?: unknown;
  };

  function toHex(arr: Uint8Array): string {
    let out = "";
    for (let i = 0; i < arr.length; i++) {
      out += arr[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  function fromHex(hex: string): Uint8Array {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  function stringify(value: unknown): string {
    return JSON.stringify(value, (_key, v) => {
      if (v && typeof v === "object" && v instanceof Uint8Array) {
        return `__uint8array__${toHex(v)}`;
      }
      if (
        v &&
        typeof v === "object" &&
        (v as { type?: string }).type === "Buffer" &&
        Array.isArray((v as { data?: unknown }).data)
      ) {
        return `__uint8array__${toHex(new Uint8Array((v as { data: number[] }).data))}`;
      }
      if (typeof v === "bigint") return `__bigint__${v.toString()}`;
      return v;
    });
  }

  function parse(text: string): unknown {
    return JSON.parse(text, (_key, value) => {
      if (typeof value === "string" && value.startsWith("__uint8array__")) {
        return fromHex(value.slice("__uint8array__".length));
      }
      if (typeof value === "string" && value.startsWith("__bigint__")) {
        return BigInt(value.slice("__bigint__".length));
      }
      return value;
    });
  }

  // Mirrors UINT8ARRAY_TAG in injectWebWallet — values returned by Playwright's
  // exposeFunction lose the Uint8Array prototype, so the test-runner side tags
  // them and we rehydrate here before re-encoding for cosmos-kit's transport.
  const UINT8ARRAY_TAG = "__akashUint8Array__";
  function decodeUint8Arrays(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(decodeUint8Arrays);
    if (value && typeof value === "object") {
      const tagged = value as Record<string, unknown>;
      if (Array.isArray(tagged[UINT8ARRAY_TAG])) {
        return new Uint8Array(tagged[UINT8ARRAY_TAG] as number[]);
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(tagged)) out[k] = decodeUint8Arrays(v);
      return out;
    }
    return value;
  }

  function wrap(obj: unknown): unknown {
    if (obj === undefined) return undefined;
    return JSON.parse(stringify(decodeUint8Arrays(obj)));
  }

  function unwrap(obj: unknown): unknown {
    if (obj === undefined) return undefined;
    return parse(stringify(obj));
  }

  if ((window as { keplrRequestMetaIdSupport?: unknown }).keplrRequestMetaIdSupport == null) {
    Object.defineProperty(window, "keplrRequestMetaIdSupport", {
      value: true,
      writable: false,
      configurable: false
    });
  }

  const expectedMetaIdType = `proxy-request-${KEPLR_PROVIDER_META_ID}`;

  window.addEventListener("message", async event => {
    const data = event.data as ProxyRequest | undefined;
    if (!data || typeof data !== "object") return;
    if (data.type !== expectedMetaIdType && data.type !== "proxy-request") return;
    if (typeof data.id !== "string" || typeof data.method !== "string") return;

    const msg: ProxyRequest = data;
    const args = (unwrap(msg.args) as unknown[] | undefined) ?? [];

    function reply(result: { return?: unknown; error?: string }) {
      window.postMessage(
        {
          type: "proxy-request-response",
          id: msg.id,
          result
        },
        window.location.origin
      );
    }

    try {
      // Methods cosmos-kit calls but the Playwright wallet doesn't need to handle.
      if (msg.method === "ping" || msg.method === "enable" || msg.method === "disable" || msg.method === "disconnect") {
        reply({ return: wrap(undefined) });
        return;
      }

      // Provider exposes experimentalSuggestChain; CosmjsWebWallet exposes suggestChain.
      const walletMethod = msg.method === "experimentalSuggestChain" ? "suggestChain" : msg.method;

      const handler = (window as unknown as Record<string, (m: string, a: unknown[]) => Promise<unknown>>)[options.rpcHandlerName];
      const value = await handler(walletMethod, args);
      reply({ return: wrap(value) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reply({ error: message });
    }
  });
}
