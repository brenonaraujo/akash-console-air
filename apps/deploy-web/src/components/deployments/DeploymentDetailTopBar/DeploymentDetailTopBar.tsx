"use client";
import type { ReactNode } from "react";
import React from "react";
import { useState } from "react";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@akashnetwork/ui/components";
import { usePopup } from "@akashnetwork/ui/context";
import { Edit, MoreHoriz, NavArrowLeft, Refresh, Upload, XmarkSquare } from "iconoir-react";
import { useRouter } from "next/navigation";

import { useLocalNotes } from "@src/components/LocalNoteManager";
import { CustomDropdownLinkItem } from "@src/components/shared/CustomDropdownLinkItem";
import { useServices } from "@src/context/ServicesProvider";
import { useWallet } from "@src/context/WalletProvider";
import { useDeploymentMetrics } from "@src/hooks/useDeploymentMetrics";
import { useManagedDeploymentConfirm } from "@src/hooks/useManagedDeploymentConfirm";
import { usePreviousRoute } from "@src/hooks/usePreviousRoute";
import type { DeploymentDto, LeaseDto } from "@src/types/deployment";
import { TransactionMessageData } from "@src/utils/TransactionMessageData";
import { UrlService } from "@src/utils/urlUtils";
import { DeploymentDepositModal } from "../DeploymentDepositModal/DeploymentDepositModal";

export const DEPENDENCIES = {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  CustomDropdownLinkItem,
  DeploymentDepositModal,
  useServices,
  useLocalNotes,
  useWallet,
  useDeploymentMetrics,
  useManagedDeploymentConfirm,
  usePreviousRoute,
  usePopup,
  useRouter
};

type Props = {
  address: string;
  loadDeploymentDetail: () => void;
  removeLeases: () => void;
  onDeploymentClose: () => void;
  deployment: DeploymentDto;
  leases: LeaseDto[] | undefined | null;
  children?: ReactNode;
  dependencies?: typeof DEPENDENCIES;
};

