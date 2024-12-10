// import Image from "next/image";

import { MinerCard } from "@/components/MinerCard";

export default async function Home() {
  return (
    <div className="mx-auto flex items-center justify-center w-full min-h-screen">
      <MinerCard />
    </div>
  );
}
