"use client";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SDLInput } from "@akashnetwork/chain-sdk/web";
import { yaml } from "@akashnetwork/chain-sdk/web";
import { Alert, Button, CustomTooltip, FileButton, Input, Spinner } from "@akashnetwork/ui/components";
import { cn } from "@akashnetwork/ui/utils";
import type { EncodeObject } from "@cosmjs/proto-signing";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowRight, InfoCircle, Upload } from "iconoir-react";
import { useAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";

import { UACT_DENOM } from "@src/config/denom.config";
import { LOG_COLLECTOR_IMAGE } from "@src/config/log-collector.config";
import { useSdlBuilder } from "@src/context/SdlBuilderProvider/SdlBuilderProvider";
import { useServices } from "@src/context/ServicesProvider";
import { useWallet } from "@src/context/WalletProvider";
import { useCertificate } from "@src/hooks/useCertificate/useCertificate";
import { useImportSimpleSdl } from "@src/hooks/useImportSimpleSdl";
import { useDepositParams } from "@src/queries/useSaveSettings";
import sdlStore from "@src/store/sdlStore";
import type { TemplateCreation } from "@src/types";
import type { DepositParams } from "@src/types/deployment";
import { RouteStep } from "@src/types/route-steps.type";
import { deploymentData } from "@src/utils/deploymentData";
import { validateDeploymentData } from "@src/utils/deploymentUtils";
import { TransactionMessageData } from "@src/utils/TransactionMessageData";
import { domainName, handleDocClick, UrlService } from "@src/utils/urlUtils";
import { useSelectedChain } from "../../../context/CustomChainProvider";
import { useSettings } from "../../../context/SettingsProvider";
import { DeploymentDepositModal } from "../../deployments/DeploymentDepositModal/DeploymentDepositModal";
import { DeploymentMinimumEscrowAlertText } from "../../sdl/DeploymentMinimumEscrowAlertText";
import { SDLEditor } from "../../sdl/SDLEditor/SDLEditor";
import { CustomNextSeo } from "../../shared/CustomNextSeo";
import { LinkTo } from "../../shared/LinkTo";
import ViewPanel from "../../shared/ViewPanel";
import type { SdlBuilderRefType } from "../SdlBuilder";
import { SdlBuilder } from "../SdlBuilder";

export type Props = {
  onTemplateSelected: Dispatch<TemplateCreation | null>;
  selectedTemplate: TemplateCreation | null;
  editedManifest: string | null;
  setEditedManifest: Dispatch<SetStateAction<string>>;
  dependencies?: typeof DEPENDENCIES;
};

export const DEPENDENCIES = {
  Alert,
  Button,
  CustomTooltip,
  FileButton,
  Input,
  Spinner,
  SDLEditor,
  SdlBuilder,
  DeploymentDepositModal,
  DeploymentMinimumEscrowAlertText,
  CustomNextSeo,
  LinkTo,
  ViewPanel,
  useServices,
  useSettings,
  useWallet,
  useCertificate,
  useSdlBuilder,
  useImportSimpleSdl,
  useDepositParams,
  useMuiTheme,
  useMediaQuery,
  useRouter,
  useSearchParams,
  useSelectedChain
};

export const ManifestEdit: React.FunctionComponent<Props> = ({
  editedManifest,
  setEditedManifest,
  onTemplateSelected,
  selectedTemplate,
  dependencies: d = DEPENDENCIES
}) => {
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isValidSdl, setIsValidSdl] = useState(false);
  const [deploymentName, setDeploymentName] = useState("");
  const [isCreatingDeployment, setIsCreatingDeployment] = useState(false);
  const [isDepositingDeployment, setIsDepositingDeployment] = useState(false);
  const [selectedSdlEditMode, setSelectedSdlEditMode] = useAtom(sdlStore.selectedSdlEditMode);
  const sdlDenom = useMemo(() => {
    if (!editedManifest) return UACT_DENOM;

    try {
      const sdl: SDLInput = yaml.raw(editedManifest);
      return Object.values(Object.values(sdl.profiles.placement)[0].pricing)[0].denom;
    } catch {
      return UACT_DENOM;
    }
  }, [editedManifest]);

  const { analyticsService, chainApiHttpClient, publicConfig: appConfig, deploymentLocalStorage } = d.useServices();
  const { settings } = d.useSettings();
  const { address, signAndBroadcastTx, isWalletConnected } = d.useWallet();
  const { connect } = d.useSelectedChain();
  const router = d.useRouter();
  const { updateSelectedCertificate, genNewCertificateIfLocalIsInvalid } = d.useCertificate();
  const [, setDeploySdl] = useAtom(sdlStore.deploySdl);
  const muiTheme = d.useMuiTheme();
  const smallScreen = d.useMediaQuery(muiTheme.breakpoints.down("md"));
  const sdlBuilderRef = useRef<SdlBuilderRefType>(null);
  const { hasComponent } = d.useSdlBuilder();
  const searchParams = d.useSearchParams();
  const templateId = searchParams.get("templateId");
  const { data: depositParams } = d.useDepositParams();
  const defaultDeposit = depositParams || appConfig.NEXT_PUBLIC_DEFAULT_INITIAL_DEPOSIT;
  const services = d.useImportSimpleSdl(isValidSdl ? editedManifest : null);

  useEffect(() => {
    if (hasComponent("ssh")) {
      setSelectedSdlEditMode("builder");
    }
  }, [hasComponent, setSelectedSdlEditMode]);

  useEffect(() => {
    if (selectedTemplate?.name) {
      setDeploymentName(selectedTemplate.name);
    }
  }, [selectedTemplate]);

  const onFileSelect = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {
      onTemplateSelected({
        title: "From file",
        code: "from-file",
        category: "General",
        description: "Custom uploaded file",
        content: event.target?.result as string
      });
      setEditedManifest(event.target?.result as string);
      setSelectedSdlEditMode("yaml");
      analyticsService.track("sdl_uploaded", "Amplitude");
    };

    reader.readAsText(file);
  };

  async function handleTextChange(value: string | undefined) {
    setEditedManifest(value || "");
  }

  async function createAndValidateDeploymentData(yamlStr: string, dseq: string | null = null, deposit = defaultDeposit) {
    try {
      if (!yamlStr) return null;

      const dd = await deploymentData.NewDeploymentData(chainApiHttpClient, yamlStr, dseq, address, deposit);
      validateDeploymentData(dd, selectedTemplate);
      setParsingError(null);

      return dd;
    } catch (err: any) {
      if (err.name === "YAMLException" || err.name === "CustomValidationError") {
        setParsingError(err.message);
      } else if (err.name === "TemplateValidation") {
        setParsingError(err.message);
      } else {
        setParsingError("Error while parsing SDL file");
        console.error(err);
      }
    }
  }

  const handleCreateDeployment = async () => {
    analyticsService.track("create_deployment_btn_clk", "Amplitude");

    if (!isWalletConnected) {
      connect();
      return;
    }

    let isValid = isValidSdl;

    if (selectedSdlEditMode === "builder") {
      isValid = !!(await sdlBuilderRef.current?.validate());
    }

    if (!isValid) {
      if (!parsingError) setParsingError("Error while parsing SDL");
      return;
    }

    setIsDepositingDeployment(true);
  };

  const onDeploymentDeposit = async (deposit: number) => {
    setIsDepositingDeployment(false);
    await handleCreateClick(deposit);
  };

  async function handleCreateClick(deposit: number | DepositParams[]) {
    try {
      setIsCreatingDeployment(true);

      let sdl = selectedSdlEditMode === "yaml" ? editedManifest : sdlBuilderRef.current?.getSdl();
      if (!sdl) {
        setIsCreatingDeployment(false);
        return;
      }

      const [dd, newCert] = await Promise.all([createAndValidateDeploymentData(sdl, null, deposit), genNewCertificateIfLocalIsInvalid()]);

      if (!dd) return;

      const messages: EncodeObject[] = [];

      // Create a cert if the user doesn't have one
      if (newCert) {
        messages.push(TransactionMessageData.getCreateCertificateMsg(address, newCert.cert, newCert.publicKey));
      }

      messages.push(TransactionMessageData.getCreateDeploymentMsg(dd));
      const response = await signAndBroadcastTx(messages);

      if (response) {
        // Set the new cert in storage
        if (newCert) {
          await updateSelectedCertificate(newCert);
        }

        setDeploySdl(null);

        deploymentLocalStorage.update(address, dd.deploymentId.dseq, {
          manifest: sdl,
          manifestVersion: dd.hash,
          name: deploymentName
        });
        router.replace(UrlService.newDeployment({ step: RouteStep.createLeases, dseq: dd.deploymentId.dseq }));

        analyticsService.track("create_deployment", {
          category: "deployments",
          label: "Create deployment in wizard"
        });

        if (sdl.includes(LOG_COLLECTOR_IMAGE)) {
          analyticsService.track("log_collector_deployed", { category: "deployments" });
        }
      } else {
        setIsCreatingDeployment(false);
      }
    } finally {
      setIsCreatingDeployment(false);
    }
  }

  const changeMode = (mode: "yaml" | "builder") => {
    if (mode === selectedSdlEditMode) return;

    if (mode === "yaml") {
      if (editedManifest) {
        setEditedManifest(editedManifest);
      }
    } else {
      const sdl = sdlBuilderRef.current?.getSdl();

      if (sdl) {
        setEditedManifest(sdl);
      }
    }

    setSelectedSdlEditMode(mode);
  };

  const syncSDLValidity: ComponentProps<typeof SDLEditor>["onValidate"] = async event => {
    setParsingError(null);
    setIsValidSdl(event.isValid);
  };

  return (
    <>
      <d.CustomNextSeo title="Create Deployment - Manifest Edit" url={`${domainName}${UrlService.newDeployment({ step: RouteStep.editDeployment })}`} />

      <div className="mb-2 pt-4">
        <div className="mb-2 flex flex-col items-end justify-between md:flex-row">
          <div className="w-full flex-grow">
            <d.Input value={deploymentName} onChange={ev => setDeploymentName(ev.target.value)} label="Name your deployment (optional)" />
          </div>

          <div className="flex w-full min-w-0 flex-shrink-0 items-center pt-2 md:w-auto md:pt-0">
            <d.CustomTooltip
              title={
                <p>
                  You may use the sample deployment file as-is or modify it for your own needs as described in the{" "}
                  <d.LinkTo onClick={ev => handleDocClick(ev, "https://akash.network/docs/getting-started/stack-definition-language/")}>
                    SDL (Stack Definition Language)
                  </d.LinkTo>{" "}
                  documentation. A typical modification would be to reference your own image instead of the demo app image.
                </p>
              }
            >
              <InfoCircle className="mr-4 text-sm text-muted-foreground md:ml-4" />
            </d.CustomTooltip>

            <div className="flex flex-grow items-center gap-2">
              <div className="flex-grow">
                <d.Button
                  variant="default"
                  disabled={settings.isBlockchainDown || isCreatingDeployment || !editedManifest}
                  onClick={() => handleCreateDeployment()}
                  className="w-full whitespace-nowrap sm:w-auto"
                  data-testid="create-deployment-btn"
                >
                  {isCreatingDeployment ? (
                    <d.Spinner size="small" />
                  ) : (
                    <>
                      Create Deployment{" "}
                      <span className="ml-2 flex items-center">
                        <ArrowRight fontSize="small" />
                      </span>
                    </>
                  )}
                </d.Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2 flex gap-2">
        {hasComponent("yml-editor") && (
          <div className="flex items-center">
            <d.Button
              variant={selectedSdlEditMode === "builder" ? "default" : "outline"}
              onClick={() => {
                changeMode("builder");
                analyticsService.track("builder_mode_btn_clk", "Amplitude");
              }}
              size="sm"
              className={cn("flex-grow sm:flex-grow-0", { "rounded-e-none": hasComponent("yml-editor") })}
              disabled={!!parsingError && selectedSdlEditMode === "yaml"}
            >
              Builder
            </d.Button>
            <d.Button
              variant={selectedSdlEditMode === "yaml" ? "default" : "outline"}
              color={selectedSdlEditMode === "yaml" ? "secondary" : "primary"}
              onClick={() => {
                changeMode("yaml");
                analyticsService.track("yml_mode_btn_clk", "Amplitude");
              }}
              size="sm"
              className="flex-grow rounded-s-none sm:flex-grow-0"
            >
              YAML
            </d.Button>
          </div>
        )}
        {hasComponent("yml-uploader") && !templateId && (
          <>
            <d.FileButton
              onFileSelect={onFileSelect}
              accept=".yml,.yaml,.txt"
              size="sm"
              variant="outline"
              className="flex-grow hover:bg-primary hover:text-white sm:flex-grow-0"
            >
              <Upload className="text-xs" />
              <span className="text-xs">Upload your SDL</span>
            </d.FileButton>
          </>
        )}
      </div>

      {parsingError && <d.Alert variant="warning">{parsingError}</d.Alert>}

      {hasComponent("yml-editor") && selectedSdlEditMode === "yaml" && (
        <d.ViewPanel stickToBottom className={cn({ ["-mx-4"]: smallScreen })}>
          <d.SDLEditor value={editedManifest || ""} onChange={handleTextChange} onValidate={syncSDLValidity} />
        </d.ViewPanel>
      )}
      {(hasComponent("ssh") || selectedSdlEditMode === "builder") && (
        <d.SdlBuilder
          sdlString={editedManifest}
          onValidate={syncSDLValidity}
          ref={sdlBuilderRef}
          setEditedManifest={setEditedManifest}
          setDeploymentName={setDeploymentName}
          deploymentName={deploymentName}
        />
      )}

      {isDepositingDeployment && (
        <d.DeploymentDepositModal
          handleCancel={() => setIsDepositingDeployment(false)}
          onDeploymentDeposit={onDeploymentDeposit}
          denom={sdlDenom}
          title="Confirm deployment creation?"
          infoText={
            <d.Alert className="mb-6 text-xs" variant="default">
              <d.DeploymentMinimumEscrowAlertText denom={sdlDenom} />
              <d.LinkTo onClick={ev => handleDocClick(ev, "https://akash.network/docs/getting-started/intro-to-akash/payments/#escrow-accounts")}>
                <strong>Learn more.</strong>
              </d.LinkTo>

            </d.Alert>
          }
          services={services}
        />
      )}
    </>
  );
};
