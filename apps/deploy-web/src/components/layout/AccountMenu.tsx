"use client";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@akashnetwork/ui/components";
import { LogOut, Settings, User } from "iconoir-react";
import { useRouter } from "next/navigation";

import { useWallet } from "@src/context/WalletProvider";
import { useServices } from "@src/context/ServicesProvider";
import { CustomDropdownLinkItem } from "../shared/CustomDropdownLinkItem";

export function AccountMenu() {
  const { address, isWalletConnected, logout } = useWallet();
  const router = useRouter();
  const { urlService } = useServices();

  const shortAddress = address ? `${address.slice(0, 10)}...${address.slice(-4)}` : "";

  return (
    <React.Fragment>
      <div className="flex items-center text-center">
        <div className="pl-2 pr-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-9 w-9 cursor-pointer bg-accent" aria-label="Account menu">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-transparent">
                    <User />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="flex w-full items-center justify-center">
                {isWalletConnected && address ? (
                  <div className="w-full">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">{shortAddress}</div>
                    <DropdownMenuSeparator />
                    <CustomDropdownLinkItem onClick={() => router.push(urlService.settings())} icon={<Settings />}>
                      Settings
                    </CustomDropdownLinkItem>
                    <DropdownMenuSeparator />
                    <CustomDropdownLinkItem onClick={() => logout()} icon={<LogOut />}>
                      Disconnect
                    </CustomDropdownLinkItem>
                  </div>
                ) : (
                  <div className="w-full px-2 py-1.5 text-center text-sm text-muted-foreground">No wallet connected</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </React.Fragment>
  );
}
