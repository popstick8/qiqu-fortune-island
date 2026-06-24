import { useMemo, useState } from "react";
import type { GameState, Stock, StockId, StockOrder, StockSector } from "@monopoly/shared";
import { socket } from "../socket/socket";
import { OtherPlayersHoldingsPanel } from "./OtherPlayersHoldingsPanel";
import { StockAccountPanel } from "./StockAccountPanel";
import { StockLineChart } from "./StockLineChart";

interface StockMarketPanelProps {
  game: GameState;
  playerId: string | null;
}

type StockTab = "list" | "orders" | "holdings" | "others" | "sectors" | "signals";

const sectorLabels: Record<StockSector, string> = {
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

const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const monthThemes: Record<number, { title: string; description: string }> = {
  1: { title: "开年行情", description: "科技、零售、食品偏强。" },
  2: { title: "节庆消费", description: "食品、娱乐、零售更活跃。" },
  3: { title: "开工建设", description: "地产、制造板块偏强。" },
  4: { title: "能源波动", description: "能源板块震荡加大。" },
  5: { title: "旅游旺季", description: "航运和娱乐更活跃。" },
  6: { title: "银行结算", description: "金融板块稳定偏强。" },
  7: { title: "暑期活动", description: "娱乐和通信偏强。" },
  8: { title: "台风季", description: "航运波动加大。" },
  9: { title: "开学季", description: "零售和通信偏强。" },
  10: { title: "黄金周", description: "航运、娱乐、食品偏强。" },
  11: { title: "购物节", description: "零售和通信偏强。" },
  12: { title: "年终结算", description: "金融和地产偏强。" }
};

function trendClass(stock: Stock) {
  return stock.change >= 0 ? "up" : "down";
}

function orderNetText(order: { stockName: string; netShares: number }) {
  if (order.netShares > 0) {
    return `${order.stockName}：净买入 ${order.netShares} 股`;
  }
  if (order.netShares < 0) {
    return `${order.stockName}：净卖出 ${Math.abs(order.netShares)} 股`;
  }
  return `${order.stockName}：买卖抵消`;
}

function averageChange(stock: Stock, days: number) {
  const history = stock.history.slice(-days);
  const first = history[0];
  const last = history[history.length - 1];
  if (!first || !last || first.price <= 0) {
    return 0;
  }
  return Math.round(((last.price - first.price) / first.price) * 10000) / 100;
}

export function StockMarketPanel({ game, playerId }: StockMarketPanelProps) {
  const stockIds = Object.keys(game.stocks) as StockId[];
  const [selectedStockId, setSelectedStockId] = useState<StockId>(stockIds[0] ?? "STAR_TECH");
  const [quantityInput, setQuantityInput] = useState("");
  const [range, setRange] = useState(30);
  const [tab, setTab] = useState<StockTab>("list");
  const me = game.players.find((player) => player.id === playerId) ?? null;
  const stocks = useMemo(() => Object.values(game.stocks), [game.stocks]);
  const selectedStock = game.stocks[selectedStockId] ?? stocks[0];
  const holding = selectedStock ? me?.stockAccount.holdings[selectedStock.id] : undefined;
  const isTradingDay = game.gameCalendar.weekday >= 1 && game.gameCalendar.weekday <= 5;
  const quantity = Number.parseInt(quantityInput, 10);
  const hasValidQuantity = Number.isFinite(quantity) && quantity > 0 && quantity <= 999;
  const canSubmitOrder = game.status === "playing" && isTradingDay && hasValidQuantity;
  const tradeCost = selectedStock
    ? Math.ceil(selectedStock.currentPrice * quantity * (1 + Math.max(0, game.settings.stockTradeFeeRate)))
    : 0;
  const myOrders = me?.stockAccount.pendingOrders ?? (game.pendingStockOrders ?? []).filter((order) => order.playerId === playerId);
  const marketSignals = (game.marketSignals ?? []).filter((signal) => signal.isPublic || signal.ownerPlayerId === playerId);
  const marketEvents = game.marketEvents ?? [];
  const marketAnnouncements = game.marketAnnouncements ?? [];
  const currentMonthTheme = monthThemes[game.gameCalendar.month] ?? monthThemes[1];
  const netOrders = useMemo(() => {
    const groups = new Map<StockId, number>();
    for (const order of myOrders) {
      groups.set(order.stockId, (groups.get(order.stockId) ?? 0) + (order.type === "buy" ? order.shares : -order.shares));
    }
    return [...groups.entries()].map(([stockId, netShares]) => ({
      stockId,
      stockName: game.stocks[stockId]?.name ?? stockId,
      netShares
    }));
  }, [game.stocks, myOrders]);

  if (!me || !selectedStock) {
    return null;
  }

  function submit(type: "buy" | "sell") {
    if (!hasValidQuantity) {
      return;
    }
    socket.emit("submitStockOrder", { stockId: selectedStock.id, type, shares: quantity });
    setQuantityInput("");
  }

  function renderOrder(order: StockOrder) {
    const stock = game.stocks[order.stockId];
    return (
      <article key={order.id} className="stockOrderCard">
        <strong>{stock?.name ?? order.stockId}</strong>
        <span>{order.type === "buy" ? "买入委托" : "卖出委托"} · {order.shares} 股</span>
        <small>提交日：{order.submittedAt.year} 年 {order.submittedAt.month} 月 {order.submittedAt.day} 日</small>
        <button className="secondaryButton" onClick={() => socket.emit("cancelStockOrder", { orderId: order.id })}>
          取消委托
        </button>
      </article>
    );
  }

  return (
    <section className="stockPanel">
      <div className="panelHeader">
        <span className="eyebrow">股票大厅</span>
        <strong>{isTradingDay ? "今日开市" : "今日休市"}</strong>
      </div>
      <div className="stockCalendarLine">
        奇趣历 {game.gameCalendar.year} 年 {game.gameCalendar.month} 月 {game.gameCalendar.day} 日
        {" "}{weekdayLabels[game.gameCalendar.weekday - 1] ?? "周一"}
        {game.status === "ended"
          ? <em>游戏已结束，不能再提交股票委托。</em>
          : !isTradingDay && <em>今日休市，股票交易将在下一个交易日恢复。</em>}
      </div>
      <div className="stockTabs">
        {[
          ["list", "股票列表"],
          ["orders", "我的委托"],
          ["holdings", "我的持仓"],
          ["others", "其他玩家"],
          ["sectors", "行业观察"],
          ["signals", "市场情报"]
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key as StockTab)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div className="stockPanelBody">
          <div className="stockList">
            {stocks.map((stock) => (
              <button
                key={stock.id}
                className={`stockRow ${selectedStock.id === stock.id ? "selected" : ""}`}
                onClick={() => setSelectedStockId(stock.id)}
              >
                <span>
                  <strong>{stock.name}</strong>
                  <small>{stock.code} · {sectorLabels[stock.sector]}</small>
                </span>
                <em className={trendClass(stock)}>
                  {stock.currentPrice} / {stock.change >= 0 ? "+" : ""}{stock.changeRate}%
                </em>
                <StockLineChart history={stock.history} days={7} height={34} />
              </button>
            ))}
          </div>

          <div className="stockDetail">
            <div className="stockDetailHeader">
              <div>
                <strong>{selectedStock.name}</strong>
                <span>{selectedStock.code} · {sectorLabels[selectedStock.sector]}</span>
              </div>
              <em className={trendClass(selectedStock)}>
                {selectedStock.currentPrice} ({selectedStock.change >= 0 ? "+" : ""}{selectedStock.change})
              </em>
            </div>
            <div className="rangeTabs">
              {[7, 30, 90].map((days) => (
                <button key={days} className={range === days ? "active" : ""} onClick={() => setRange(days)}>
                  {days} 天
                </button>
              ))}
            </div>
            <StockLineChart history={selectedStock.history} days={range} height={108} />
            <div className="stockTradeForm">
              <input
                type="number"
                min={1}
                max={999}
                placeholder="股数"
                value={quantityInput}
                onChange={(event) => setQuantityInput(event.target.value)}
              />
              <button disabled={!canSubmitOrder || me.cash < tradeCost} onClick={() => submit("buy")}>
                提交买入委托
              </button>
              <button disabled={!canSubmitOrder || (holding?.shares ?? 0) < quantity} onClick={() => submit("sell")}>
                提交卖出委托
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="stockOrderPanel">
          <h3>今日未结算委托</h3>
          {myOrders.length === 0 && <p>暂无未结算委托。</p>}
          <div className="stockOrderList">{myOrders.map(renderOrder)}</div>
          <h3>同股净委托预览</h3>
          {netOrders.length === 0 ? <p>暂无净委托。</p> : netOrders.map((order) => <p key={order.stockId}>{orderNetText(order)}</p>)}
        </div>
      )}

      {tab === "holdings" && (
        <div className="stockHoldingsPanel">
          <StockAccountPanel game={game} player={me} />
        </div>
      )}

      {tab === "others" && <OtherPlayersHoldingsPanel game={game} playerId={playerId} />}

      {tab === "sectors" && (
        <div className="sectorGrid">
          {Object.keys(sectorLabels).map((sector) => {
            const sectorStocks = stocks.filter((stock) => stock.sector === sector);
            const avg7 = sectorStocks.reduce((sum, stock) => sum + averageChange(stock, 7), 0) / Math.max(1, sectorStocks.length);
            const avg30 = sectorStocks.reduce((sum, stock) => sum + averageChange(stock, 30), 0) / Math.max(1, sectorStocks.length);
            const relatedSignals = marketSignals.filter((signal) => signal.isPublic && signal.sector === sector);
            const relatedEvents = marketEvents.filter((event) => event.isPublic && event.sector === sector);
            return (
              <article key={sector} className="sectorCard">
                <strong>{sectorLabels[sector as StockSector]}</strong>
                <span>7 日均涨跌：{Math.round(avg7 * 100) / 100}%</span>
                <span>30 日均涨跌：{Math.round(avg30 * 100) / 100}%</span>
                <small>波动等级：{Math.abs(avg7) > 8 ? "高" : Math.abs(avg7) > 3 ? "中" : "低"}</small>
                <small>{relatedSignals.length > 0 ? `公开情报 ${relatedSignals.length} 条` : "暂无公开情报"}</small>
                <small>{relatedEvents.length > 0 ? `市场事件 ${relatedEvents.length} 条` : "暂无市场事件"}</small>
                <p>{sectorStocks.map((stock) => `${stock.name} ${stock.currentPrice}`).join("　")}</p>
              </article>
            );
          })}
        </div>
      )}

      {tab === "signals" && (
        <div className="marketSignalPanel">
          <h3>本月公开主题</h3>
          <article>
            <strong>{currentMonthTheme?.title ?? "普通行情"}</strong>
            <span>{currentMonthTheme?.description ?? "本月没有明显行业主题。"}</span>
          </article>
          <h3>随机股市公告</h3>
          {marketAnnouncements.length === 0 && <p>暂无随机股市公告。</p>}
          {marketAnnouncements.slice(0, 6).map((announcement) => (
            <article key={announcement.id}>
              <strong>{announcement.title}</strong>
              <span>{announcement.message}</span>
              <small>{announcement.date.year} 年 {announcement.date.month} 月 {announcement.date.day} 日 · 强度 {Math.round(announcement.strength * 100)}%</small>
            </article>
          ))}
          <h3>个人股市情报</h3>
          {marketSignals.filter((signal) => !signal.isPublic).length === 0 && <p>暂无个人情报。踩到股票观察类地块可获得 100% 准确情报。</p>}
          {marketSignals.filter((signal) => !signal.isPublic).map((signal) => (
            <article key={signal.id} className="privateSignal">
              <strong>{signal.message}</strong>
              <span>目标日：{signal.targetDate.year} 年 {signal.targetDate.month} 月 {signal.targetDate.day} 日</span>
              <small>个人可见 · 准确率 {Math.round(signal.accuracy * 100)}%</small>
            </article>
          ))}
          <h3>公开市场情报</h3>
          {marketSignals.filter((signal) => signal.isPublic).length === 0 && <p>暂无公开股市情报。</p>}
          {marketSignals.filter((signal) => signal.isPublic).map((signal) => (
            <article key={signal.id}>
              <strong>{signal.message}</strong>
              <span>目标日：{signal.targetDate.year} 年 {signal.targetDate.month} 月 {signal.targetDate.day} 日</span>
              <small>强度 {Math.round(signal.strength * 100)}% · 准确率 {Math.round(signal.accuracy * 100)}%</small>
            </article>
          ))}
          <h3>公开市场事件</h3>
          {marketEvents.filter((event) => event.isPublic).length === 0 && <p>暂无公开市场事件。</p>}
          {marketEvents.filter((event) => event.isPublic).map((event) => (
            <article key={event.id}>
              <strong>{event.title}</strong>
              <span>{event.message}</span>
              <small>剩余 {event.daysRemaining} 个交易日</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
