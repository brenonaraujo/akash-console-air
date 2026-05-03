import type { TemplateOutput } from "@akashnetwork/http-sdk";
import { z } from "zod";

import { defineServerSideProps } from "@src/lib/nextjs/defineServerSideProps/defineServerSideProps";

type Props = {
  template?: TemplateOutput;
  templateId?: string;
};

export const createServerSideProps = (route: string) =>
  defineServerSideProps({
    route,
    schema: z.object({
      query: z.object({
        templateId: z.string().optional(),
        step: z.string().optional(),
        dseq: z.string().optional(),
        redeploy: z.string().optional()
      })
    }),
    async handler({ query, services }) {
      const { templateId } = query;

      if (!templateId) {
        return { props: {} as Props };
      }

      const template = await services.template.findById(templateId).catch(error => {
        services.logger.warn({ error });
        return null;
      });

      if (template) {
        return { props: { template, templateId } satisfies Props };
      }

      return { props: { templateId } satisfies Props };
    }
  });
