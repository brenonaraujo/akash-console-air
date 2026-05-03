"use client";
import { useEffect, useState } from "react";
import { Button } from "@akashnetwork/ui/components";
import { Edit } from "iconoir-react";
import { useRouter } from "next/navigation";
import { NextSeo } from "next-seo";

import { LocalDataManager } from "@src/components/settings/LocalDataManager";
import { Fieldset } from "@src/components/shared/Fieldset";
import { LabelValue } from "@src/components/shared/LabelValue";
import { hasPersistedCosmosKitWallet } from "@src/context/CustomChainProvider/cosmosKitStorage";
import { useSettings } from "@src/context/SettingsProvider";
import { useWallet } from "@src/context/WalletProvider";
import networkStore from "@src/store/networkStore";
import Layout from "../layout/Layout";
import { CertificateList } from "./CertificateList";
import { ColorModeSelect } from "./ColorModeSelect";
import { SelectNetworkModal } from "./SelectNetworkModal";
import { SettingsForm } from "./SettingsForm";
import { SettingsLayout, SettingsTabs } from "./SettingsLayout";

export const SettingsContainer: React.FunctionComponent = () => {
  const { settings } = useSettings();
  const [isSelectingNetwork, setIsSelectingNetwork] = useState(false);
  const [hasObservedWalletActivity, setHasObservedWalletActivity] = useState(false);
  const selectedNetwork = networkStore.useSelectedNetwork();
  const wallet = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (wallet.isWalletLoading || wallet.isWalletConnected) {
      setHasObservedWalletActivity(true);
      return;
    }
    if (hasObservedWalletActivity || !hasPersistedCosmosKitWallet()) {
      router.push("/");
    }
  }, [wallet.isWalletLoading, wallet.isWalletConnected, hasObservedWalletActivity, router]);

  const onSelectNetworkModalClose = () => {
    setIsSelectingNetwork(false);
  };

  return (
    <Layout isUsingSettings>
      <NextSeo title="Settings" />

      <SettingsLayout page={SettingsTabs.GENERAL} title="Settings">
        {isSelectingNetwork && <SelectNetworkModal onClose={onSelectNetworkModalClose} />}
        <div className="grid-col-1 mb-6 grid gap-6 md:grid-cols-2">
          <Fieldset label="Network">
            <LabelValue
              value={
                <div className="inline-flex items-center">
                  <strong>{selectedNetwork.title}</strong>

                  <Button onClick={() => setIsSelectingNetwork(true)} size="icon" className="ml-4" variant="outline" aria-label="Select Network">
                    <Edit className="text-sm" />
                  </Button>
                </div>
              }
            />

            <SettingsForm />
          </Fieldset>

          <Fieldset label="General">
            <ColorModeSelect />
            <LocalDataManager />
          </Fieldset>

        </div>

        {!settings.isBlockchainDown && (
          <Fieldset label="Certificates" className="mb-4">
            <CertificateList />
          </Fieldset>
        )}
      </SettingsLayout>
    </Layout>
  );
};
