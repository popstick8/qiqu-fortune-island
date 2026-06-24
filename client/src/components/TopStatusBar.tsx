import type { GameState } from "@monopoly/shared";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

interface TopStatusBarProps {
  game: GameState;
  onOpenRanking: () => void;
  canRestart: boolean;
  onRestart: () => void;
}

const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function TopStatusBar({ game, onOpenRanking, canRestart, onRestart }: TopStatusBarProps) {
  const { language, t } = useI18n();
  const [now, setNow] = useState(Date.now());
  const currentPlayerId = game.turnOrder[game.currentTurnIndex] ?? null;
  const currentPlayer = game.players.find((player) => player.id === currentPlayerId) ?? null;
  const winner = game.winnerId
    ? game.players.find((player) => player.id === game.winnerId)
    : game.rankings[0]
      ? game.players.find((player) => player.id === game.rankings[0]?.playerId)
      : null;
  const actedToday = game.gameCalendar.actedPlayerIdsToday.length;
  const activePlayers = game.players.filter((player) => !player.bankrupt).length;
  const isMonthlyPaused = Boolean(game.pendingMonthlySettlement);
  const remainingSeconds = game.status === "playing" && !isMonthlyPaused
    ? Math.max(0, Math.ceil((game.turnEndsAt - now) / 1000))
    : 0;
  const isMarketOpen = game.gameCalendar.weekday >= 1 && game.gameCalendar.weekday <= 5;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="top-status-bar">
      <div className="topBrand">
        <span>🏝</span>
        <strong>{t("appName")}</strong>
      </div>
      <div className="topStatusPills">
        <span className="turnPill">
          当前回合：<strong>{currentPlayer?.nickname ?? "等待中"}</strong>
        </span>
        <span className="calendarPill">
          奇趣历：{game.gameCalendar.year}-{game.gameCalendar.month}-{game.gameCalendar.day}
          {" "}{weekdayLabels[game.gameCalendar.weekday - 1] ?? "周一"}
        </span>
        <span className="progressPill">
          今日进度：{actedToday}/{Math.max(1, activePlayers)}
        </span>
        <span className={`timerPill ${remainingSeconds <= 10 && !isMonthlyPaused ? "urgent" : ""}`}>
          {isMonthlyPaused ? "月结算确认中：" : "回合倒计时："}
          <strong>{isMonthlyPaused ? `${game.pendingMonthlySettlement?.waitingPlayerIds.length ?? 0} 人待确认` : `${remainingSeconds}s`}</strong>
        </span>
        <span className={`statusPill ${game.status === "ended" ? "ended" : "playing"}`}>
          {game.status === "ended" ? `游戏已结束｜冠军：${winner?.nickname ?? "待定"}` : "游戏进行中"}
        </span>
      </div>
      <div className="topStockTicker" aria-label="股票简要行情">
        {!isMarketOpen && <span className="closed">今日休市，无价格变化</span>}
        {Object.values(game.stocks).slice(0, 10).map((stock) => (
          <span key={stock.symbol} className={stock.change >= 0 ? "up" : "down"}>
            {language === "zh" ? stock.name : stock.code} {stock.currentPrice}
            <em>{stock.change >= 0 ? "+" : ""}{stock.changeRate}%</em>
          </span>
        ))}
      </div>
      {game.status === "ended" && (
        <div className="endedTopActions">
          <button className="rankingEntryButton" type="button" onClick={onOpenRanking}>
            查看最终排行
          </button>
          <button
            className="restartButton"
            type="button"
            disabled={!canRestart}
            title={canRestart ? "回到准备房，重新开一局。" : "只有房主可以重开。"}
            onClick={onRestart}
          >
            再开一局
          </button>
        </div>
      )}
    </header>
  );
}
