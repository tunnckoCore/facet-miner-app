"use client";

import { facetSepolia, walletL1FacetActions } from "@0xfacet/sdk/viem";
import {
  http,
  createWalletClient,
  fallback,
  formatEther,
  createPublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const RPCS = {
  1: ["https://eth.drpc.org", "https://1rpc.io/eth"],
  11155111: ["https://sepolia.drpc.org", "https://1rpc.io/sepolia"],
};

export async function createMiner(
  privkey: string | any, // can be privkey or walletclient
  chain = sepolia,
  rpcs = RPCS[chain.id],
) {
  const isPrivkey = typeof privkey === "string" && privkey.length > 62;
  const account = isPrivkey
    ? privateKeyToAccount(`0x${privkey.replace("0x", "")}`)
    : privkey;

  // @ts-expect-error bro shutup
  const net = chain.id === 1 ? "mainnet" : "sepolia";

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });
  const facetClient = createPublicClient({
    chain,
    transport: http(`https://${net}.facet.org`),
  });
  const wc = isPrivkey
    ? createWalletClient({
        account,
        chain,
        transport: fallback(rpcs.map((x) => http(x)).concat(http())),
      }).extend(walletL1FacetActions)
    : privkey;

  const walletClient = wc;

  return {
    publicClient,
    facetClient,
    walletClient,
    mine: async (calldata = `0x${"2".repeat(261_800)}`, acc = null) =>
      mineFCT(walletClient, isPrivkey ? account : acc, calldata),
  };
}

export function numfmt(x, delim = ",") {
  return x
    .split("")
    .reverse()
    .join("")
    .match(/.{1,3}/g)
    .map((z) => z.split("").reverse().join(""))
    .reverse()
    .join(delim);
}

export function fmtEther(bal: bigint, decimals = 5) {
  const paddedBalance = String(bal).padStart(18, "0");
  const fbal = formatEther(BigInt(paddedBalance));
  const [a, b = "0"] = fbal.split(".");
  const result = numfmt(a) + "." + b.slice(0, decimals);

  return result === "0.0"
    ? "0"
    : result.endsWith(".0")
      ? result.slice(0, -2)
      : result;
}

export function getRand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// async function mineFacet() {
//   return {
//     txHash: "0x123123123123" + Date.now(),
//     facetHash: "0x321321321321321",
//     fctMined: fmtEther(BigInt("446760831111234211234234"), 3),
//   };
// }

// export async function* mine(
//   signal,
//   calldata: `0x${string}`,
//   times = 1_000_000,
//   wc: any,
//   account: any,
// ) {
//   const data = calldata || `0x${"2".repeat(261_800)}`;

//   for (let i = 0; i <= times; i++) {
//     console.log({ i, signal });
//     if (signal?.aborted === true) {
//       break;
//     }

//     // const result = await mineFacet(wc, account, data);
//     const result = await mineFacet(i);

//     console.log({ res: result });

//     yield* result;
//   }
// }

// async function mineFacet(i) {
//   return "sasa-" + i;
// }

// 4,476,111.84
// ~20951 FCT per transaction, per 0.000002121299924744 Sepolia ETH, at 0.001002463 Gwei sepolia gas price
export async function mineFCT(
  wc: any,
  account: any,
  calldata = `0x${"2".repeat(261_800)}`,
) {
  const {
    l1TransactionHash,
    facetTransactionHash,
    fctMintAmount,
    // fctMintRate,
  } = await sendFacetTransaction(wc, {
    account,
    to: account?.address || account,
    data: calldata,
    // data: "0x",
    // extraData: calldata,
    value: 0n,
  });

  console.log("Minted amount:", fmtEther(fctMintAmount));
  console.log("Layer-1 Transaction Hash:", l1TransactionHash);
  console.log("FacetV2 Transaction Hash:", facetTransactionHash);

  return {
    fctMined: fmtEther(fctMintAmount),
    fctMintAmount,
    txHash: l1TransactionHash,
    facetHash: facetTransactionHash,
  };
}

import { maxUint256 } from "viem";
import {
  computeFacetTransactionHash,
  prepareFacetTransaction,
} from "@0xfacet/sdk/utils";
import { getFctMintRate } from "@0xfacet/sdk/viem";
import { publicActionsL2 } from "viem/op-stack";

export function createFacetPublicClient(chain) {
  // @ts-expect-erxror bro shutup
  const net = chain.id === 1 ? "mainnet" : "sepolia";

  return createPublicClient({
    chain,
    transport: http(`https://${net}.facet.org`),
  }).extend(publicActionsL2());
}

export const sendFacetTransaction = async (l1WalletClient, params) => {
  const selectedChain = params.chain || l1WalletClient.chain;
  const account =
    params.account?.address || params.account || l1WalletClient.account;

  if (
    // l1WalletClient.chain?.id !== 1 &&
    selectedChain?.id !== 11_155_111
  ) {
    throw new Error("Invalid L1 chain, currently only Sepolia (11155111)");
  }

  if (!account) {
    throw new Error(
      "No valid account provided when calling sendFacetTransaction",
    );
  }
  const facetPublicClient = createFacetPublicClient(
    l1WalletClient.chain || facetSepolia,
  );

  if (!facetPublicClient.chain) {
    throw new Error("L2 chain not configured");
  }

  const [estimateFeesPerGasRes, estimateGasRes, fctBalance, fctMintRate] =
    await Promise.all([
      facetPublicClient.estimateFeesPerGas({
        type: "eip1559",
        chain: facetPublicClient.chain,
      }),
      facetPublicClient.estimateGas({
        account,
        to: params.to,
        value: params.value,
        data: params.data,
        stateOverride: [
          {
            address: account?.address || account,
            balance: maxUint256,
          },
        ],
      }),
      facetPublicClient.getBalance({
        address: account?.address || account,
      }),
      getFctMintRate(l1WalletClient.chain.id),
    ]);

  if (!estimateFeesPerGasRes?.maxFeePerGas) {
    throw new Error("Max fee per gas estimate not found");
  }

  const { maxFeePerGas } = estimateFeesPerGasRes;
  const gasLimit = estimateGasRes;
  const { encodedTransaction, fctMintAmount } = await prepareFacetTransaction(
    facetPublicClient.chain.id,
    fctMintRate,
    { ...params, maxFeePerGas, gasLimit },
  );
  // Call estimateGas again but with an accurate future balance
  // This will allow it to correctly revert when necessary
  await facetPublicClient.estimateGas({
    account,
    to: params.to,
    value: params.value,
    data: params.data,
    stateOverride: [
      {
        address: account?.address || account,
        balance: fctBalance + fctMintAmount,
      },
    ],
  });

  const l1Transaction = {
    account,
    to: "0x00000000000000000000000000000000000face7",
    value: 0n,
    data: encodedTransaction,
    chain: l1WalletClient.chain,
  };
  const l1TransactionHash = await l1WalletClient.sendTransaction(l1Transaction);
  const facetTransactionHash = computeFacetTransactionHash(
    l1TransactionHash,
    account?.address || account,
    account?.address || account,
    params.to ?? "0x",
    params.value ?? 0n,
    params.data ?? "0x",
    gasLimit,
    maxFeePerGas,
    fctMintAmount,
  );
  return {
    l1TransactionHash,
    facetTransactionHash,
    fctMintAmount,
    fctMintRate,
  };
};
