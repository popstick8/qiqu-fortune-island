import type { StockSymbol } from "@monopoly/shared";

export type EventDeck = "chance" | "misfortune";

export type EventEffect =
  | { type: "cash"; amount: number }
  | { type: "cashPerProperty"; amount: number }
  | { type: "freeUpgrade" }
  | { type: "stockGrant"; symbol?: StockSymbol; quantity: number }
  | { type: "moveToStart" }
  | { type: "moveSteps"; steps: number }
  | { type: "skipTurn"; turns: number }
  | { type: "repairFee"; amountPerProperty: number }
  | { type: "stockMarketShift"; symbol?: StockSymbol; percent: number }
  | { type: "propertyDowngrade" };

export interface EventCard {
  id: string;
  deck: EventDeck;
  title: string;
  description: string;
  tone: "good" | "bad" | "neutral";
  effect: EventEffect;
}

export const eventCards: EventCard[] = [
  {
    id: "chance-bonus-01",
    deck: "chance",
    title: "Street Festival",
    description: "The island festival is a hit. Gain 1200 coins.",
    tone: "good",
    effect: { type: "cash", amount: 1200 }
  },
  {
    id: "chance-bonus-02",
    deck: "chance",
    title: "Sponsor Deal",
    description: "A sponsor likes your route. Gain 1800 coins.",
    tone: "good",
    effect: { type: "cash", amount: 1800 }
  },
  {
    id: "chance-property-01",
    deck: "chance",
    title: "Neighborhood Buzz",
    description: "Owned streets attract visitors. Gain 300 coins per property.",
    tone: "good",
    effect: { type: "cashPerProperty", amount: 300 }
  },
  {
    id: "chance-upgrade-01",
    deck: "chance",
    title: "Builder Coupon",
    description: "Upgrade one owned property for free.",
    tone: "good",
    effect: { type: "freeUpgrade" }
  },
  {
    id: "chance-stock-01",
    deck: "chance",
    title: "STAR_TECH Gift",
    description: "Receive 5 STAR_TECH shares.",
    tone: "good",
    effect: { type: "stockGrant", symbol: "STAR_TECH", quantity: 5 }
  },
  {
    id: "chance-stock-02",
    deck: "chance",
    title: "Fresh Basket",
    description: "Receive 5 PUMPKIN_FOOD shares.",
    tone: "good",
    effect: { type: "stockGrant", symbol: "PUMPKIN_FOOD", quantity: 5 }
  },
  {
    id: "chance-start-01",
    deck: "chance",
    title: "Express Shuttle",
    description: "Move forward to Launch Plaza and collect salary.",
    tone: "good",
    effect: { type: "moveToStart" }
  },
  {
    id: "chance-forward-01",
    deck: "chance",
    title: "Tailwind",
    description: "Move forward 3 spaces.",
    tone: "good",
    effect: { type: "moveSteps", steps: 3 }
  },
  {
    id: "chance-market-01",
    deck: "chance",
    title: "RAINBOW_ENERGY Rally",
    description: "RAINBOW_ENERGY rises by 15 percent.",
    tone: "good",
    effect: { type: "stockMarketShift", symbol: "RAINBOW_ENERGY", percent: 0.15 }
  },
  {
    id: "chance-bonus-03",
    deck: "chance",
    title: "Helpful Review",
    description: "Tourists leave excellent reviews. Gain 900 coins.",
    tone: "good",
    effect: { type: "cash", amount: 900 }
  },
  {
    id: "misfortune-fine-01",
    deck: "misfortune",
    title: "Late Permit",
    description: "Pay a 900 coin permit fine.",
    tone: "bad",
    effect: { type: "cash", amount: -900 }
  },
  {
    id: "misfortune-repair-01",
    deck: "misfortune",
    title: "Maintenance Day",
    description: "Pay 260 coins for each owned property.",
    tone: "bad",
    effect: { type: "repairFee", amountPerProperty: 260 }
  },
  {
    id: "misfortune-market-01",
    deck: "misfortune",
    title: "STAR_TECH Slump",
    description: "STAR_TECH falls by 18 percent.",
    tone: "bad",
    effect: { type: "stockMarketShift", symbol: "STAR_TECH", percent: -0.18 }
  },
  {
    id: "misfortune-back-01",
    deck: "misfortune",
    title: "Wrong Turn",
    description: "Move back 3 spaces.",
    tone: "bad",
    effect: { type: "moveSteps", steps: -3 }
  },
  {
    id: "misfortune-skip-01",
    deck: "misfortune",
    title: "Paperwork Queue",
    description: "Skip your next turn.",
    tone: "bad",
    effect: { type: "skipTurn", turns: 1 }
  },
  {
    id: "misfortune-tax-01",
    deck: "misfortune",
    title: "Audit Notice",
    description: "Pay 12 percent of current cash.",
    tone: "bad",
    effect: { type: "cash", amount: -1200 }
  },
  {
    id: "misfortune-downgrade-01",
    deck: "misfortune",
    title: "Renovation Delay",
    description: "One upgraded property loses a level.",
    tone: "bad",
    effect: { type: "propertyDowngrade" }
  },
  {
    id: "misfortune-market-02",
    deck: "misfortune",
    title: "PUMPKIN_FOOD Recall",
    description: "PUMPKIN_FOOD falls by 15 percent.",
    tone: "bad",
    effect: { type: "stockMarketShift", symbol: "PUMPKIN_FOOD", percent: -0.15 }
  },
  {
    id: "misfortune-fee-02",
    deck: "misfortune",
    title: "Storage Fee",
    description: "Pay 700 coins.",
    tone: "bad",
    effect: { type: "cash", amount: -700 }
  },
  {
    id: "misfortune-back-02",
    deck: "misfortune",
    title: "Closed Street",
    description: "Move back 2 spaces.",
    tone: "bad",
    effect: { type: "moveSteps", steps: -2 }
  }
];

