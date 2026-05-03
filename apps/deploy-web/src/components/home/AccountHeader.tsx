"use client";
import React from "react";
import { buttonVariants } from "@akashnetwork/ui/components";
import { cn } from "@akashnetwork/ui/utils";
import { Rocket } from "iconoir-react";
import Link from "next/link";

import { useServices } from "@src/context/ServicesProvider";

type Props = {
  onDeployClick: () => void;
  isBlockchainDown: boolean;
};

export const AccountHeader: React.FC<Props> = ({ onDeployClick, isBlockchainDown }) => {
  const { urlService } = useServices();

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold">Your account</h3>
      <div className="flex gap-4">
        <Link
          href={urlService.newDeployment()}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "flex items-center gap-2", isBlockchainDown && "pointer-events-none opacity-50")}
          onClick={onDeployClick}
          aria-disabled={isBlockchainDown}
        >
          <Rocket className="rotate-45" fontSize="small" />
          <span>Deploy</span>
        </Link>
      </div>
    </div>
  );
};
