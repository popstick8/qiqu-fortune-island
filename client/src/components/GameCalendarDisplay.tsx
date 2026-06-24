import type { GameCalendar } from "@monopoly/shared";

interface GameCalendarDisplayProps {
  calendar: GameCalendar;
  activePlayers: number;
}

const monthThemes: Record<number, string> = {
  1: "开年行情，科技和消费小幅上涨",
  2: "节庆消费，食品和娱乐上涨",
  3: "开工建设，地产和制造上涨",
  4: "能源波动，能源股大幅震荡",
  5: "旅游旺季，航运和娱乐股更活跃",
  6: "银行结算，金融股稳定上涨",
  7: "暑期活动，娱乐和通信上涨",
  8: "台风季，航运波动加大",
  9: "开学季，消费和通信上涨",
  10: "黄金周，旅游、娱乐、食品上涨",
  11: "购物节，零售和通信上涨",
  12: "年终结算，银行和地产上涨"
};

export function GameCalendarDisplay({ calendar, activePlayers }: GameCalendarDisplayProps) {
  const weekday = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][calendar.weekday - 1] ?? "周一";
  const trading = calendar.weekday >= 1 && calendar.weekday <= 5;
  return (
    <section className="calendarBadge">
      <strong>奇趣历 {calendar.year} 年 {calendar.month} 月 {calendar.day} 日 {weekday}</strong>
      <span>今日进度：{calendar.actedPlayerIdsToday.length} / {activePlayers}</span>
      <span>{trading ? "股票今日开市" : "股票今日休市"}</span>
      <em>本月行情：{monthThemes[calendar.month] ?? monthThemes[1]}</em>
    </section>
  );
}
