import type { GameCalendar, GameDurationMode, GameState, PlayerId, StockSector } from "@monopoly/shared";

export interface MonthMarketTheme {
  month: number;
  title: string;
  description: string;
  sectorBias: Partial<Record<StockSector, number>>;
  volatilityBoost?: Partial<Record<StockSector, number>>;
}

const monthThemes: Record<number, MonthMarketTheme> = {
  1: { month: 1, title: "开年行情", description: "科技和消费小幅上涨", sectorBias: { tech: 0.018, retail: 0.012, food: 0.01 } },
  2: { month: 2, title: "节庆消费", description: "食品和娱乐上涨", sectorBias: { food: 0.02, entertainment: 0.02, retail: 0.012 } },
  3: { month: 3, title: "开工建设", description: "地产和制造上涨", sectorBias: { estate: 0.02, industry: 0.018 } },
  4: { month: 4, title: "能源波动", description: "能源股大幅震荡", sectorBias: { energy: 0.004 }, volatilityBoost: { energy: 0.08 } },
  5: { month: 5, title: "旅游旺季", description: "航运和娱乐股更活跃", sectorBias: { transport: 0.02, entertainment: 0.018 } },
  6: { month: 6, title: "银行结算", description: "金融股稳定上涨", sectorBias: { finance: 0.018 } },
  7: { month: 7, title: "暑期活动", description: "娱乐和通信上涨", sectorBias: { entertainment: 0.02, communication: 0.014 } },
  8: { month: 8, title: "台风季", description: "航运波动加大", sectorBias: { transport: -0.004 }, volatilityBoost: { transport: 0.07 } },
  9: { month: 9, title: "开学季", description: "消费和通信上涨", sectorBias: { retail: 0.018, communication: 0.016 } },
  10: { month: 10, title: "黄金周", description: "旅游、娱乐、食品上涨", sectorBias: { transport: 0.02, entertainment: 0.02, food: 0.016 } },
  11: { month: 11, title: "购物节", description: "零售和通信上涨", sectorBias: { retail: 0.026, communication: 0.018 } },
  12: { month: 12, title: "年终结算", description: "银行和地产上涨", sectorBias: { finance: 0.022, estate: 0.018 } }
};

export const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function getMonthLength(month: number): number {
  return MONTH_LENGTHS[Math.max(0, Math.min(11, month - 1))] ?? 30;
}

export function createInitialCalendar(): GameCalendar {
  return {
    year: 1,
    month: 1,
    day: 1,
    weekday: 1,
    actedPlayerIdsToday: [],
    daysElapsed: 0
  };
}

export function getDurationDays(mode: GameDurationMode): number {
  if (mode === "short_3_months") {
    return 31 + 28 + 31;
  }
  if (mode === "long_2_years") {
    return 365 * 2;
  }
  return 365;
}

export function getCurrentMonthMarketTheme(calendarOrMonth: GameCalendar | number): MonthMarketTheme {
  const month = typeof calendarOrMonth === "number" ? calendarOrMonth : calendarOrMonth.month;
  const fallback = monthThemes[1];
  if (!fallback) {
    throw new Error("Month market themes are not configured.");
  }
  return monthThemes[month] ?? fallback;
}

export function advanceGameDay(calendar: GameCalendar): GameCalendar {
  let nextDay = calendar.day + 1;
  let nextMonth = calendar.month;
  let nextYear = calendar.year;

  if (nextDay > getMonthLength(nextMonth)) {
    nextDay = 1;
    nextMonth += 1;
  }
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const nextWeekday = calendar.weekday >= 7 ? 1 : calendar.weekday + 1;

  return {
    year: nextYear,
    month: nextMonth,
    day: nextDay,
    weekday: nextWeekday,
    actedPlayerIdsToday: [],
    daysElapsed: calendar.daysElapsed + 1
  };
}

export function nextCalendarDate(date: Pick<GameCalendar, "year" | "month" | "day" | "weekday">): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  return advanceGameDay({
    year: date.year,
    month: date.month,
    day: date.day,
    weekday: date.weekday,
    actedPlayerIdsToday: [],
    daysElapsed: 0
  });
}

export function nextTradingDate(calendar: GameCalendar): { year: number; month: number; day: number } {
  let cursor = {
    year: calendar.year,
    month: calendar.month,
    day: calendar.day,
    weekday: calendar.weekday
  };
  do {
    cursor = nextCalendarDate(cursor);
  } while (cursor.weekday > 5);
  return { year: cursor.year, month: cursor.month, day: cursor.day };
}

export function isStockTradingDay(calendar: GameCalendar): boolean {
  return calendar.weekday >= 1 && calendar.weekday <= 5;
}

export function weekdayName(calendar: GameCalendar): string {
  return ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][calendar.weekday - 1] ?? "周一";
}

export function markPlayerActedAndAdvanceDayIfNeeded(gameState: GameState, playerId: PlayerId): GameState {
  const calendar = gameState.gameCalendar;
  if (!calendar.actedPlayerIdsToday.includes(playerId)) {
    calendar.actedPlayerIdsToday.push(playerId);
  }

  const activePlayerIds = gameState.players.filter((player) => !player.bankrupt).map((player) => player.id);
  const everybodyActed = activePlayerIds.every((id) => calendar.actedPlayerIdsToday.includes(id));
  if (activePlayerIds.length > 0 && everybodyActed) {
    gameState.gameCalendar = advanceGameDay(calendar);
  }

  return gameState;
}

export function checkGameEndByCalendar(gameState: GameState): boolean {
  return gameState.settings.endCondition === "rounds"
    && gameState.gameCalendar.daysElapsed >= getDurationDays(gameState.settings.durationMode);
}
