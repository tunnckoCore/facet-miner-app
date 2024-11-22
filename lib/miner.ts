import { walletL1FacetActions } from "@0xfacet/sdk/viem";
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

export function createMiner(
  privkey: string,
  chain = sepolia,
  rpcs = RPCS[chain.id],
) {
  const account = privateKeyToAccount(`0x${privkey.replace("0x", "")}`);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });
  const facetClient = createPublicClient({
    chain: sepolia,
    transport: http("https://sepolia.facet.org"),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: fallback(rpcs.map((x) => http(x)).concat(http())),
  }).extend(walletL1FacetActions);

  return {
    publicClient,
    facetClient,
    walletClient,
    mine: async (calldata = `0x${"2".repeat(261_800)}`) =>
      mineFCT(walletClient, account, calldata),
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
  } = await wc.sendFacetTransaction({
    to: account.address || account,
    data: calldata,
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

// async function run() {
//   while (true) {
//     console.log("Mining...");
//     await mineFCT();
//     await Bun.sleep(5000);
//   }
// }

// // run();
