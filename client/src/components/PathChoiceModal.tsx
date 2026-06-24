import type { GameState } from "@monopoly/shared";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { socket } from "../socket/socket";

interface PathChoiceModalProps {
  game: GameState;
  playerId: string | null;
}

export function PathChoiceModal({ game, playerId }: PathChoiceModalProps) {
  const [hidden, setHidden] = useState(false);
  const { tileName } = useI18n();
  const pending =
    game.pendingAction?.kind === "choosePath" && game.pendingAction.playerId === playerId
      ? game.pendingAction
      : null;

  useEffect(() => {
    setHidden(false);
  }, [pending?.fromTileId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && pending) {
        setHidden(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending]);

  if (!pending) {
    return null;
  }

  if (hidden) {
    return (
      <button className="continuePendingButton" type="button" onClick={() => setHidden(false)}>
        继续选择路线
      </button>
    );
  }

  return (
    <div className="eventOverlay" onClick={() => setHidden(true)}>
      <article className="eventPopup neutral pathModal" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseButton" type="button" aria-label="临时关闭" onClick={() => setHidden(true)}>
          X
        </button>
        <span className="eventSticker" aria-hidden="true">↗</span>
        <span className="eventHeadline">选择岔路！</span>
        <h3>还剩 {pending.remainingSteps} 步</h3>
        <div className="pathOptions">
          {pending.options.map((option) => {
            const tile = game.tiles.find((item) => item.id === option.tileId);
            return (
              <button key={option.tileId} onClick={() => socket.emit("choosePathDirection", { tileId: option.tileId })}>
                <strong>{option.label}</strong>
                <span>{tile ? tileName(tile) : option.tileId}</span>
              </button>
            );
          })}
        </div>
      </article>
    </div>
  );
}
