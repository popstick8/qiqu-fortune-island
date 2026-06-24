import type { GameState, PlayerId, TileId } from "@monopoly/shared";

export interface JunctionDecision {
  nextTileId: TileId;
  directionLabel: string;
  reason: string;
}

export function chooseRandomDirectionAtJunction(
  gameState: GameState,
  playerId: PlayerId,
  currentTileId: TileId
): JunctionDecision {
  const player = gameState.players.find((item) => item.id === playerId);
  const tile = gameState.tiles.find((item) => item.id === currentTileId);
  const nextIds = tile?.next ?? [];
  if (!player || !tile || nextIds.length === 0) {
    return { nextTileId: currentTileId, directionLabel: "原地等待", reason: "没有可用道路。" };
  }
  if (nextIds.length === 1) {
    const nextTileId = nextIds[0] ?? currentTileId;
    return {
      nextTileId,
      directionLabel: tile.directionLabels?.[nextTileId] ?? "沿道路前进",
      reason: "只有一个可用方向。"
    };
  }

  const withoutReturn = nextIds.filter((tileId) => tileId !== player.lastTileId);
  const candidates = withoutReturn.length > 0 ? withoutReturn : nextIds;
  const forceOuterIndex = player.statusEffects.findIndex((effect) => effect.type === "forceOuterRoute" && effect.turns > 0);
  const forceInnerIndex = player.statusEffects.findIndex((effect) => effect.type === "forceInnerRoute" && effect.turns > 0);
  if (forceOuterIndex >= 0 || forceInnerIndex >= 0) {
    const forcedType = forceOuterIndex >= 0 ? "outer" : "inner";
    const forced = candidates.find((tileId) => gameState.tiles.find((item) => item.id === tileId)?.routeType === forcedType);
    if (forced) {
      player.statusEffects.splice(forceOuterIndex >= 0 ? forceOuterIndex : forceInnerIndex, 1);
      return {
        nextTileId: forced,
        directionLabel: tile.directionLabels?.[forced] ?? (forcedType === "outer" ? "强制进入外圈" : "强制进入内圈"),
        reason: forcedType === "outer" ? "绕路牌指定了外圈方向。" : "钻巷牌指定了内圈方向。"
      };
    }
  }
  const blessingIndex = player.statusEffects.findIndex((effect) => effect.type === "junctionBlessing" && effect.turns > 0);
  const interferenceIndex = player.statusEffects.findIndex((effect) => effect.type === "junctionInterference" && effect.turns > 0);
  const biasType = blessingIndex >= 0 ? "good" : interferenceIndex >= 0 ? "bad" : "none";
  if (blessingIndex >= 0) {
    player.statusEffects.splice(blessingIndex, 1);
  } else if (interferenceIndex >= 0) {
    player.statusEffects.splice(interferenceIndex, 1);
  }

  const weightedCandidates = candidates.flatMap((tileId) => {
    const target = gameState.tiles.find((item) => item.id === tileId);
    const good = target && ["chance", "bank", "skillShop", "start", "stock", "property"].includes(target.type);
    const bad = target && ["misfortune", "tax"].includes(target.type);
    const weight = biasType === "good" && good ? 4 : biasType === "bad" && bad ? 4 : 1;
    return Array.from({ length: weight }, () => tileId);
  });
  const nextTileId =
    weightedCandidates[Math.floor(Math.random() * weightedCandidates.length)]
    ?? candidates[0]
    ?? currentTileId;
  return {
    nextTileId,
    directionLabel: tile.directionLabels?.[nextTileId] ?? "系统随机方向",
    reason:
      biasType === "good"
        ? "路口祝福影响了方向选择。"
        : biasType === "bad"
          ? "路口干扰影响了方向选择。"
          : withoutReturn.length > 0
            ? "系统等权随机决定方向，并避开原路返回。"
            : "没有其他道路，只能原路返回。"
  };
}
