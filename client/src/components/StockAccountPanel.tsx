import type { GameState, PlayerState } from "@monopoly/shared";
import { money } from "../game/economy";

interface StockAccountPanelProps {
  game: GameState;
  player: PlayerState;
}

export function StockAccountPanel({ game, player }: StockAccountPanelProps) {
  function tradeTypeLabel(type: string) {
    if (type === "buy" || type === "net_buy") {
      return "净买入";
    }
    if (type === "sell" || type === "net_sell") {
      return "净卖出";
    }
    return "赠股";
  }

  return (
    <>
      <h3>我的持仓</h3>
      <p className="stockAccountSummary">
        冻结资金 {money(player.stockAccount.cashFrozen ?? 0)} · 已实现盈亏 {money(player.stockAccount.realizedProfit)}
      </p>
      <div className="holdingList">
        {Object.values(player.stockAccount.holdings).length === 0 && <p>暂无持仓</p>}
        {Object.values(player.stockAccount.holdings).map((item) => {
          if (!item) return null;
          const stock = game.stocks[item.stockId];
          return (
            <article key={item.stockId}>
              <strong>{stock?.name ?? item.stockId}</strong>
              <span>{item.shares} 股 · 平均成本 {item.averageCost} · 当前价 {item.currentPrice}</span>
              <em className={item.unrealizedProfit >= 0 ? "up" : "down"}>
                市值 {money(item.marketValue)} / 浮动盈亏 {item.unrealizedProfit >= 0 ? "+" : ""}{money(item.unrealizedProfit)}
              </em>
            </article>
          );
        })}
      </div>
      <h3>最近交易</h3>
      <div className="tradeHistory">
        {player.stockAccount.tradeHistory.length === 0 && <p>暂无交易记录</p>}
        {player.stockAccount.tradeHistory.slice(-10).reverse().map((record) => (
          <p key={record.id}>
            奇趣历 {record.year}-{record.month}-{record.day} · {tradeTypeLabel(record.type)}{" "}
            {game.stocks[record.stockId]?.name ?? record.stockId} {record.shares} 股，价 {record.price}，费 {record.fee}
            {record.realizedProfit !== undefined ? `，本次盈亏 ${record.realizedProfit >= 0 ? "+" : ""}${money(record.realizedProfit)}` : ""}
          </p>
        ))}
      </div>
    </>
  );
}
