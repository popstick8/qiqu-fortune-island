import { useEffect, useState } from "react";
import type { GameState, LotteryResult } from "@monopoly/shared";
import { socket } from "../socket/socket";

interface LotteryPanelProps {
  game: GameState;
  playerId: string | null;
}

function summarize(results: LotteryResult[]) {
  return results.reduce(
    (total, result) => ({
      cost: total.cost + result.cost,
      money: total.money + result.rewardMoney,
      tickets: total.tickets + result.rewardTickets,
      skills: total.skills + (result.rewardSkillCard ? 1 : 0)
    }),
    { cost: 0, money: 0, tickets: 0, skills: 0 }
  );
}

function LotteryResults({ results }: { results: LotteryResult[] }) {
  const summary = summarize(results);

  return (
    <div className="lotteryResults">
      <strong>本次开奖明细</strong>
      {results.map((result, index) => (
        <article key={result.id}>
          <span>第 {result.ticketNumber ?? index + 1} 张</span>
          <p>{result.message}</p>
        </article>
      ))}
      <p className="modalResult">
        总计：花费 {summary.cost} 金币，金币 {summary.money >= 0 ? "+" : ""}
        {summary.money}，彩券 +{summary.tickets}
        {summary.skills ? `，技能卡 +${summary.skills}` : ""}
      </p>
    </div>
  );
}

export function LotteryPanel({ game, playerId }: LotteryPanelProps) {
  const [count, setCount] = useState(1);
  const [lastResults, setLastResults] = useState<LotteryResult[]>([]);
  const [hidden, setHidden] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [buying, setBuying] = useState(false);
  const pending =
    game.pendingAction?.kind === "lottery" && game.pendingAction.playerId === playerId
      ? game.pendingAction
      : null;
  const me = game.players.find((player) => player.id === playerId) ?? null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (showHistory) {
        setShowHistory(false);
        return;
      }
      if (pending) {
        setHidden(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, showHistory]);

  useEffect(() => {
    function onLotteryResult(result: LotteryResult) {
      if (result.playerId === playerId) {
        setLastResults((items) => [...items, result]);
        setBuying(false);
        setShowHistory(false);
      }
    }
    function onLotteryClosed(payload: { playerId: string }) {
      if (payload.playerId === playerId) {
        setHidden(true);
        setBuying(false);
      }
    }
    socket.on("lotteryResult", onLotteryResult);
    socket.on("lotterySkipped", onLotteryClosed);
    socket.on("lotteryPanelClosed", onLotteryClosed);
    return () => {
      socket.off("lotteryResult", onLotteryResult);
      socket.off("lotterySkipped", onLotteryClosed);
      socket.off("lotteryPanelClosed", onLotteryClosed);
    };
  }, [playerId]);

  useEffect(() => {
    if (pending?.tileId) {
      setLastResults([]);
      setHidden(false);
      setShowHistory(false);
      setBuying(false);
    }
  }, [pending?.tileId]);

  useEffect(() => {
    setLastResults([]);
    setHidden(false);
    setShowHistory(false);
    setBuying(false);
  }, [game.round, game.completedTurns, game.currentTurnIndex]);

  if (!me) {
    return null;
  }

  if (!pending) {
    if (lastResults.length === 0) {
      return null;
    }
    return (
      <>
        <button className="continuePendingButton" type="button" onClick={() => setShowHistory(true)}>
          查看本回合彩票结果
        </button>
        {showHistory && (
          <div className="eventOverlay" onClick={() => setShowHistory(false)}>
            <article className="eventPopup neutral lotteryModal" onClick={(event) => event.stopPropagation()}>
              <button className="modalCloseButton" type="button" aria-label="关闭" onClick={() => setShowHistory(false)}>
                X
              </button>
              <span className="eventHeadline">本回合彩票结果</span>
              <LotteryResults results={lastResults} />
            </article>
          </div>
        )}
      </>
    );
  }

  if (hidden) {
    return (
      <button className="continuePendingButton" type="button" onClick={() => setHidden(false)}>
        继续处理彩票
      </button>
    );
  }

  const remaining = Math.max(0, pending.maxTickets - (pending.purchasedCount ?? 0));
  const safeCount = Math.max(1, Math.min(Math.max(1, remaining), count));
  const totalCost = safeCount * pending.ticketPrice;

  function buy() {
    if (buying || remaining <= 0 || !me || me.cash < totalCost) {
      return;
    }
    setBuying(true);
    setLastResults([]);
    socket.emit("buyLotteryTicket", { count: safeCount });
    window.setTimeout(() => setBuying(false), 3500);
  }

  return (
    <div className="eventOverlay" onClick={() => setHidden(true)}>
      <article className="eventPopup neutral lotteryModal" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseButton" type="button" aria-label="关闭" onClick={() => setHidden(true)}>
          X
        </button>
        <span className="eventSticker" aria-hidden="true">券</span>
        <span className="eventHeadline">彩票屋</span>
        <h3>购买彩票</h3>
        <p>彩票价格：{pending.ticketPrice} 金币 / 张。本次还可购买 {remaining} 张。</p>
        <label className="modalField">
          彩票数量
          <input
            type="number"
            min={1}
            max={remaining}
            value={safeCount}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
        <p>预计花费：{totalCost} 金币，当前金币：{me.cash}</p>
        {lastResults.length > 0 && <LotteryResults results={lastResults} />}
        <div className="modalActions">
          <button disabled={buying || remaining <= 0 || me.cash < totalCost} onClick={buy}>
            {buying ? "开奖中..." : "购买彩票并开奖"}
          </button>
          <button className="secondaryButton" onClick={() => socket.emit("skipLottery")}>
            {lastResults.length > 0 || (pending.purchasedCount ?? 0) > 0 ? "完成 / 跳过剩余" : "跳过"}
          </button>
          <button className="secondaryButton" onClick={() => setHidden(true)}>
            关闭
          </button>
        </div>
      </article>
    </div>
  );
}
