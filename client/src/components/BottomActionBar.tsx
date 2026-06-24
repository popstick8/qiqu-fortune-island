import type { GameState } from "@monopoly/shared";
import { ActionBar } from "./ActionBar";

interface BottomActionBarProps {
  game: GameState;
  playerId: string | null;
  diceValue: number | null;
  rolling: boolean;
  onOpenStocks: () => void;
  onOpenLog: () => void;
  onRequestBankruptcy: () => void;
}

export function BottomActionBar({
  game,
  playerId,
  diceValue,
  rolling,
  onOpenStocks,
  onOpenLog,
  onRequestBankruptcy
}: BottomActionBarProps) {
  return (
    <footer className="bottom-action-bar">
      <ActionBar
        game={game}
        playerId={playerId}
        diceValue={diceValue}
        rolling={rolling}
        onRequestBankruptcy={onRequestBankruptcy}
      />
      <div className="bottomQuickActions">
        <button type="button" onClick={onOpenStocks}>
          打开股票面板
        </button>
        <button type="button" onClick={onOpenLog}>
          查看日志聊天
        </button>
        {game.status === "ended" && <span className="closedBadge">游戏已结束，操作已锁定</span>}
      </div>
    </footer>
  );
}
