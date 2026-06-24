import { useMemo, useState } from "react";
import type { GameState, SkillCard, StockId, Tile, UseSkillPayload } from "@monopoly/shared";
import { socket } from "../socket/socket";

interface SkillCardPanelProps {
  game: GameState;
  playerId: string | null;
}

const targetTileTypes = new Set(["start", "bank", "stock", "skillShop", "safe_landing", "plaza"]);
const targetLabels: Record<string, string> = {
  self: "自己",
  player: "对手",
  tile: "地点",
  property: "地产",
  stock: "股票",
  propertyGroup: "套装",
  none: "无需目标"
};

function actionLabel(card: SkillCard): string {
  if (card.code === "remoteDice") {
    return "设定";
  }
  if (card.target === "player") {
    return "使用";
  }
  if (card.target === "tile") {
    return "跳跃";
  }
  if (card.target === "property") {
    return "强化";
  }
  return "使用";
}

export function SkillCardPanel({ game, playerId }: SkillCardPanelProps) {
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [targetTileId, setTargetTileId] = useState("");
  const [stockId, setStockId] = useState("");
  const [diceValue, setDiceValue] = useState(6);
  const me = game.players.find((player) => player.id === playerId) ?? null;
  const rivals = game.players.filter((player) => player.id !== playerId && !player.bankrupt);
  const currentPlayerId = game.turnOrder[game.currentTurnIndex] ?? null;
  const isMyTurn = Boolean(playerId && currentPlayerId === playerId && game.status === "playing");

  const teleportTiles = useMemo(
    () => game.tiles.filter((tile) => targetTileTypes.has(tile.type)),
    [game.tiles]
  );
  const ownedTiles = useMemo<Tile[]>(
    () => (me ? me.properties.map((tileId) => game.tiles.find((tile) => tile.id === tileId)).filter((tile): tile is Tile => Boolean(tile)) : []),
    [game.tiles, me]
  );
  const rivalPropertyTiles = useMemo<Tile[]>(
    () =>
      game.tiles.filter((tile) => {
        const property = game.properties[tile.id];
        return tile.type === "property" && property?.ownerId && property.ownerId !== playerId;
      }),
    [game.properties, game.tiles, playerId]
  );
  const allPropertyTiles = useMemo<Tile[]>(
    () => [...ownedTiles, ...rivalPropertyTiles],
    [ownedTiles, rivalPropertyTiles]
  );
  const stockIds = Object.keys(game.stocks);

  if (!me) {
    return null;
  }

  function useCard(card: SkillCard) {
    const payload: UseSkillPayload = {
      skillId: card.id
    };
    if (card.code === "remoteDice") {
      payload.value = diceValue;
    }
    if (card.target === "player") {
      const nextTargetPlayerId = targetPlayerId || rivals[0]?.id;
      if (nextTargetPlayerId) {
        payload.targetPlayerId = nextTargetPlayerId;
      }
    }
    if (card.target === "tile") {
      const nextTargetTileId = targetTileId || teleportTiles[0]?.id;
      if (nextTargetTileId) {
        payload.targetTileId = nextTargetTileId;
      }
    }
    if (card.target === "property") {
      const propertyPool = card.type === "attack" ? rivalPropertyTiles : ownedTiles;
      const nextTargetTileId = targetTileId || propertyPool[0]?.id || allPropertyTiles[0]?.id;
      if (nextTargetTileId) {
        payload.targetTileId = nextTargetTileId;
      }
    }
    if ((card.targetMode ?? card.target) === "stock") {
      payload.stockId = (stockId || stockIds[0]) as StockId;
    }
    socket.emit("useSkillCard", payload);
  }

  function recycleCard(card: SkillCard) {
    if (!window.confirm(`确定回收【${card.displayName ?? card.name}】并获得 ${card.costTickets} 彩券吗？`)) {
      return;
    }
    socket.emit("recycleSkillCard", { skillId: card.id });
  }

  return (
    <section className="skillPanel">
      <div className="panelHeader">
        <span className="eyebrow">技能卡</span>
        <strong>{me.skillCards.length}/{me.maxSkillCards}</strong>
      </div>
      <div className="ticketBadge">🎟 {me.tickets} 彩券</div>
      <div className="skillControls">
        <label>
          骰子
          <select value={diceValue} onChange={(event) => setDiceValue(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          对手
          <select value={targetPlayerId} onChange={(event) => setTargetPlayerId(event.target.value)}>
            <option value="">自动</option>
            {rivals.map((player) => (
              <option key={player.id} value={player.id}>{player.nickname}</option>
            ))}
          </select>
        </label>
        <label>
          地点
          <select value={targetTileId} onChange={(event) => setTargetTileId(event.target.value)}>
            <option value="">自动</option>
            {teleportTiles.map((tile) => (
              <option key={tile.id} value={tile.id}>{tile.name}</option>
            ))}
            {ownedTiles.map((tile) => (
              <option key={`owned-${tile.id}`} value={tile.id}>地产：{tile.name}</option>
            ))}
            {rivalPropertyTiles.map((tile) => (
              <option key={`rival-${tile.id}`} value={tile.id}>对手地产：{tile.name}</option>
            ))}
          </select>
        </label>
        <label>
          股票
          <select value={stockId} onChange={(event) => setStockId(event.target.value)}>
            <option value="">自动</option>
            {stockIds.map((id) => (
              <option key={id} value={id}>{game.stocks[id as keyof typeof game.stocks]?.name ?? id}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="skillCardList">
        {me.skillCards.length === 0 && <p className="emptySkill">还没有技能卡，路过技能小铺可用彩券购买。</p>}
        {me.skillCards.map((card) => (
          <article key={card.id} className={`skillCard skill-${card.code} rarity-${card.rarity ?? "common"}`}>
            <strong>{card.displayName ?? card.name}</strong>
            <p>{card.description}</p>
            <small>
              {card.costTickets} 彩券 · 目标：{targetLabels[card.targetMode ?? card.target] ?? "自己"}
              {card.range ? ` · 范围 ${card.range} 格` : ""}
            </small>
            <div className="skillCardActions">
              <button disabled={!isMyTurn} onClick={() => useCard(card)}>
                {actionLabel(card)}
              </button>
              <button
                className="secondaryButton recycleSkillButton"
                disabled={game.status !== "playing" || me.bankrupt}
                onClick={() => recycleCard(card)}
              >
                回收 +{card.costTickets}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