export const DeploymentDetailTopBar: React.FunctionComponent<Props> = ({
  address,
  loadDeploymentDetail,
  removeLeases,
  onDeploymentClose,
  deployment,
  leases,
  dependencies: d = DEPENDENCIES
}) => {
  const { analyticsService } = d.useServices();
  const { changeDeploymentName, getDeploymentData, getDeploymentName } = d.useLocalNotes();
  const router = d.useRouter();
  const wallet = d.useWallet();
  const [isDepositingDeployment, setIsDepositingDeployment] = useState(false);
  const storageDeploymentData = getDeploymentData(deployment?.dseq);
  const deploymentName = getDeploymentName(deployment?.dseq);
  const previousRoute = d.usePreviousRoute();
  const { closeDeploymentConfirm } = d.useManagedDeploymentConfirm();

  function handleBackClick() {
    if (previousRoute) {
      router.back();
    } else {
      router.push(UrlService.deploymentList());
    }
  }

  const onCloseDeployment = async () => {
    const isConfirmed = await closeDeploymentConfirm([deployment.dseq]);

    if (!isConfirmed) {
      return;
    }

    const message = TransactionMessageData.getCloseDeploymentMsg(address, deployment.dseq);
    const response = await wallet.signAndBroadcastTx([message]);
    if (response) {
      onDeploymentClose();
      removeLeases();
      loadDeploymentDetail();

      analyticsService.track("close_deployment", {
        category: "deployments",
        label: "Close deployment in deployment detail"
      });
    }
  };

  function onChangeName() {
    changeDeploymentName(deployment.dseq);
  }

  const redeploy = () => {
    const url = UrlService.newDeployment({ redeploy: deployment.dseq });
    router.push(url);
  };

  const onDeploymentDeposit = async (deposit: number) => {
    setIsDepositingDeployment(false);
    const message = TransactionMessageData.getDepositDeploymentMsg(
      address,
      address,
      deployment.dseq,
      deposit,
      deployment.escrowAccount.state.funds[0]?.denom || ""
    );
    const response = await wallet.signAndBroadcastTx([message]);
    if (response) {
      loadDeploymentDetail();

      analyticsService.track("deployment_deposit", {
        category: "deployments",
        label: "Deposit deployment in deployment detail"
      });
    }

    return response;
  };

  return (
    <>
      <div className="flex items-center space-x-2 px-2 pb-2">
        <d.Button aria-label="back" onClick={handleBackClick} size="icon" variant="ghost">
          <NavArrowLeft />
        </d.Button>

        <h3 className="truncate text-2xl font-bold">{deploymentName ? deploymentName : "Deployment detail"}</h3>

        <d.Button aria-label="refresh" onClick={() => loadDeploymentDetail()} size="icon" variant="text">
          <Refresh />
        </d.Button>

        {deployment?.state === "active" && (
          <div className="flex items-center">
            <d.DropdownMenu modal={false}>
              <d.DropdownMenuTrigger asChild>
                <d.Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  aria-label="Deployment actions"
                  data-testid="deployment-detail-dropdown"
                >
                  <MoreHoriz />
                </d.Button>
              </d.DropdownMenuTrigger>
              <d.DropdownMenuContent align="end">
                <d.CustomDropdownLinkItem
                  onClick={() => {
                    onChangeName();
                    analyticsService.track("edit_name_btn_clk", "Amplitude");
                  }}
                  icon={<Edit fontSize="small" />}
                >
                  Edit Name
                </d.CustomDropdownLinkItem>
                {storageDeploymentData?.manifest && (
                  <d.CustomDropdownLinkItem
                    onClick={() => {
                      redeploy();
                      analyticsService.track("redeploy_btn_clk", "Amplitude");
                    }}
                    icon={<Upload fontSize="small" />}
                  >
                    Redeploy
                  </d.CustomDropdownLinkItem>
                )}
                <d.CustomDropdownLinkItem
                  onClick={() => {
                    onCloseDeployment();
                    analyticsService.track("close_deployment_btn_clk", "Amplitude");
                  }}
                  icon={<XmarkSquare fontSize="small" />}
                  aria-label="Close deployment"
                  data-testid="deployment-detail-close-button"
                >
                  Close
                </d.CustomDropdownLinkItem>
              </d.DropdownMenuContent>
            </d.DropdownMenu>
            <d.Button
              variant="default"
              className="ml-2 whitespace-nowrap"
              onClick={() => {
                setIsDepositingDeployment(true);
                analyticsService.track("deposit_deployment_btn_clk", "Amplitude");
              }}
              size="sm"
            >
              Add funds
            </d.Button>

          </div>
        )}

        {deployment?.state === "closed" && (
          <div className="flex items-center space-x-2">
            <d.Button
              onClick={() => {
                onChangeName();
                analyticsService.track("edit_name_btn_clk", "Amplitude");
              }}
              variant="default"
              className="whitespace-nowrap"
              color="secondary"
              size="sm"
            >
              <Edit fontSize="small" />
              &nbsp;Edit Name
            </d.Button>

            {storageDeploymentData?.manifest && (
              <d.Button
                onClick={() => {
                  redeploy();
                  analyticsService.track("redeploy_btn_clk", "Amplitude");
                }}
                variant="default"
                className="whitespace-nowrap"
                color="secondary"
                size="sm"
              >
                <Upload fontSize="small" />
                &nbsp;Redeploy
              </d.Button>
            )}
          </div>
        )}
      </div>

      {isDepositingDeployment && (
        <d.DeploymentDepositModal
          denom={deployment.escrowAccount.state.funds[0]?.denom || ""}
          disableMin
          handleCancel={() => setIsDepositingDeployment(false)}
          onDeploymentDeposit={onDeploymentDeposit}
        />
      )}
    </>
  );
};
