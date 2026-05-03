"use client";
import { useEffect, useState } from "react";
import { Button, buttonVariants, Card, CardContent } from "@akashnetwork/ui/components";
import { cn } from "@akashnetwork/ui/utils";
import { Rocket } from "iconoir-react";
import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LeaseSpecDetail } from "@src/components/shared/LeaseSpecDetail";
import { Title } from "@src/components/shared/Title";
import { USER_TEMPLATE_CODE } from "@src/config/deploy.config";
import { useServices } from "@src/context/ServicesProvider";
import { getShortText } from "@src/hooks/useShortText";
import sdlStore from "@src/store/sdlStore";
import type { ITemplate } from "@src/types";
import { RouteStep } from "@src/types/route-steps.type";
import { roundDecimal } from "@src/utils/mathHelpers";
import { bytesToShrink } from "@src/utils/unitUtils";
import { domainName, UrlService } from "@src/utils/urlUtils";
import Layout from "../layout/Layout";
import { CustomNextSeo } from "../shared/CustomNextSeo";

type Props = {
  id: string;
  template: ITemplate;
};

export const UserTemplate: React.FunctionComponent<Props> = ({ id, template }) => {
  const { analyticsService } = useServices();
  const [description, setDescription] = useState("");
  const _ram = bytesToShrink(template.ram);
  const _storage = bytesToShrink(template.storage);
  const router = useRouter();
  const [, setDeploySdl] = useAtom(sdlStore.deploySdl);

  useEffect(() => {
    const desc = template.description || "";
    setDescription(desc);
  }, []);

  return (
    <Layout>
      <CustomNextSeo title={`${template.title}`} url={`${domainName}${UrlService.template(id)}`} description={getShortText(template.description || "", 140)} />

      <div className="mb-6 flex items-baseline">
        <Title className="m-0">{template.title}</Title>
        {template.username && (
          <>
            &nbsp;&nbsp;by&nbsp;
            <span>{template.username}</span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <Button
          onClick={() => {
            analyticsService.track("deploy_sdl", {
              category: "sdl_builder",
              label: "Deploy SDL from template detail"
            });

            setDeploySdl({
              title: "",
              category: "",
              code: USER_TEMPLATE_CODE,
              description: "",
              content: template.sdl
            });

            router.push(UrlService.newDeployment({ step: RouteStep.editDeployment }));
          }}
          size="sm"
          className="space-x-2"
        >
          <Rocket className="rotate-45 text-sm" />
          <span className="whitespace-nowrap">Deploy</span>
        </Button>

        <Link
          href={UrlService.sdlBuilder(template.id)}
          className={cn(buttonVariants({ variant: "text", size: "sm" }))}
          onClick={() => {
            analyticsService.track("click_edit_sdl_template", {
              category: "sdl_builder",
              label: "Click on edit SDL template"
            });
          }}
        >
          Edit
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center space-x-6">
        <LeaseSpecDetail type="cpu" value={template.cpu / 1_000} />
        <LeaseSpecDetail type="ram" value={`${roundDecimal(_ram.value, 1)} ${_ram.unit}`} />
        <LeaseSpecDetail type="storage" value={`${roundDecimal(_storage.value, 1)} ${_storage.unit}`} />
      </div>

      <Card className="relative mt-6 whitespace-pre-wrap">
        <CardContent className="p-6">
          {description ? description : <p className="text-sm text-muted-foreground">No description...</p>}
        </CardContent>
      </Card>
    </Layout>
  );
};
