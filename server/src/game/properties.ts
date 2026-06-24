import type { GameState, PlayerId, PropertyGroup, PropertyState, TileId } from "@monopoly/shared";
import { MAX_PROPERTY_LEVEL } from "./economy";

export interface PropertyGroupProgress {
  group: PropertyGroup;
  owned: number;
  total: number;
  complete: boolean;
}

function levelMultiplier(property: PropertyState): number {
  const fallback = [1, 2.3, 5, 10];
  return fallback[Math.max(0, property.level - 1)] ?? fallback[fallback.length - 1] ?? 1;
}

export function checkPropertyGroupCompletion(gameState: GameState, groupId: string, playerId: PlayerId): boolean {
  const group = gameState.propertyGroups[groupId];
  if (!group) {
    return false;
  }
  return group.tileIds.every((tileId) => {
    const property = gameState.properties[tileId];
    return property?.ownerId === playerId && !property.isMortgaged;
  });
}

export function getPlayerPropertyGroupProgress(gameState: GameState, playerId: PlayerId): PropertyGroupProgress[] {
  return Object.values(gameState.propertyGroups).map((group) => {
    const owned = group.tileIds.filter((tileId) => {
      const property = gameState.properties[tileId];
      return property?.ownerId === playerId && !property.isMortgaged;
    }).length;
    return {
      group,
      owned,
      total: group.tileIds.length,
      complete: owned === group.tileIds.length
    };
  });
}

export function calculateRent(gameState: GameState, tileId: TileId, visitorPlayerId: PlayerId): number {
  const tile = gameState.tiles.find((item) => item.id === tileId);
  const property = gameState.properties[tileId];
  if (!tile || !property?.ownerId || property.ownerId === visitorPlayerId) {
    return 0;
  }
  if (property.isMortgaged) {
    return 0;
  }

  const baseRent = tile.baseRent ?? tile.rentBase ?? Math.round((tile.price ?? 1000) * 0.12);
  const rentMultipliers = gameState.settings.rentMultipliers?.length ? gameState.settings.rentMultipliers : undefined;
  const baseMultiplier = rentMultipliers?.[Math.max(0, property.level - 1)] ?? levelMultiplier(property);
  const groupMultiplier =
    tile.groupId && checkPropertyGroupCompletion(gameState, tile.groupId, property.ownerId)
      ? gameState.propertyGroups[tile.groupId]?.rentMultiplierWhenComplete ?? 1
      : 1;
  const boostMultiplier = property.rentBoostTurns && property.rentBoostTurns > 0 ? 1.5 : 1;
  const cutMultiplier = property.rentCutTurns && property.rentCutTurns > 0 ? 0.5 : 1;
  const statusMultiplier = boostMultiplier * cutMultiplier;
  const totalMultiplier = Math.min(50, baseMultiplier * groupMultiplier * statusMultiplier);
  return Math.max(0, Math.round(baseRent * totalMultiplier + (property.rentHornBonus ?? 0)));
}

export function isUpgradeable(property: PropertyState): boolean {
  return property.level < MAX_PROPERTY_LEVEL;
}
