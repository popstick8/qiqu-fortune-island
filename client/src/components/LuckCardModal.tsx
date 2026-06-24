import type { TileEvent } from "@monopoly/shared";
import { localizeEventText } from "../game/localizeLog";
import { useI18n } from "../i18n";

interface LuckCardModalProps {
  event: TileEvent | null;
  onClose: () => void;
}

function headline(tone: TileEvent["tone"]) {
  if (tone === "good") {
    return "好运翻牌！";
  }
  if (tone === "bad") {
    return "小心厄运！";
  }
  return "奇妙事件！";
}

function deckLabel(deck: string) {
  if (deck === "chance") return "好运";
  if (deck === "misfortune") return "厄运";
  if (deck === "lottery") return "彩票";
  if (deck === "arcade") return "游乐";
  return "事件";
}

export function LuckCardModal({ event, onClose }: LuckCardModalProps) {
  const { language, t } = useI18n();

  if (!event?.card) {
    return null;
  }

  return (
    <div className="eventOverlay" onClick={onClose}>
      <article className={`eventPopup luckCardPopup ${event.tone}`} onClick={(item) => item.stopPropagation()}>
        <span className="eventSticker" aria-hidden="true">
          {event.tone === "good" ? "★" : event.tone === "bad" ? "!" : "?"}
        </span>
        <span className="eventHeadline">{headline(event.tone)}</span>
        <div className="luckCardFace">
          <span>{deckLabel(event.card.deck)}</span>
          <h3>{event.card.title}</h3>
          <p>{localizeEventText(event.message, language)}</p>
        </div>
        <button className="primaryButton" onClick={onClose}>
          {t("ok")}
        </button>
      </article>
    </div>
  );
}
