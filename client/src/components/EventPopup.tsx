import type { TileEvent } from "@monopoly/shared";
import { localizeEventText } from "../game/localizeLog";
import { useI18n, type Language } from "../i18n";

interface EventPopupProps {
  event: TileEvent | null;
  onClose: () => void;
}

const zhEventTitles: Record<string, string> = {
  "Launch Plaza": "启航广场",
  "Open Lot": "待售地产",
  "Owned Property": "自有地产",
  "Max Level": "满级地产",
  "Rent Due": "支付租金",
  "Bank Visit": "银行到访",
  "Stock Market": "股票市场",
  "Prize Tent": "奖券帐篷",
  "Fun Arcade": "欢乐游乐场",
  "Tax Office": "税务所",
  "Teleport Gate": "传送门",
  "Street Festival": "街区庆典",
  "Sponsor Deal": "赞助合约",
  "Neighborhood Buzz": "街区人气",
  "Builder Coupon": "建造优惠券",
  "Tech Gift": "科技股票礼包",
  "Fresh Basket": "餐饮股票礼包",
  "Express Shuttle": "快速接驳车",
  Tailwind: "顺风前进",
  "Energy Rally": "能源股上涨",
  "Helpful Review": "好评奖励",
  "Late Permit": "许可逾期",
  "Maintenance Day": "维修日",
  "Tech Slump": "科技股下跌",
  "Wrong Turn": "走错路",
  "Paperwork Queue": "排队办手续",
  "Audit Notice": "审计通知",
  "Renovation Delay": "装修延期",
  "Food Recall": "餐饮召回",
  "Storage Fee": "仓储费",
  "Closed Street": "道路封闭"
};

function eventTitle(title: string, language: Language): string {
  return language === "zh" ? zhEventTitles[title] ?? title : title;
}

function toneHeadline(tone: TileEvent["tone"], language: Language): string {
  if (language === "en") {
    return tone === "good" ? "Lucky Time!" : tone === "bad" ? "Oops!" : "Island Event!";
  }
  return tone === "good" ? "好运降临！" : tone === "bad" ? "飞来横祸！" : "岛上事件！";
}

export function EventPopup({ event, onClose }: EventPopupProps) {
  const { language, t } = useI18n();

  if (!event) {
    return null;
  }

  return (
    <div className="eventOverlay" onClick={onClose}>
      <article className={`eventPopup ${event.tone}`} onClick={(item) => item.stopPropagation()}>
        <span className="eventSticker" aria-hidden="true">
          {event.tone === "good" ? "★" : event.tone === "bad" ? "!" : "?"}
        </span>
        <span className="eventHeadline">{toneHeadline(event.tone, language)}</span>
        <span className="eyebrow">{t("tileEvent")}</span>
        <h3>{eventTitle(event.title, language)}</h3>
        <p>{localizeEventText(event.message, language)}</p>
        <button className="primaryButton" onClick={onClose}>
          {t("ok")}
        </button>
      </article>
    </div>
  );
}
