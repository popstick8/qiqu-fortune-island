import type { GameState } from "@monopoly/shared";
import { useEffect, useState } from "react";
import { socket } from "../socket/socket";

interface SkillShopModalProps {
  game: GameState;
  playerId: string | null;
}

const rarityLabels = {
  common: "普通",
  rare: "稀有",
  epic: "史诗"
} as const;

const targetLabels: Record<string, string> = {
  self: "自己",
  player: "对手",
  tile: "地块",
  property: "地产",
  stock: "股票",
  propertyGroup: "地产套装",
  none: "无需目标"
};

export function SkillShopModal({ game, playerId }: SkillShopModalProps) {
  const [hidden, setHidden] = useState(false);
  const pending =
    game.pendingAction?.kind === "skillShop" && game.pendingAction.playerId === playerId
      ? game.pendingAction
      : null;
  const me = game.players.find((player) => player.id === playerId) ?? null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && pending) {
        setHidden(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending]);

  useEffect(() => {
    setHidden(false);
  }, [pending?.tileId]);

  if (!pending || !me) {
    return null;
  }

  if (hidden) {
    return (
      <button className="continuePendingButton" type="button" onClick={() => setHidden(false)}>
        继续处理技能小铺
      </button>
    );
  }

  const discount = me.statusEffects.find((effect) => effect.type === "shopDiscount" && effect.turns > 0);

  return (
    <div className="eventOverlay" onClick={() => setHidden(true)}>
      <article className="eventPopup neutral skillShopModal" onClick={(event) => event.stopPropagation()}>
        <span className="eventSticker" aria-hidden="true">卡</span>
        <span className="eventHeadline">技能小铺开张！</span>
        <h3>你的彩券：{me.tickets}</h3>
        <p className="modalHint">
          本次提供 {pending.offers.length} 张技能卡，可连续购买；关闭只是临时隐藏，跳过才结束事件。
          {discount ? ` 当前商店折扣剩余 ${discount.amount ?? 3} 张，每张便宜 1 张彩券，最低 1 张。` : ""}
        </p>
        <div className="skillOfferGrid">
          {pending.offers.map((card) => {
            const handFull = me.skillCards.length >= me.maxSkillCards;
            const cost = discount ? Math.max(1, card.costTickets - 1) : card.costTickets;
            const notEnoughTickets = me.tickets < cost;
            const disabled = handFull || notEnoughTickets;
            return (
              <button
                key={card.id}
                className={`skillOfferCard rarity-${card.rarity ?? "common"}`}
                disabled={disabled}
                onClick={() => socket.emit("buySkillCard", { skillId: card.id })}
              >
                <strong>{card.displayName ?? card.name}</strong>
                <span>{card.description}</span>
                <small>
                  {rarityLabels[card.rarity ?? "common"]} · 目标：{targetLabels[card.targetMode ?? card.target] ?? "自己"}
                  {card.range ? ` · 范围 ${card.range} 格` : ""}
                </small>
                <em>{disabled ? handFull ? "手牌已满" : "彩券不足" : `${cost} 彩券`}</em>
              </button>
            );
          })}
        </div>
        {me.skillCards.length >= me.maxSkillCards && <p className="modalHint">手牌已满，可以关闭技能小铺。</p>}
        <div className="modalActions">
          <button className="secondaryButton" onClick={() => socket.emit("skipSkillShop")}>
            跳过
          </button>
          <button className="secondaryButton" onClick={() => setHidden(true)}>
            关闭
          </button>
        </div>
      </article>
    </div>
  );
}
