"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createMiner, fmtEther, getRand } from "@/lib/miner";
import Link from "next/link";
import { stringify, toHex } from "viem";
import { Loader2 } from "lucide-react";
import { privateKeyToAccount } from "viem/accounts";
import { PasswordInput } from "@/components/PasswordInput";
import { mainnet, sepolia } from "viem/chains";
import SwitchWithState from "@/components/NetworkSwitcher";

export function MinerCard() {
  const [loading, setLoading] = useState(false);
  const [privkey, setPrivkey] = useState<string>("");
  const [mining, setMining] = useState<boolean>(false);
  const [miner, setMiner] = useState<any>(null);
  const [account, setAccount] = useState<any>();
  const [network, setNetwork] = useState<any>(sepolia);
  const [mined, setMined] = useState<any>([]);
  const [ethBalance, setEthBalance] = useState("0");
  const [fctBalance, setFctBalance] = useState("0");
  const [errorState, setErrorState] = useState<any>();

  useEffect(() => {
    if (!privkey) return;

    main();

    async function main() {
      try {
        const _miner = createMiner(privkey, network as any);

        const account = privateKeyToAccount(`0x${privkey.replace("0x", "")}`);
        const ethBalance = await _miner.publicClient.getBalance({
          address: account.address,
        });
        const fctBalance = await _miner.facetClient.getBalance({
          address: account.address,
        });
        const savedResults = localStorage.getItem("results_" + account.address);

        setAccount(account);
        setMiner(_miner);
        setEthBalance(fmtEther(ethBalance));
        setFctBalance(fmtEther(fctBalance));
        setMined(JSON.parse(savedResults || "[]"));
      } catch (err: any) {
        setErrorState({
          title: "Error",
          body: err.message || "Failure in private key loading",
        });
        return;
      }

      setErrorState(null);
    }
  }, [privkey, network]);

  useEffect(() => {
    if (mining) {
      setTimeout(() => asyncFn(), 500);
    }

    async function asyncFn() {
      if (!mining || !account) {
        return;
      }

      let result;

      try {
        result = await miner.mine(
          // toHex("enciphered".repeat(getRand(100, 300))),
          // `0x${"2".repeat(101_800)}`,
          toHex("enciphered".repeat(getRand(100, 300))),
        );
      } catch (err: any) {
        console.error("Failure:", err);
        setErrorState({
          title: "Error",
          body: "Probably not enough funds, refund the wallet.",
        });
        setMining(false);
        return;
      }

      console.log("res:", result);

      setErrorState(null);
      setMined((prev) => {
        const newState = [result, ...prev];
        const stateJson = stringify(newState);

        localStorage.setItem("results_" + account.address, stateJson);

        return newState;
      });
    }
  }, [account, mined, mining, miner]);

  const getBalance = async (pub) => {
    if (!miner && !privkey) return;

    setLoading(true);
    const balance = await (
      pub ? miner.publicClient : miner.facetClient
    ).getBalance({
      address: account.address,
    });
    setLoading(false);

    (pub ? setEthBalance : setFctBalance)(fmtEther(balance));
  };

  const toggleNetwork = async (state: boolean) => {
    if (!privkey) return;

    if (state) {
      setNetwork(mainnet);
      setMiner(createMiner(privkey, mainnet as any));
    } else {
      setNetwork(sepolia);
      setMiner(createMiner(privkey));
    }
  };

  return (
    <Card className="w-[450px]">
      <CardHeader>
        <CardTitle>Facet FCT Miner</CardTitle>
        <CardDescription>
          <Link
            target="_blank"
            className="text-blue-500 external"
            href="https://docs.facet.org"
          >
            Facet v2
          </Link>{" "}
          introduces mining for its FCT tokens. Load up a private key, and start
          mining without headaches.{" "}
          <strong>
            The private key is not stored anywhere, you can verify that in the
            open source{" "}
            <Link
              target="_blank"
              className="external text-blue-500"
              href="https://github.com/tunnckocore/facet-miner-app"
            >
              code here
            </Link>
          </strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5 gap-2">
              <Label htmlFor="privkey">Private Key</Label>
              <PasswordInput
                id="privkey"
                placeholder="Miner private key"
                value={privkey}
                onChange={(e: any) => setPrivkey(e.target.value)}
              />
              {privkey && account && (
                <>
                  <Label htmlFor="account">Account Address</Label>
                  <Input id="account" value={account.address} disabled />
                </>
              )}

              {privkey && (
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    disabled={mining || loading || !account}
                    onClick={() => getBalance(true)}
                  >
                    {ethBalance} ETH
                  </Button>

                  <Button
                    variant="outline"
                    disabled={mining || loading || !account}
                    onClick={() => getBalance(false)}
                  >
                    {fctBalance} FCT
                  </Button>
                </div>
              )}

              {privkey && errorState && errorState != null && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{errorState.title}</AlertTitle>
                  <AlertDescription>{errorState.body}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="destructive"
          disabled={mining === false}
          onClick={() => setMining(false)}
        >
          Stop
        </Button>

        <div>
          <SwitchWithState
            disabled
            defaultState={false}
            onLabel="Mainnet"
            offLabel="Sepolia"
            onToggle={toggleNetwork}
          />
        </div>

        {mining === true && privkey && (
          <Button disabled>
            <Loader2 className="animate-spin" /> Mining...
          </Button>
        )}
        {mining === false && (
          <Button
            onClick={() => setMining(true)}
            disabled={loading || !Boolean(privkey)}
          >
            Start Mining
          </Button>
        )}
      </CardFooter>

      {privkey && mined.length > 0 && (
        <CardFooter>
          <ScrollArea className="h-52 w-full px-3">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <div className="text-ellipsis">Facet Transaction</div>
                <div>Mined Amount</div>
                <div className="text-ellipsis">L1 Transaction</div>
              </div>

              {mined.map(
                ({
                  fctMined,
                  facetHash,
                  txHash,
                }: {
                  fctMined: string;
                  facetHash: `0x${string}`;
                  txHash: `0x${string}`;
                }) => {
                  return (
                    <div key={txHash} className="flex justify-between">
                      <div>
                        <Link
                          target="_blank"
                          className="text-blue-500 external"
                          href={`https://${network.id === 1 ? "" : "sepolia."}explorer.facet.org/tx/${facetHash}`}
                        >
                          {facetHash.slice(0, 6) + "..." + facetHash.slice(-4)}
                        </Link>
                      </div>
                      <div>{fctMined}</div>
                      <div>
                        <Link
                          target="_blank"
                          className="text-blue-500 external"
                          href={`https://${network.id === 1 ? "" : "sepolia."}etherscan.io/tx/${txHash}`}
                        >
                          {txHash.slice(0, 6) + "..." + txHash.slice(-4)}
                        </Link>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </ScrollArea>
        </CardFooter>
      )}
    </Card>
  );
}
