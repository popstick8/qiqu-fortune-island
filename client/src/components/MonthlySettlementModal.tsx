import { useEffect, useMemo } from "react";
import type { GameState, MonthlyBankSettlement, PlayerState } from "@monopoly/shared";
import { computeAsset, money } from "../game/economy";

interface MonthlySettlementModalProps {
  game: GameState;
  settlements: MonthlyBankSettlement[] | null;
  onClose: () => void;
}

function playerProperties(game: GameState, player: PlayerState) {
  return player.properties
    .map((tileId) => game.tiles.find((tile) => tile.id === tileId)?.name)
    .filter((name): name is string => Boolean(name));
}

export function MonthlySettlementModal({ game, settlements, onClose }: MonthlySettlementModalProps) {
  const ranking = useMemo(
    () =>
      [...game.players]
        .sort((a, b) => computeAsset(game, b) - computeAsset(game, a))
        .map((player, index) => ({
          rank: index + 1,
          player,
          asset: computeAsset(game, player),
          settlement: settlements?.find((item) => item.playerId === player.id) ?? null,
          properties: playerProperties(game, player)
        })),
    [game, settlements]
  );
  const titleSettlement = settlements?.[0] ?? null;

  useEffect(() => {
    if (!settlements || settlements.length === 0) {
      return undefined;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, settlements]);

  if (!settlements || settlements.length === 0) {
    return null;
  }

  return (
    <div className="eventOverlay" onClick={onClose}>
      <article className="eventPopup neutral monthlySettlementModal" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseButton" type="button" aria-label="关闭" onClick={onClose}>
          X
        </button>
        <span className="eventSticker" aria-hidden="true">月</span>
        <span className="eventHeadline">月度银行结算</span>
        <h3>
          {titleSettlement ? `${titleSettlement.year} 年 ${titleSettlement.month} 月` : "本月"}资产排名
        </h3>
        <p className="modalHint">本面板只展示结算结果，关闭不会改变资产、排名或还款记录。</p>

        <div className="monthlyRankingList">
          {ranking.map(({ rank, player, asset, settlement, properties }) => (
            <article key={player.id} className={player.bankrupt ? "bankrupt" : ""}>
              <header>
                <strong>
                  #{rank} {player.nickname}
                </strong>
                <span>总资产 {money(asset)}</span>
              </header>
              <dl>
                <div>
                  <dt>现金</dt>
                  <dd>{money(player.cash)}</dd>
                </div>
                <div>
                  <dt>存款</dt>
                  <dd>{money(player.bankAccount.deposit)}</dd>
                </div>
                <div>
                  <dt>借款本金</dt>
                  <dd>{money(player.bankAccount.debtPrincipal)}</dd>
                </div>
                <div>
                  <dt>未还利息</dt>
                  <dd>{money(player.bankAccount.unpaidInterest)}</dd>
                </div>
                <div>
                  <dt>本月强制还款</dt>
                  <dd>{money(settlement?.forcedRepayment ?? 0)}</dd>
                </div>
                <div>
                  <dt>本月存款利息</dt>
                  <dd>+{money(settlement?.depositInterest ?? 0)}</dd>
                </div>
              </dl>
              <p className="monthlyProperties">
                房产 {properties.length} 处：
                {properties.length > 0 ? `${properties.slice(0, 5).join("、")}${properties.length > 5 ? ` 等 ${properties.length} 处` : ""}` : "暂无"}
              </p>
            </article>
          ))}
        </div>

        <div className="modalActions">
          <button onClick={onClose}>关闭月结算</button>
        </div>
      </article>
    </div>
  );
}
