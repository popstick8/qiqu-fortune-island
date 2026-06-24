import { useMemo, useState } from "react";
import type { ClientToServerEvents, GameState } from "@monopoly/shared";
import { socket } from "../socket/socket";

interface ExchangePanelProps {
  game: GameState;
  playerId: string | null;
}

type AmountEvent = "depositMoney" | "withdrawMoney" | "borrowCredit" | "repayCredit";

function toPositiveAmount(value: string): number {
  return Math.max(1, Math.floor(Number(value) || 0));
}

function emitAmount(eventName: AmountEvent, amount: number): void {
  socket.emit(eventName, { amount } as Parameters<ClientToServerEvents[AmountEvent]>[0]);
}

export function ExchangePanel({ game, playerId }: ExchangePanelProps) {
  const [open, setOpen] = useState(true);
  const [bankAmount, setBankAmount] = useState("1000");
  const [ticketAmount, setTicketAmount] = useState("1");
  const me = game.players.find((player) => player.id === playerId) ?? null;
  const currentPlayerId = game.turnOrder[game.currentTurnIndex] ?? null;
  const tile = me ? game.tiles.find((item) => item.id === me.currentTileId) : null;

  const detention = useMemo(() => {
    const jail = me?.statusEffects.find((effect) => effect.type === "jail" && effect.turns > 0);
    const hospital = me?.statusEffects.find((effect) => effect.type === "hospital" && effect.turns > 0);
    return jail ? { type: "jail" as const, turns: jail.turns } : hospital ? { type: "hospital" as const, turns: hospital.turns } : null;
  }, [me]);

  if (!me) {
    return null;
  }

  const isBankTile = tile?.type === "bank";
  const pendingBank = game.pendingAction?.kind === "bank" && game.pendingAction.playerId === me.id;
  const rate = game.ticketExchangeRate ?? { moneyToTicketCost: 1000, ticketToMoneyValue: 600 };
  const amount = toPositiveAmount(bankAmount);
  const tickets = toPositiveAmount(ticketAmount);
  const ticketCost = tickets * rate.moneyToTicketCost;
  const ticketReward = tickets * rate.ticketToMoneyValue;
  const debtPrincipal = me.bankAccount.debtPrincipal ?? me.bankAccount.debt;
  const unpaidInterest = me.bankAccount.unpaidInterest ?? 0;
  const debt = debtPrincipal + unpaidInterest;
  const deposit = me.bankAccount.deposit;
  const creditRemaining = Math.max(0, me.bankAccount.creditLimit - debtPrincipal);
  const myBankSettlements = (game.bankSettlements ?? []).filter((settlement) => settlement.playerId === me.id).slice(0, 6);
  const canOperateBankTile =
    game.status === "playing" &&
    me.id === currentPlayerId &&
    !me.bankrupt &&
    (isBankTile || pendingBank);
  const canOperateCredit = game.status === "playing" && !me.bankrupt;
  const detentionCost =
    detention?.type === "jail" ? game.settings.bailCost : detention?.type === "hospital" ? game.settings.treatmentCost : 0;

  return (
    <section className="exchangePanel bankServicePanel">
      <div className="panelHeader">
        <span className="eyebrow">银行服务</span>
        <strong>金币、彩券与信用卡</strong>
      </div>

      {!open ? (
        <button type="button" onClick={() => { setOpen(true); socket.emit("openExchangePanel"); }}>
          打开银行服务
        </button>
      ) : (
        <div className="exchangeBox">
          <div className="bankStats">
            <span>现金 <b>{me.cash}</b></span>
            <span>存款 <b>{deposit}</b></span>
            <span>本金 <b>{debtPrincipal}</b></span>
            <span>未还息 <b>{unpaidInterest}</b></span>
            <span>额度 <b>{me.bankAccount.creditLimit}</b></span>
            <span>可借 <b>{creditRemaining}</b></span>
            <span>彩券 <b>{me.tickets}</b></span>
          </div>

          <p className="panelHint">
            存款月利率 {Math.round(game.settings.depositMonthlyRate * 100)}%，贷款月利率{" "}
            {Math.round(game.settings.loanMonthlyRate * 100)}%。每月 1 日按本金计息，并强制归还{" "}
            {Math.round((game.settings.forcedRepaymentRate ?? 0.2) * 100)}% 本息。
          </p>

          {detention && (
            <div className="detentionNotice">
              <strong>{detention.type === "jail" ? "泡泡监狱" : "棉花糖医院"}</strong>
              <span>剩余停留 {detention.turns} 天，可支付 {detentionCost} 金币提前离开。</span>
              <button
                type="button"
                className="secondaryButton"
                disabled={game.status !== "playing" || me.cash < detentionCost || me.bankrupt}
                onClick={() => socket.emit("leaveDetention")}
              >
                提前离开
              </button>
            </div>
          )}

          <label className="modalField">
            银行金额
            <input
              type="number"
              min={1}
              step={100}
              value={bankAmount}
              onChange={(event) => setBankAmount(event.target.value)}
            />
          </label>
          <div className="bankActionGrid">
            <button type="button" disabled={!canOperateBankTile || me.cash < amount} onClick={() => emitAmount("depositMoney", amount)}>
              存款
            </button>
            <button type="button" disabled={!canOperateBankTile || deposit < amount} onClick={() => emitAmount("withdrawMoney", amount)}>
              取款
            </button>
            <button type="button" disabled={!canOperateCredit || creditRemaining < amount} onClick={() => emitAmount("borrowCredit", amount)}>
              信用借款
            </button>
            <button type="button" disabled={!canOperateCredit || debt <= 0 || me.cash < Math.min(amount, debt)} onClick={() => emitAmount("repayCredit", amount)}>
              偿还欠款
            </button>
          </div>
          {!canOperateBankTile && <p className="panelHint">存款、取款和彩券兑换需要在你的银行操作阶段办理；借款和还款可随时办理。</p>}

          <label className="modalField">
            彩券数量
            <input
              type="number"
              min={1}
              value={ticketAmount}
              onChange={(event) => setTicketAmount(event.target.value)}
            />
          </label>
          <p className="panelHint">
            金币换彩券：{rate.moneyToTicketCost} 金币 = 1 张；彩券换金币：1 张 = {rate.ticketToMoneyValue} 金币。
          </p>
          <div className="bankActionGrid">
            <button
              type="button"
              disabled={!canOperateBankTile || me.cash < ticketCost}
              onClick={() => socket.emit("exchangeMoneyToTickets", { ticketAmount: tickets })}
            >
              换 {tickets} 张彩券
            </button>
            <button
              type="button"
              disabled={!canOperateBankTile || me.tickets < tickets}
              onClick={() => socket.emit("exchangeTicketsToMoney", { ticketAmount: tickets })}
            >
              换 {ticketReward} 金币
            </button>
          </div>

          <div className="bankSettlementList">
            <strong>最近月结记录</strong>
            {myBankSettlements.length === 0 ? (
              <p>暂无月结记录。</p>
            ) : (
              myBankSettlements.map((settlement) => (
                <article key={settlement.id}>
                  <span>{settlement.year} 年 {settlement.month} 月</span>
                  <small>
                    存息 +{settlement.depositInterest} / 借息 +{settlement.debtInterest} / 强制还款 {settlement.forcedRepayment}
                  </small>
                  <small>
                    本金还 {settlement.principalPaid}，利息还 {settlement.interestPaid}，剩余本金 {settlement.debtPrincipal}，未还息 {settlement.unpaidInterest}
                  </small>
                </article>
              ))
            )}
          </div>

          <div className="modalActions compactActions">
            <button className="secondaryButton" type="button" onClick={() => { setOpen(false); socket.emit("closeExchangePanel"); }}>
              收起
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
