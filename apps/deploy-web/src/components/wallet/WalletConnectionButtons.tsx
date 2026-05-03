"use client";
import React from "react";
import { cn } from "@akashnetwork/ui/utils";

import { ConnectWalletButton } from "./ConnectWalletButton";

interface WalletConnectionButtonsProps {
  className?: string;
  connectWalletButtonClassName?: string;
}

export const WalletConnectionButtons: React.FC<WalletConnectionButtonsProps> = ({
  className,
  connectWalletButtonClassName
}) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ConnectWalletButton className={connectWalletButtonClassName} />
    </div>
  );
};
