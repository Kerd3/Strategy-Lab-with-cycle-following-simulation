import { connection } from "next/server";
import { createPermutation } from "../../lib/gameLogic.js";
import StrategyLab from "./strategy-lab";

export const metadata = {
  title: "Strategy Lab — The Box Ward",
  description:
    "Compare random search with the cycle-following strategy through simulations of the 100 Prisoners and 100 Boxes puzzle.",
};

export default async function StrategyLabPage() {
  await connection();
  const initialContents = createPermutation();
  return <StrategyLab initialContents={initialContents} />;
}
