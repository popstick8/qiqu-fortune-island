import type { GameState, PlayerId, Tile, TileId } from "@monopoly/shared";

export interface PropertyFinanceResult {
  ok: boolean;
  message: string;
}

export function calculateMortgageValue(tile: Tile): number {
  return Math.round((tile.price ?? 0) * 0.5);
}

export function calculateMortgageRedeemCost(tile: Tile): number {
  return Math.ceil(calculateMortgageValue(tile) * 1.1);
}

function findOwnedProperty(gameState: GameState, playerId: PlayerId, tileId: TileId) {
  const player = gameState.players.find((item) => item.id === playerId);
  const tile = gameState.tiles.find((item) => item.id === tileId);
  const property = gameState.properties[tileId];
  if (!player || player.bankrupt) {
    return { error: "玩家不存在或已破产。" };
  }
  if (!tile || tile.type !== "property" || !property) {
    return { error: "只有地产可以抵押。" };
  }
  if (property.ownerId !== playerId) {
    return { error: "只能操作自己拥有的地产。" };
  }
  return { player, tile, property };
}

export function mortgageProperty(gameState: GameState, playerId: PlayerId, tileId: TileId): PropertyFinanceResult {
  const found = findOwnedProperty(gameState, playerId, tileId);
  if ("error" in found) {
    return { ok: false, message: found.error };
  }
  if (found.property.isMortgaged) {
    return { ok: false, message: "该地产已经抵押。" };
  }

  const mortgageValue = calculateMortgageValue(found.tile);
  const redeemCost = calculateMortgageRedeemCost(found.tile);
  found.property.isMortgaged = true;
  found.property.mortgageValue = mortgageValue;
  found.property.mortgageRedeemCost = redeemCost;
  found.player.cash += mortgageValue;
  if (found.player.cash >= 0) {
    found.player.insolventUntil = undefined;
  }

  return {
    ok: true,
    message: `${found.player.nickname} 抵押了 ${found.tile.name}，获得 ${mortgageValue} 金币。`
  };
}

export function redeemMortgage(gameState: GameState, playerId: PlayerId, tileId: TileId): PropertyFinanceResult {
  const found = findOwnedProperty(gameState, playerId, tileId);
  if ("error" in found) {
    return { ok: false, message: found.error };
  }
  if (!found.property.isMortgaged) {
    return { ok: false, message: "该地产尚未抵押。" };
  }
  if (found.property.mortgageFreezeTurns && found.property.mortgageFreezeTurns > 0) {
    return { ok: false, message: "该地产正处于抵押冻结状态，暂时不能赎回。" };
  }

  const discountIndex = found.player.statusEffects.findIndex((effect) => effect.type === "interestFreeRedeem" && effect.turns > 0);
  const redeemCost =
    discountIndex >= 0
      ? found.property.mortgageValue ?? calculateMortgageValue(found.tile)
      : found.property.mortgageRedeemCost ?? calculateMortgageRedeemCost(found.tile);
  if (found.player.cash < redeemCost) {
    return { ok: false, message: "现金不足，无法赎回该地产。" };
  }

  if (discountIndex >= 0) {
    found.player.statusEffects.splice(discountIndex, 1);
  }
  found.player.cash -= redeemCost;
  found.property.isMortgaged = false;
  found.property.mortgageValue = undefined;
  found.property.mortgageRedeemCost = undefined;

  return {
    ok: true,
    message: `${found.player.nickname} 花费 ${redeemCost} 金币赎回了 ${found.tile.name}。`
  };
}
