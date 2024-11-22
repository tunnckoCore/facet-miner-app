// async function* mine(
//   stop: boolean,
//   calldata?: `0x${string}`,
//   times = 1_000_000,
//   wc?: any,
//   account?: any,
// ) {
//   const data = calldata || `0x${"2".repeat(261_800)}`;

import { formatEther, formatUnits } from "viem";

//   console.log({ stop });
//   for (let i = 0; i <= times; i++) {
//     console.log("mining..", i);

//     if (stop === false) {
//       break;
//     }

//     const result = await mineFCT(wc, account, data);

//     // console.log("res:", result);
//     yield result;
//   }
// }

// async function mineFCT(a = "", b = "", c = "") {
//   return "sasa" + a + b + c;
// }

// let mining = true;

// async function run() {
//   for await (const res of mine(mining, "0x123")) {
//     console.log(res);
//   }
// }

// run();

// setTimeout(() => {
//   mining = false;
// }, 500);

const balance1 = BigInt("3967608390529575465");
const balance2 = BigInt("4467608311111");

function numfmt(x, delim = ",") {
  return x
    .split("")
    .reverse()
    .join("")
    .match(/.{1,3}/g)
    .map((z) => z.split("").reverse().join(""))
    .reverse()
    .join(delim);
}

function fmtEther(bal: bigint, decimals = 5) {
  const paddedBalance = String(bal).padStart(18, "0");
  const fbal = formatEther(BigInt(paddedBalance));
  const [a, b] = fbal.split(".");

  return numfmt(a) + "." + b.slice(0, decimals);
}

console.log(fmtEther(balance1));
console.log(fmtEther(balance2));
