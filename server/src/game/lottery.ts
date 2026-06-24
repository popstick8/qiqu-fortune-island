import type { GameState, LotteryResult, PlayerId } from "@monopoly/shared";

const LOTTERY_PRICE = 500;
const MAX_LOTTERY_TICKETS = 3;

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addLog(gameState: GameState, message: string): void {
  gameState.logs.unshift({
    id: uid("log"),
    turn: gameState.completedTurns + 1,
    message,
    createdAt: Date.now()
  });
  gameState.logs = gameState.logs.slice(0, 120);
}

function takeStatus(player: GameState["players"][number], type: GameState["players"][number]["statusEffects"][number]["type"]) {
  const index = player.statusEffects.findIndex((effect) => effect.type === type && effect.turns > 0);
  if (index < 0) {
    return null;
  }
  const [effect] = player.statusEffects.splice(index, 1);
  return effect ?? null;
}

function useCountedStatus(player: GameState["players"][number], type: GameState["players"][number]["statusEffects"][number]["type"]) {
  const index = player.statusEffects.findIndex((effect) => effect.type === type && effect.turns > 0);
  if (index < 0) {
    return null;
  }
  const effect = player.statusEffects[index];
  if (!effect) {
    return null;
  }
  const remaining = Math.max(0, (effect.amount ?? 1) - 1);
  if (remaining <= 0) {
    player.statusEffects.splice(index, 1);
  } else {
    player.statusEffects[index] = { ...effect, amount: remaining };
  }
  return effect;
}

function drawOne(gameState: GameState, playerId: PlayerId): LotteryResult {
  const player = gameState.players.find((item) => item.id === playerId);
  if (!player || player.bankrupt) {
    return {
      id: uid("lottery"),
      playerId,
      cost: 0,
      rewardMoney: 0,
      rewardTickets: 0,
      resultType: "none",
      message: "玩家不存在或已破产。"
    };
  }
  const freePack = useCountedStatus(player, "lotteryPack");
  const ticketPrice = freePack ? 0 : LOTTERY_PRICE;
  if (player.cash < ticketPrice) {
    return {
      id: uid("lottery"),
      playerId,
      cost: 0,
      rewardMoney: 0,
      rewardTickets: 0,
      resultType: "none",
      message: "金币不足，无法购买彩票。"
    };
  }

  player.cash -= ticketPrice;
  const boosted = Boolean(takeStatus(player, "lotteryBoost"));
  const lucky = Boolean(takeStatus(player, "luckyCharm"));
  const luckyNumber = Boolean(takeStatus(player, "luckyNumber"));
  const guarantee = takeStatus(player, "lotteryGuarantee");
  let roll = Math.random();
  if (lucky) {
    roll = Math.max(roll, Math.random());
  }
  if (luckyNumber) {
    roll = Math.max(roll, 0.72 + Math.random() * 0.28);
  }

  let resultType: LotteryResult["resultType"] = "none";
  let rewardMoney = 0;
  let rewardTickets = 0;
  if (roll < 0.5) {
    resultType = "none";
  } else if (roll < 0.75) {
    resultType = "small";
    rewardMoney = 800;
  } else if (roll < 0.9) {
    resultType = "medium";
    rewardMoney = 1500;
  } else if (roll < 0.97) {
    resultType = "big";
    rewardMoney = 3000;
  } else {
    resultType = "tickets";
    rewardTickets = 2;
  }

  if (boosted && rewardMoney > 0) {
    rewardMoney *= 2;
  }
  if (resultType === "none" && guarantee) {
    rewardMoney += Math.floor(ticketPrice / 2);
  }
  player.cash += rewardMoney;
  player.tickets += rewardTickets;

  const message =
    resultType === "none"
      ? guarantee
        ? `购买彩票花费 ${ticketPrice} 金币，未中奖，保底返还 ${Math.floor(ticketPrice / 2)} 金币。`
        : `购买彩票花费 ${ticketPrice} 金币，未中奖。`
      : rewardTickets > 0
        ? `购买彩票花费 ${ticketPrice} 金币，获得 ${rewardTickets} 张彩券。`
        : `购买彩票花费 ${ticketPrice} 金币，中奖 +${rewardMoney} 金币。`;

  return {
    id: uid("lottery"),
    playerId,
    cost: ticketPrice,
    rewardMoney,
    rewardTickets,
    resultType,
    message
  };
}

export function buyLotteryTicket(gameState: GameState, playerId: PlayerId, count = 1): { ok: boolean; results: LotteryResult[]; message: string } {
  const maxTickets = Math.max(1, Math.min(99, Math.floor(gameState.settings.lotteryMaxTickets ?? MAX_LOTTERY_TICKETS)));
  const safeCount = Math.max(1, Math.min(maxTickets, Math.floor(count)));
  if (!Number.isFinite(safeCount)) {
    return { ok: false, results: [], message: "彩票数量必须是正整数。" };
  }
  const results: LotteryResult[] = [];
  for (let index = 0; index < safeCount; index += 1) {
    const result = drawOne(gameState, playerId);
    result.ticketNumber = index + 1;
    results.push(result);
    if (result.cost === 0 && result.resultType === "none" && result.rewardMoney === 0 && result.rewardTickets === 0 && !result.rewardSkillCard) {
      break;
    }
  }
  gameState.latestLotteryResults = results;
  const player = gameState.players.find((item) => item.id === playerId);
  for (const result of results) {
    if (result.cost <= 0 && result.resultType === "none" && result.rewardMoney === 0 && result.rewardTickets === 0 && !result.rewardSkillCard) {
      continue;
    }
    const won =
      result.rewardMoney > 0 ||
      result.rewardTickets > 0 ||
      Boolean(result.rewardSkillCard);
    addLog(
      gameState,
      `${player?.nickname ?? "玩家"} 彩票第 ${result.ticketNumber ?? 1} 张：${won ? "中奖" : "未中奖"}。${result.message}`
    );
  }
  return { ok: results.length > 0 && results.some((item) => item.cost > 0 || item.rewardMoney > 0 || item.rewardTickets > 0 || item.resultType !== "none"), results, message: results.map((item) => item.message).join(" ") };
}

export function lotteryConfig(gameState?: GameState) {
  return {
    ticketPrice: LOTTERY_PRICE,
    maxTickets: Math.max(1, Math.min(99, Math.floor(gameState?.settings.lotteryMaxTickets ?? MAX_LOTTERY_TICKETS)))
  };
}
