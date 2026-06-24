import type { GameState, PlayerState, PropertyState, Tile } from "@monopoly/shared";

function propertyValue(tile: Tile, property: PropertyState): number {
  if (!property.ownerId) {
    return 0;
  }
  const base = tile.price ?? 0;
  return base + Math.max(0, property.level - 1) * Math.round(base * 0.55);
}

export function computeAsset(game: GameState, player: PlayerState): number {
  const propertyTotal = player.properties.reduce((total, tileId) => {
    const tile = game.tiles.find((item) => item.id === tileId);
    const property = game.properties[tileId];
    if (!tile || !property) {
      return total;
    }
    return total + propertyValue(tile, property);
  }, 0);

  const stockTotal = player.stockAccount?.totalMarketValue ?? 0;
  const bankDeposit = player.bankAccount?.deposit ?? 0;
  const debtPrincipal = player.bankAccount?.debtPrincipal ?? player.bankAccount?.debt ?? 0;
  const unpaidInterest = player.bankAccount?.unpaidInterest ?? 0;
  const ticketValue = player.tickets * (game.ticketExchangeRate?.ticketToMoneyValue ?? game.settings.ticketToMoneyValue ?? 0);

  return player.cash + bankDeposit + propertyTotal + stockTotal + ticketValue - debtPrincipal - unpaidInterest;
}

export function money(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
