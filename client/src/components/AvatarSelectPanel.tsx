import { AVATAR_DEFINITIONS, type RoomPublicState } from "@monopoly/shared";
import { socket } from "../socket/socket";
import { AvatarPortrait } from "./AvatarPortrait";

interface AvatarSelectPanelProps {
  room: RoomPublicState;
  playerId: string | null;
}

export function AvatarSelectPanel({ room, playerId }: AvatarSelectPanelProps) {
  const me = room.players.find((player) => player.id === playerId) ?? null;
  const locked = room.status !== "lobby";

  return (
    <section className="avatarSelectPanel">
      <div className="panelHeader">
        <span className="eyebrow">选择角色</span>
        <strong>十二星座小人</strong>
      </div>
      <div className="avatarGrid">
        {AVATAR_DEFINITIONS.map((avatar) => {
          const occupiedById = room.avatarLocks[avatar.id];
          const occupiedBy = occupiedById ? room.players.find((player) => player.id === occupiedById) : null;
          const isMine = me?.selectedAvatarId === avatar.id;
          const occupiedByOther = Boolean(occupiedBy && occupiedBy.id !== playerId);
          return (
            <button
              key={avatar.id}
              className={`avatarChoice ${isMine ? "selected" : ""} ${occupiedByOther ? "occupied" : ""}`}
              type="button"
              disabled={locked || occupiedByOther || !playerId}
              onClick={() => socket.emit("selectAvatar", { avatarId: avatar.id })}
              title={occupiedByOther ? `已被 ${occupiedBy?.nickname ?? "其他玩家"} 选择` : avatar.nameZh}
            >
              <AvatarPortrait avatarId={avatar.id} size="small" />
              <span>
                <strong>{avatar.nameZh}</strong>
                <small>{avatar.nameEn}</small>
              </span>
              <em>{isMine ? "已选" : occupiedByOther ? `已被 ${occupiedBy?.nickname ?? "占用"}` : "可选"}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}
