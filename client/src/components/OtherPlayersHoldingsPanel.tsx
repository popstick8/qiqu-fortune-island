import type { GameState } from "@monopoly/shared";
import { money } from "../game/economy";

interface OtherPlayersHoldingsPanelProps {
  game: GameState;
  playerId: string | null;
}

export function OtherPlayersHoldingsPanel({ game, playerId }: OtherPlayersHoldingsPanelProps) {
  const otherPlayers = game.players.filter((player) => player.id !== playerId);

  return (
    <>
      <h3>其他玩家持仓</h3>
      <div className="otherHoldings">
        {otherPlayers.map((player) => (
          <article key={player.id}>
            <strong>{player.nickname}</strong>
            <span>总市值 {money(player.stockAccount.totalMarketValue)}</span>
            <em className={player.stockAccount.totalUnrealizedProfit >= 0 ? "up" : "down"}>
              估算盈亏 {money(player.stockAccount.totalUnrealizedProfit)}
            </em>
          </article>
        ))}
      </div>
    </>
  );
}
