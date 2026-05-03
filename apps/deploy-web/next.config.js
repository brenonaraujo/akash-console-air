require("@akashnetwork/env-loader");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});
const { version } = require("./package.json");
const isDev = process.env.NODE_ENV === "development";
const defaultCache = require("next-pwa/cache");
const withPWA = require("next-pwa")({
  dest: "public",
  disable: isDev,
  runtimeCaching: [
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin; // eslint-disable-line no-undef
        return !isSameOrigin;
      },
      handler: "NetworkOnly",
      options: { cacheName: "third-party-network-only" }
    },
    ...defaultCache
  ]
});
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const transpilePackages = ["geist", "@akashnetwork/ui"];

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: version
  },
  compiler: {
    styledComponents: true
  },
  images: {
    domains: ["raw.githubusercontent.com", "avatars.githubusercontent.com"]
  },
  output: "standalone",
  typescript: {
    tsconfigPath: "./tsconfig.build.json",
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages,
  i18n: {
    locales: ["en-US"],
    defaultLocale: "en-US"
  },
  webpack: (config, options) => {
    config.externals.push({
      "node:crypto": "crypto"
    });
    config.externals.push("pino-pretty");

    config.resolve.alias = {
      ...config.resolve.alias,
      "prettier/standalone": false,
      "prettier/plugins/yaml": false,
      prettier: false
    };

    if (!options.isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.join(require.resolve("@akashnetwork/chain-sdk"), "..", "..", "sdl-schema.yaml"),
              to: "../public/sdl-schema.yaml"
            }
          ]
        })
      );
    }

    if (process.env.ANALYZE === "true") {
      config.optimization.moduleIds = "named";
      config.optimization.chunkIds = "named";
    }

    return config;
  },
  redirects: async () => {
    return [
      {
        source: "/deploy",
        destination: "/cloud-deploy",
        permanent: true
      }
    ];
  }
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
