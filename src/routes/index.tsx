import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/math/game";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Game />;
}
