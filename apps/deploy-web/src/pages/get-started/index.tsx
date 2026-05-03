"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@akashnetwork/ui/components";

import { GetStartedStepper } from "@src/components/get-started/GetStartedStepper";
import Layout from "@src/components/layout/Layout";
import { CustomNextSeo } from "@src/components/shared/CustomNextSeo";
import { domainName, UrlService } from "@src/utils/urlUtils";

const GetStarted: React.FunctionComponent = () => {
  return (
    <Layout>
      <CustomNextSeo
        title="Get started with Console Air"
        url={`${domainName}${UrlService.getStarted()}`}
        description="Follow the steps to get started with Console Air!"
      />

      <Card>
        <CardHeader>
          <CardTitle>Get started with Console Air!</CardTitle>
        </CardHeader>
        <CardContent>
          <GetStartedStepper />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default GetStarted;
