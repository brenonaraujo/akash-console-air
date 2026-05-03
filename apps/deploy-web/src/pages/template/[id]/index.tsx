import { useRouter } from "next/router";

import { UserTemplate } from "@src/components/templates/UserTemplate";
import { useTemplate } from "@src/queries/useTemplateQuery";

const TemplatePage: React.FunctionComponent = () => {
  const router = useRouter();
  const { id } = router.query;

  const { data: template, isLoading } = useTemplate(typeof id === "string" ? id : "", { enabled: typeof id === "string" });

  if (!id || typeof id !== "string") return null;
  if (isLoading) return null;
  if (!template) return null;

  return <UserTemplate id={id} template={template} />;
};

export default TemplatePage;
