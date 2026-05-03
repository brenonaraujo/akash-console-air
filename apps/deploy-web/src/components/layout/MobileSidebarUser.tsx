"use client";
import React from "react";
import { Separator } from "@akashnetwork/ui/components";

import { WalletStatus } from "./WalletStatus";

export const MobileSidebarUser: React.FunctionComponent = () => {
  return (
    <ul className="w-full overflow-hidden border-0 p-0">
      <div className="flex w-full items-center justify-center p-2">
        <WalletStatus />
      </div>

      <Separator className="mb-4" />
    </ul>
  );
};
