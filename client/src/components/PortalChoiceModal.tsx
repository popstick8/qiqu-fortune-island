import type { GameState } from "@monopoly/shared";
import { useEffect, useState } from "react";
import { socket } from "../socket/socket";

interface PortalChoiceModalProps {
  game: GameState;
  playerId: string | null;
}

export function PortalChoiceModal({ game, playerId }: PortalChoiceModalProps) {
  const [hidden, setHidden] = useState(false);
  const pending =
    game.pendingAction?.kind === "portalChoice" && game.pendingAction.playerId === playerId
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
        继续处理传送门
      </button>
    );
  }

  return (
    <div className="eventOverlay" onClick={() => setHidden(true)}>
      <article className="eventPopup neutral portalChoiceModal" onClick={(event) => event.stopPropagation()}>
        <span className="eventSticker" aria-hidden="true">门</span>
        <span className="eventHeadline">选择传送目的地</span>
        <h3>你进入了中央传送门</h3>
        <p>当前彩券：🎟 {me.tickets}</p>
        <div className="pathOptions">
          {pending.options.map((option) => {
            const tile = game.tiles.find((item) => item.id === option.targetTileId);
            const disabled = me.tickets < option.costTickets;
            return (
              <button
                key={`${option.targetTileId}-${option.label}`}
                disabled={disabled}
                onClick={() => socket.emit("choosePortalDestination", { targetTileId: option.targetTileId })}
              >
                <strong>{tile?.name ?? option.label}</strong>
                <span>
                  {option.costTickets > 0
                    ? `消耗 ${option.costTickets} 彩券${disabled ? "（彩券不足）" : ""}`
                    : "免费"}
                </span>
              </button>
            );
          })}
        </div>
        <button className="secondaryButton" onClick={() => socket.emit("cancelPortalChoice")}>
          取消传送 / 留在原地
        </button>
        <button className="secondaryButton" onClick={() => setHidden(true)}>
          临时关闭
        </button>
      </article>
    </div>
  );
}
