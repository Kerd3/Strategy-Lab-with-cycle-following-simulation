import { connection } from "next/server";
import { createGame } from "../lib/gameLogic.js";
import Game from "./game";

export default async function HomePage() {
  // Each request gets a fresh puzzle, and the same serializable state is passed
  // to the Client Component so its first render matches the server HTML.
  await connection();
  const initialGame = createGame();

  return <Game initialGame={initialGame} />;
}
