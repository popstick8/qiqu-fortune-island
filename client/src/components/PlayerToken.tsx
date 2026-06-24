import type { PlayerState } from "@monopoly/shared";
import type { CSSProperties } from "react";
import { AvatarPortrait } from "./AvatarPortrait";

interface PlayerTokenProps {
  player: PlayerState;
  index: number;
  isCurrent: boolean;
  isLocal: boolean;
  offset: { x: number; y: number };
}

export function PlayerToken({ player, isCurrent, isLocal, offset }: PlayerTokenProps) {
  return (
    <div
      className={`playerToken zodiacToken ${isCurrent ? "currentPiece" : ""} ${isLocal ? "localPiece" : ""}`}
      style={{
        "--token-color": player.color,
        "--token-x": `${offset.x}px`,
        "--token-y": `${offset.y}px`
      } as CSSProperties}
      title={player.nickname}
    >
      <AvatarPortrait avatarId={player.selectedAvatarId} fallbackColor={player.color} size="token" label={player.nickname} />
    </div>
  );
}
