import { ArrowUpCircle, CheckCircle2, Dice5, Flag, ShoppingBag } from "lucide-react";
import type { GameState } from "@monopoly/shared";
import { useI18n } from "../i18n";
import { socket } from "../socket/socket";
import { Dice } from "./Dice";

interface ActionBarProps {
  game: GameState;
  playerId: string | null;
  diceValue: number | null;
  rolling: boolean;
  onRequestBankruptcy: () => void;
}

function upgradeCost(price: number, level: number): number {
  return Math.round(price * (0.45 + level * 0.15));
}

export function ActionBar({ game, playerId, diceValue, rolling, onRequestBankruptcy }: ActionBarProps) {
  const { t } = useI18n();
  const currentPlayerId = game.turnOrder[game.currentTurnIndex] ?? null;
  const isMyTurn = Boolean(playerId && currentPlayerId === playerId && game.status === "playing");
  const me = game.players.find((player) => player.id === playerId) ?? null;
  const pendingTileId =
    game.pendingAction?.kind === "buyProperty" ||
    game.pendingAction?.kind === "upgradeProperty" ||
    game.pendingAction?.kind === "stockMarket" ||
    game.pendingAction?.kind === "skillShop"
      ? game.pendingAction.tileId
      : undefined;
  const pendingTile = pendingTileId
    ? game.tiles.find((tile) => tile.id === pendingTileId) ?? null
    : null;
  const pendingProperty = pendingTile ? game.properties[pendingTile.id] : null;

  const canRoll = isMyTurn && game.phase === "waitingRoll" && !rolling;
  const canBuyProperty = isMyTurn && game.pendingAction?.kind === "buyProperty" && Boolean(pendingTile);
  const canUpgrade =
    isMyTurn && game.pendingAction?.kind === "upgradeProperty" && Boolean(pendingTile && pendingProperty);
  const canEndTurn = isMyTurn && game.phase === "tileAction" && game.pendingAction?.kind !== "choosePath";
  const canDeclareBankruptcy =
    Boolean(playerId && me && !me.bankrupt) && game.status === "playing" && game.settings.allowVoluntaryBankruptcy;
  const bankruptcyTitle =
    game.status === "ended"
      ? "游戏已结束，不能主动破产。"
      : me?.bankrupt
        ? "你已经破产。"
        : !game.settings.allowVoluntaryBankruptcy
          ? "本房间未开启主动破产。"
          : !me
            ? "尚未加入本局。"
            : "主动破产前会再次确认。";

  return (
    <section className="actionBar">
      <div className="diceDock">
        <Dice
          value={diceValue ?? game.dice}
          rolling={rolling}
          disabled={!canRoll}
          onClick={() => socket.emit("rollDice")}
        />
      </div>
      <div className="buttonRow">
        {game.status === "ended" && <span className="closedBadge">游戏已结束</span>}
        <span className={`turnHint ${canRoll ? "active" : ""}`}>
          <Dice5 size={18} />
          {t("roll")}
        </span>
        <button
          disabled={!canBuyProperty}
          onClick={() => pendingTile && socket.emit("buyProperty", { tileId: pendingTile.id })}
        >
          <ShoppingBag size={18} />
          {t("buy")} {pendingTile?.price ? pendingTile.price : ""}
        </button>
        <button
          disabled={!canUpgrade}
          onClick={() => pendingTile && socket.emit("upgradeProperty", { tileId: pendingTile.id })}
        >
          <ArrowUpCircle size={18} />
          {t("upgrade")}{" "}
          {pendingTile && pendingProperty
            ? upgradeCost(pendingTile.price ?? 0, pendingProperty.level)
            : ""}
        </button>
        <button disabled={!canEndTurn} onClick={() => socket.emit("endTurn")}>
          <CheckCircle2 size={18} />
          {t("endTurn")}
        </button>
        <button
          className="dangerButton"
          disabled={!canDeclareBankruptcy}
          title={bankruptcyTitle}
          onClick={onRequestBankruptcy}
        >
          <Flag size={18} />
          {t("declareBankruptcy")}
        </button>
      </div>
    </section>
  );
}
