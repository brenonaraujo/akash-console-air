"use client";
import { FormattedNumber } from "react-intl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Spinner } from "@akashnetwork/ui/components";
import { cn } from "@akashnetwork/ui/utils";
import { NavArrowDown, Wallet } from "iconoir-react";

import { useWallet } from "@src/context/WalletProvider";
import { getSplitText } from "@src/hooks/useShortText";
import { useWalletBalance } from "@src/hooks/useWalletBalance";
import { CustodialWalletPopup } from "../wallet/CustodialWalletPopup/CustodialWalletPopup";
import { WalletConnectionButtons } from "../wallet/WalletConnectionButtons";

export function WalletStatus() {
  const { walletName, isWalletLoaded, isWalletConnected, isWalletLoading } = useWallet();
  const { balance: walletBalance, isLoading: isWalletBalanceLoading } = useWalletBalance();
  const isLoadingBalance = isWalletBalanceLoading && !walletBalance;
  const isInit = isWalletLoaded && !isWalletLoading && !isLoadingBalance;

  return (
    <>
      {isInit ? (
        isWalletConnected ? (
          <div className="flex w-full items-center">
            <div className="w-full py-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <div
                    className={cn(
                      "flex cursor-pointer items-center justify-center space-x-2 rounded-md border bg-accent px-4 py-2 text-sm hover:bg-accent/80 [&_*]:cursor-pointer"
                    )}
                  >
                    <div className="flex items-center space-x-2" aria-label="Connected wallet name and balance">
                      <Wallet className="text-xs" />
                      {walletName?.length > 20 ? (
                        <span className="text-xs">{getSplitText(walletName, 4, 4)}</span>
                      ) : (
                        <span className="text-xs">{walletName}</span>
                      )}
                    </div>

                    {walletBalance && <div className="text-muted-foreground">|</div>}

                    <div className="text-xs">
                      {walletBalance && (
                        <FormattedNumber
                          value={walletBalance.totalUsd}
                          // eslint-disable-next-line react/style-prop-object
                          style="currency"
                          currency="USD"
                        />
                      )}
                    </div>

                    <div>
                      <NavArrowDown className="text-xs" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div>
                    <CustodialWalletPopup walletBalance={walletBalance} />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <WalletConnectionButtons className="w-full justify-center" connectWalletButtonClassName="w-full md:w-auto" />
        )
      ) : (
        <div className="flex items-center justify-center p-4">
          <Spinner size="medium" />
        </div>
      )}
    </>
  );
}
