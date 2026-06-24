import type { GameState, PlayerState, PropertyState, RankingEntry, Tile } from "@monopoly/shared";

export const INITIAL_CASH = 10000;
export const MAX_PROPERTY_LEVEL = 4;
export const STOCK_SYMBOLS = [
  "STAR_TECH",
  "PUMPKIN_FOOD",
  "EAST_PORT",
  "RAINBOW_ENERGY",
  "FUN_PARK",
  "GOLD_BANK",
  "CLOUD_ESTATE",
  "WIND_FACTORY",
  "CANDY_MALL",
  "BLUE_COM"
] as const;

export function getRent(tile: Tile, property: PropertyState): number {
  const baseRent = tile.baseRent ?? Math.round((tile.price ?? 1000) * 0.12);
  const multipliers = [1, 2.3, 5, 10];
  const multiplier = multipliers[Math.max(0, property.level - 1)] ?? multipliers[multipliers.length - 1] ?? 1;
  return Math.round(baseRent * multiplier);
}

export function getUpgradeCost(tile: Tile, property: PropertyState): number {
  const price = tile.price ?? 1000;
  return Math.round(price * (0.45 + property.level * 0.15));
}

export function getPropertyValue(tile: Tile, property: PropertyState): number {
  if (!property.ownerId) {
    return 0;
  }
  const base = tile.price ?? 0;
  const upgradeValue = Math.max(0, property.level - 1) * Math.round(base * 0.65);
  return base + upgradeValue;
}

export function computePlayerAsset(state: GameState, player: PlayerState): number {
  const propertyValue = player.properties.reduce((total, tileId) => {
    const tile = state.tiles.find((item) => item.id === tileId);
    const property = state.properties[tileId];
    if (!tile || !property) {
      return total;
    }
    return total + getPropertyValue(tile, property);
  }, 0);

  const stockValue = player.stockAccount?.totalMarketValue ?? 0;

  const bankDeposit = player.bankAccount?.deposit ?? 0;
  const debtPrincipal = player.bankAccount?.debtPrincipal ?? player.bankAccount?.debt ?? 0;
  const unpaidInterest = player.bankAccount?.unpaidInterest ?? 0;
  const ticketValue = player.tickets * (state.ticketExchangeRate?.ticketToMoneyValue ?? state.settings.ticketToMoneyValue ?? 0);
  return player.cash + bankDeposit + propertyValue + stockValue + ticketValue - debtPrincipal - unpaidInterest;
}

export function buildRankings(state: GameState): RankingEntry[] {
  return [...state.players]
    .map((player) => ({
      playerId: player.id,
      nickname: player.nickname,
      asset: computePlayerAsset(state, player),
      cash: player.cash,
      bankrupt: player.bankrupt
    }))
    .sort((a, b) => b.asset - a.asset);
}
