import type { Stock, StockId, StockSector } from "@monopoly/shared";

interface StockSeed {
  id: StockId;
  name: string;
  code: string;
  sector: StockSector;
  initialPrice: number;
  volatility: number;
  trendBias: number;
}

export const stockSeeds: StockSeed[] = [
  { id: "STAR_TECH", name: "星河科技", code: "STAR", sector: "tech", initialPrice: 188, volatility: 0.075, trendBias: 0.006 },
  { id: "PUMPKIN_FOOD", name: "南瓜食品", code: "PUMP", sector: "food", initialPrice: 76, volatility: 0.038, trendBias: 0.003 },
  { id: "EAST_PORT", name: "东港航运", code: "PORT", sector: "transport", initialPrice: 112, volatility: 0.062, trendBias: 0.001 },
  { id: "RAINBOW_ENERGY", name: "彩虹能源", code: "RAIN", sector: "energy", initialPrice: 146, volatility: 0.09, trendBias: 0.002 },
  { id: "FUN_PARK", name: "奇趣娱乐", code: "FUN", sector: "entertainment", initialPrice: 96, volatility: 0.07, trendBias: 0.004 },
  { id: "GOLD_BANK", name: "金币银行", code: "GOLD", sector: "finance", initialPrice: 132, volatility: 0.032, trendBias: 0.003 },
  { id: "CLOUD_ESTATE", name: "云朵地产", code: "CLD", sector: "estate", initialPrice: 168, volatility: 0.058, trendBias: 0.002 },
  { id: "WIND_FACTORY", name: "风车制造", code: "WIND", sector: "industry", initialPrice: 88, volatility: 0.052, trendBias: 0.001 },
  { id: "CANDY_MALL", name: "糖果商业", code: "CNDY", sector: "retail", initialPrice: 104, volatility: 0.06, trendBias: 0.003 },
  { id: "BLUE_COM", name: "蓝海通信", code: "BLUE", sector: "communication", initialPrice: 154, volatility: 0.066, trendBias: 0.004 }
];

export const STOCK_IDS = stockSeeds.map((stock) => stock.id);

export function createInitialStocks(): Record<StockId, Stock> {
  return Object.fromEntries(
    stockSeeds.map((seed) => {
      const stock: Stock = {
        id: seed.id,
        symbol: seed.id,
        name: seed.name,
        code: seed.code,
        sector: seed.sector,
        currentPrice: seed.initialPrice,
        previousPrice: seed.initialPrice,
        change: 0,
        changeRate: 0,
        history: [{ year: 1, month: 1, day: 1, price: seed.initialPrice }],
        volatility: seed.volatility,
        trendBias: seed.trendBias,
        price: seed.initialPrice,
        trend: 0
      };
      return [seed.id, stock];
    })
  ) as Record<StockId, Stock>;
}
