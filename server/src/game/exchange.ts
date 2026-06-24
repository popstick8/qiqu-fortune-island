import type { GameState, PlayerId } from "@monopoly/shared";

export interface TicketExchangeResult {
  ok: boolean;
  message: string;
}

function validTicketAmount(ticketAmount: number): number | null {
  if (!Number.isFinite(ticketAmount)) {
    return null;
  }
  const amount = Math.floor(ticketAmount);
  return amount > 0 && amount === ticketAmount ? amount : null;
}

function canExchangeHere(gameState: GameState, playerId: PlayerId): boolean {
  const player = gameState.players.find((item) => item.id === playerId);
  const tile = player ? gameState.tiles.find((item) => item.id === player.currentTileId) : null;
  return tile?.type === "bank";
}

export function exchangeMoneyToTickets(gameState: GameState, playerId: PlayerId, ticketAmount: number): TicketExchangeResult {
  const player = gameState.players.find((item) => item.id === playerId);
  const amount = validTicketAmount(ticketAmount);
  if (!player || player.bankrupt) {
    return { ok: false, message: "玩家不存在或已破产。" };
  }
  if (!amount) {
    return { ok: false, message: "兑换数量必须是正整数。" };
  }
  if (!canExchangeHere(gameState, playerId)) {
    return { ok: false, message: "只有在银行地块可以兑换彩券。" };
  }
  const cost = amount * gameState.ticketExchangeRate.moneyToTicketCost;
  if (player.cash < cost) {
    return { ok: false, message: "金币不足，无法兑换彩券。" };
  }
  player.cash -= cost;
  player.tickets += amount;
  return { ok: true, message: `${player.nickname} 花费 ${cost} 金币兑换了 ${amount} 张彩券。` };
}

export function exchangeTicketsToMoney(gameState: GameState, playerId: PlayerId, ticketAmount: number): TicketExchangeResult {
  const player = gameState.players.find((item) => item.id === playerId);
  const amount = validTicketAmount(ticketAmount);
  if (!player || player.bankrupt) {
    return { ok: false, message: "玩家不存在或已破产。" };
  }
  if (!amount) {
    return { ok: false, message: "兑换数量必须是正整数。" };
  }
  if (!canExchangeHere(gameState, playerId)) {
    return { ok: false, message: "只有在银行地块可以兑换彩券。" };
  }
  if (player.tickets < amount) {
    return { ok: false, message: "彩券不足，无法兑换金币。" };
  }
  const reward = amount * gameState.ticketExchangeRate.ticketToMoneyValue;
  player.tickets -= amount;
  player.cash += reward;
  return { ok: true, message: `${player.nickname} 使用 ${amount} 张彩券兑换了 ${reward} 金币。` };
}
