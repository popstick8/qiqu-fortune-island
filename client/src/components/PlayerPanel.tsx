import type { GameState } from "@monopoly/shared";
import { computeAsset, money } from "../game/economy";
import { useI18n } from "../i18n";
import { AvatarPortrait, getAvatarDefinition } from "./AvatarPortrait";

interface PlayerPanelProps {
  game: GameState;
  localPlayerId: string | null;
  hideLocal?: boolean;
}

export function PlayerPanel({ game, localPlayerId, hideLocal = false }: PlayerPanelProps) {
  const currentPlayerId = game.turnOrder[game.currentTurnIndex] ?? null;
  const { t, tileName } = useI18n();
  const players = hideLocal && localPlayerId
    ? game.players.filter((player) => player.id !== localPlayerId)
    : game.players;

  return (
    <aside className="sidePanel">
      <div className="panelHeader">
        <span className="eyebrow">{t("players")}</span>
        <strong>
          {game.players.filter((player) => !player.bankrupt).length} {t("active")}
        </strong>
      </div>
      <div className="playerList">
        {players.map((player) => {
          const tile = game.tiles.find((item) => item.id === player.currentTileId) ?? game.tiles[player.position];
          return (
            <article
              key={player.id}
              className={`playerCard ${player.id === currentPlayerId ? "active" : ""} ${
                player.id === localPlayerId ? "mine" : ""
              } ${player.bankrupt ? "bankrupt" : ""}`}
            >
              <div className="playerTitle">
                <span className="avatarDot" style={{ backgroundColor: player.color }}>
                  <AvatarPortrait avatarId={player.selectedAvatarId} fallbackColor={player.color} size="small" />
                </span>
                <div>
                  <strong>{player.nickname}</strong>
                  <small>{player.connected ? t("online") : t("offline")} · {getAvatarDefinition(player.selectedAvatarId).nameZh}</small>
                </div>
              </div>
              <dl>
                <div>
                  <dt>{t("cash")}</dt>
                  <dd>{money(player.cash)}</dd>
                </div>
                <div>
                  <dt>{t("asset")}</dt>
                  <dd>{money(computeAsset(game, player))}</dd>
                </div>
                <div>
                  <dt>{t("tile")}</dt>
                  <dd>{tile ? tileName(tile) : "-"}</dd>
                </div>
                <div>
                  <dt>{t("lots")}</dt>
                  <dd>{player.properties.length}</dd>
                </div>
                <div>
                  <dt>彩券</dt>
                  <dd>🎟 {player.tickets}</dd>
                </div>
                <div>
                  <dt>技能</dt>
                  <dd>{player.skillCards.length}/{player.maxSkillCards}</dd>
                </div>
              </dl>
              <div className="stockHoldings">
                {Object.entries(player.stocks).map(([symbol, count]) => (
                  <span key={symbol}>
                    {game.stocks[symbol as keyof typeof game.stocks]?.name ?? "股票"}: {count}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
