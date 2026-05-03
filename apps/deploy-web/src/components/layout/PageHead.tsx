import React from "react";
import Head from "next/head";
import { DefaultSeo, NextSeo } from "next-seo";
import type { NextSeoProps } from "next-seo/lib/types";

import { domainName } from "@src/utils/urlUtils";

export const PageHead: React.FunctionComponent<{ pageSeo?: NextSeoProps }> = ({ pageSeo }) => {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DefaultSeo
        titleTemplate="%s | Console Air"
        defaultTitle="Console Air"
        description="Console Air is a self-custody crypto wallet UI for deploying docker containers on the Akash Network, a decentralized cloud compute marketplace. Explore, deploy and track all in one place!"
        openGraph={{
          type: "website",
          locale: "en_US",
          url: `${domainName}/`,
          site_name: "Console Air",
          description: "Deploy docker containers on the decentralized supercloud Akash Network."
        }}
      />

      <NextSeo {...pageSeo} />
    </>
  );
};
