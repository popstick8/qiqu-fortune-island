import type { GameState, MarketAnnouncement, MarketEvent, Stock, StockSector } from "@monopoly/shared";

const sectorNames: Record<StockSector, string> = {
  tech: "科技",
  food: "食品",
  transport: "航运",
  energy: "能源",
  entertainment: "娱乐",
  finance: "金融",
  estate: "地产",
  industry: "制造",
  retail: "零售",
  communication: "通信"
};

const templates: Array<{
  title: string;
  direction: MarketAnnouncement["direction"];
  strength: number;
  message: (name: string) => string;
}> = [
  { title: "游乐节订单", direction: "bullish", strength: 0.018, message: (name) => `${name}板块获得节日订单，今日收盘偏强。` },
  { title: "港口延误", direction: "bearish", strength: 0.018, message: (name) => `${name}板块遇到临时延误，今日收盘承压。` },
  { title: "媒体热议", direction: "volatile", strength: 0.026, message: (name) => `${name}板块被媒体热议，今日波动加大。` },
  { title: "稳定采购", direction: "stable", strength: 0.014, message: (name) => `${name}板块签下稳定采购单，今日波动收窄。` },
  { title: "游客高峰", direction: "bullish", strength: 0.02, message: (name) => `${name}板块迎来游客高峰，买盘更积极。` },
  { title: "检修通知", direction: "bearish", strength: 0.02, message: (name) => `${name}板块发布检修通知，短线情绪偏弱。` }
];

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomItem<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) {
    throw new Error("Cannot choose from an empty list.");
  }
  return item;
}

export function maybeCreateMarketAnnouncement(gameState: GameState): MarketAnnouncement | null {
  if (Math.random() > 0.22) {
    return null;
  }

  const stocks = Object.values(gameState.stocks) as Stock[];
  const useStock = Math.random() < 0.38;
  const stock = useStock ? randomItem(stocks) : null;
  const sector = stock?.sector ?? randomItem([...new Set(stocks.map((item) => item.sector))]);
  const template = randomItem(templates);
  const targetName = stock?.name ?? `${sectorNames[sector]}行业`;
  const announcement: MarketAnnouncement = {
    id: uid("announcement"),
    title: template.title,
    message: template.message(targetName),
    stockId: stock?.id,
    sector: stock ? undefined : sector,
    direction: template.direction,
    strength: template.strength,
    date: {
      year: gameState.gameCalendar.year,
      month: gameState.gameCalendar.month,
      day: gameState.gameCalendar.day
    }
  };

  const marketEvent: MarketEvent = {
    id: uid("announcement-event"),
    title: announcement.title,
    message: announcement.message,
    stockId: announcement.stockId,
    sector: announcement.sector,
    direction: announcement.direction,
    strength: announcement.strength,
    startDate: announcement.date,
    daysRemaining: 1,
    isPublic: true
  };

  gameState.marketAnnouncements = [announcement, ...(gameState.marketAnnouncements ?? [])].slice(0, 20);
  gameState.marketEvents.push(marketEvent);
  return announcement;
}
