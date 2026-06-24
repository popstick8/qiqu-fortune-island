import type { GameState, RankingEntry } from "@monopoly/shared";

export interface LocalGameResult {
  id: string;
  roomId: string;
  endedAt: number;
  winnerId: string | null;
  winnerName: string;
  calendar: string;
  rankings: RankingEntry[];
}

const storageKey = "qiqu-monopoly-game-results";

export function loadLocalResults(): LocalGameResult[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as LocalGameResult[]) : [];
  } catch {
    return [];
  }
}

export function saveGameResult(game: GameState): void {
  if (game.status !== "ended" || !game.endedAt || game.rankings.length === 0) {
    return;
  }
  const winner = game.rankings.find((rank) => rank.playerId === game.winnerId) ?? game.rankings[0];
  const result: LocalGameResult = {
    id: `${game.roomId}-${game.endedAt}`,
    roomId: game.roomId,
    endedAt: game.endedAt,
    winnerId: game.winnerId,
    winnerName: winner?.nickname ?? "待定",
    calendar: `${game.gameCalendar.year} 年 ${game.gameCalendar.month} 月 ${game.gameCalendar.day} 日`,
    rankings: game.rankings
  };
  const existing = loadLocalResults().filter((item) => item.id !== result.id);
  window.localStorage.setItem(storageKey, JSON.stringify([result, ...existing].slice(0, 30)));
}
