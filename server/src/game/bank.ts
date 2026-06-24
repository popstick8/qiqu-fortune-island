import type { GameLogEntry, GameState, MonthlyBankSettlement, PlayerId, PlayerState } from "@monopoly/shared";

export interface BankActionResult {
  ok: boolean;
  message: string;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addLog(state: GameState, message: string): void {
  const entry: GameLogEntry = {
    id: uid("log"),
    turn: state.completedTurns,
    message,
    createdAt: Date.now()
  };
  state.logs.unshift(entry);
  state.logs = state.logs.slice(0, 100);
}

function getPlayer(state: GameState, playerId: PlayerId): PlayerState | null {
  return state.players.find((player) => player.id === playerId) ?? null;
}

function normalizeAmount(amount: number): number | null {
  if (!Number.isFinite(amount)) {
    return null;
  }
  const normalized = Math.floor(amount);
  return normalized > 0 ? normalized : null;
}

function normalizeBankAccount(state: GameState, player: PlayerState): void {
  const account = player.bankAccount;
  account.creditLimit = state.settings.creditLimit;
  account.debtPrincipal = Math.max(0, Math.floor(account.debtPrincipal ?? account.debt ?? 0));
  account.unpaidInterest = Math.max(0, Math.floor(account.unpaidInterest ?? 0));
  account.monthlyInterestAccrued = Math.max(0, Math.floor(account.monthlyInterestAccrued ?? 0));
  account.debt = account.debtPrincipal + account.unpaidInterest;
}

function syncCreditLimit(state: GameState, player: PlayerState): void {
  player.bankAccount.creditLimit = state.settings.creditLimit;
  normalizeBankAccount(state, player);
}

function canUseBank(state: GameState, player: PlayerState, requireBankTile = true): BankActionResult {
  if (state.status !== "playing") {
    return { ok: false, message: "游戏不在进行中，不能操作银行。" };
  }
  if (player.bankrupt) {
    return { ok: false, message: "你已经破产，不能操作银行。" };
  }
  if (!requireBankTile) {
    return { ok: true, message: "" };
  }
  const currentPlayerId = state.turnOrder[state.currentTurnIndex];
  if (currentPlayerId !== player.id) {
    return { ok: false, message: "只有当前回合玩家可以操作银行。" };
  }
  const tile = state.tiles.find((item) => item.id === player.currentTileId);
  const pendingBank = state.pendingAction?.kind === "bank" && state.pendingAction.playerId === player.id;
  if (tile?.type !== "bank" && !pendingBank) {
    return { ok: false, message: "只有停在银行地块时才能使用银行服务。" };
  }
  return { ok: true, message: "" };
}

export function depositMoney(state: GameState, playerId: PlayerId, rawAmount: number): BankActionResult {
  const player = getPlayer(state, playerId);
  if (!player) {
    return { ok: false, message: "玩家不存在。" };
  }
  const allowed = canUseBank(state, player);
  if (!allowed.ok) {
    return allowed;
  }
  const amount = normalizeAmount(rawAmount);
  if (!amount) {
    return { ok: false, message: "存款金额必须是正整数。" };
  }
  if (player.cash < amount) {
    return { ok: false, message: "现金不足，无法存款。" };
  }
  syncCreditLimit(state, player);
  player.cash -= amount;
  player.bankAccount.deposit += amount;
  addLog(state, `${player.nickname} 在银行存入 ${amount} 金币。`);
  return { ok: true, message: `已存入 ${amount} 金币。` };
}

export function withdrawMoney(state: GameState, playerId: PlayerId, rawAmount: number): BankActionResult {
  const player = getPlayer(state, playerId);
  if (!player) {
    return { ok: false, message: "玩家不存在。" };
  }
  const allowed = canUseBank(state, player);
  if (!allowed.ok) {
    return allowed;
  }
  const amount = normalizeAmount(rawAmount);
  if (!amount) {
    return { ok: false, message: "取款金额必须是正整数。" };
  }
  if (player.bankAccount.deposit < amount) {
    return { ok: false, message: "存款余额不足，无法取款。" };
  }
  syncCreditLimit(state, player);
  player.bankAccount.deposit -= amount;
  player.cash += amount;
  if (player.cash >= 0) {
    player.insolventUntil = undefined;
  }
  addLog(state, `${player.nickname} 从银行取出 ${amount} 金币。`);
  return { ok: true, message: `已取出 ${amount} 金币。` };
}

export function borrowCredit(state: GameState, playerId: PlayerId, rawAmount: number): BankActionResult {
  const player = getPlayer(state, playerId);
  if (!player) {
    return { ok: false, message: "玩家不存在。" };
  }
  const allowed = canUseBank(state, player, false);
  if (!allowed.ok) {
    return allowed;
  }
  const amount = normalizeAmount(rawAmount);
  if (!amount) {
    return { ok: false, message: "借款金额必须是正整数。" };
  }
  syncCreditLimit(state, player);
  const remaining = Math.max(0, player.bankAccount.creditLimit - player.bankAccount.debtPrincipal);
  if (amount > remaining) {
    return { ok: false, message: `信用额度不足，最多还能借 ${remaining} 金币。` };
  }
  player.bankAccount.debtPrincipal += amount;
  player.bankAccount.debt = player.bankAccount.debtPrincipal + player.bankAccount.unpaidInterest;
  player.cash += amount;
  if (player.cash >= 0) {
    player.insolventUntil = undefined;
  }
  addLog(state, `${player.nickname} 使用信用卡借出 ${amount} 金币。`);
  return { ok: true, message: `已借出 ${amount} 金币。` };
}

export function repayCredit(state: GameState, playerId: PlayerId, rawAmount: number): BankActionResult {
  const player = getPlayer(state, playerId);
  if (!player) {
    return { ok: false, message: "玩家不存在。" };
  }
  const allowed = canUseBank(state, player, false);
  if (!allowed.ok) {
    return allowed;
  }
  const amount = normalizeAmount(rawAmount);
  if (!amount) {
    return { ok: false, message: "还款金额必须是正整数。" };
  }
  normalizeBankAccount(state, player);
  const totalDebt = player.bankAccount.debtPrincipal + player.bankAccount.unpaidInterest;
  if (totalDebt <= 0) {
    return { ok: false, message: "当前没有信用欠款。" };
  }
  const repayAmount = Math.min(amount, totalDebt);
  if (player.cash < repayAmount) {
    return { ok: false, message: "现金不足，无法还款。" };
  }
  syncCreditLimit(state, player);
  player.cash -= repayAmount;
  const interestPaid = Math.min(player.bankAccount.unpaidInterest, repayAmount);
  player.bankAccount.unpaidInterest -= interestPaid;
  const principalPaid = repayAmount - interestPaid;
  player.bankAccount.debtPrincipal = Math.max(0, player.bankAccount.debtPrincipal - principalPaid);
  player.bankAccount.debt = player.bankAccount.debtPrincipal + player.bankAccount.unpaidInterest;
  addLog(state, `${player.nickname} 偿还信用欠款 ${repayAmount} 金币。`);
  return { ok: true, message: `已还款 ${repayAmount} 金币。` };
}

export function leaveDetention(state: GameState, playerId: PlayerId): BankActionResult {
  const player = getPlayer(state, playerId);
  if (!player) {
    return { ok: false, message: "玩家不存在。" };
  }
  if (state.status !== "playing") {
    return { ok: false, message: "游戏不在进行中，不能办理离开。" };
  }
  if (player.bankrupt) {
    return { ok: false, message: "你已经破产，不能办理离开。" };
  }
  const inJail = player.statusEffects.some((effect) => effect.type === "jail" && effect.turns > 0);
  const inHospital = player.statusEffects.some((effect) => effect.type === "hospital" && effect.turns > 0);
  if (!inJail && !inHospital) {
    return { ok: false, message: "当前没有拘留或住院状态。" };
  }
  const cost = inJail ? state.settings.bailCost : state.settings.treatmentCost;
  if (player.cash < cost) {
    return { ok: false, message: `现金不足，需要 ${cost} 金币。` };
  }
  player.cash -= cost;
  player.skipTurns = 0;
  player.statusEffects = player.statusEffects.filter((effect) => effect.type !== "jail" && effect.type !== "hospital");
  addLog(state, `${player.nickname} 支付 ${cost} 金币，提前离开${inJail ? "泡泡监狱" : "棉花糖医院"}。`);
  return { ok: true, message: `已支付 ${cost} 金币，恢复行动。` };
}

export function settleMonthlyBankInterest(state: GameState): MonthlyBankSettlement[] {
  if (state.gameCalendar.day !== 1 || state.gameCalendar.daysElapsed === 0) {
    return [];
  }

  const settlements: MonthlyBankSettlement[] = [];
  for (const player of state.players) {
    if (player.bankrupt) {
      continue;
    }
    syncCreditLimit(state, player);
    if (player.bankAccount.lastSettlementDay === state.gameCalendar.daysElapsed) {
      continue;
    }
    const depositInterest = Math.floor(player.bankAccount.deposit * state.settings.depositMonthlyRate);
    const debtInterest = Math.ceil(player.bankAccount.debtPrincipal * state.settings.loanMonthlyRate);
    player.bankAccount.deposit += depositInterest;
    player.bankAccount.unpaidInterest += debtInterest;
    player.bankAccount.monthlyInterestAccrued += debtInterest;
    const totalDebtAfterInterest = player.bankAccount.debtPrincipal + player.bankAccount.unpaidInterest;
    const debtExtensionIndex = player.statusEffects.findIndex((effect) => effect.type === "debtExtension" && effect.turns > 0);
    const forcedRepayment = debtExtensionIndex >= 0
      ? 0
      : Math.min(
          player.cash,
          Math.ceil(totalDebtAfterInterest * Math.max(0, Math.min(1, state.settings.forcedRepaymentRate ?? 0.2)))
        );
    if (debtExtensionIndex >= 0) {
      player.statusEffects.splice(debtExtensionIndex, 1);
    }
    let interestPaid = 0;
    let principalPaid = 0;
    if (forcedRepayment > 0) {
      player.cash -= forcedRepayment;
      interestPaid = Math.min(player.bankAccount.unpaidInterest, forcedRepayment);
      player.bankAccount.unpaidInterest -= interestPaid;
      principalPaid = forcedRepayment - interestPaid;
      player.bankAccount.debtPrincipal = Math.max(0, player.bankAccount.debtPrincipal - principalPaid);
    }
    player.bankAccount.debt = player.bankAccount.debtPrincipal + player.bankAccount.unpaidInterest;
    player.bankAccount.lastSettlementDay = state.gameCalendar.daysElapsed;
    settlements.push({
      id: uid("bank-settlement"),
      playerId: player.id,
      nickname: player.nickname,
      year: state.gameCalendar.year,
      month: state.gameCalendar.month,
      depositInterest,
      debtInterest,
      forcedRepayment,
      principalPaid,
      interestPaid,
      deposit: player.bankAccount.deposit,
      debtPrincipal: player.bankAccount.debtPrincipal,
      unpaidInterest: player.bankAccount.unpaidInterest,
      debt: player.bankAccount.debt,
      creditRemaining: Math.max(0, player.bankAccount.creditLimit - player.bankAccount.debtPrincipal)
    });
  }

  if (settlements.length > 0) {
    state.bankSettlements = [...settlements, ...state.bankSettlements].slice(0, 80);
    addLog(
      state,
      `银行月结完成：存款利息 ${settlements.reduce((sum, item) => sum + item.depositInterest, 0)} 金币，贷款利息 ${settlements.reduce((sum, item) => sum + item.debtInterest, 0)} 金币。`
    );
  }
  return settlements;
}
