import { AVATAR_DEFINITIONS, type AvatarDefinition } from "@monopoly/shared";
import type { CSSProperties } from "react";

interface AvatarPortraitProps {
  avatarId?: string | null | undefined;
  fallbackColor?: string | undefined;
  label?: string | undefined;
  size?: "tiny" | "small" | "medium" | "large" | "token";
  className?: string | undefined;
}

export function getAvatarDefinition(avatarId?: string | null | undefined): AvatarDefinition {
  return (
    AVATAR_DEFINITIONS.find((avatar) => avatar.id === avatarId) ??
    AVATAR_DEFINITIONS[0]
  );
}

export function AvatarPortrait({
  avatarId,
  fallbackColor,
  label,
  size = "medium",
  className
}: AvatarPortraitProps) {
  const avatar = getAvatarDefinition(avatarId);
  const imageUrl = size === "token" ? avatar.tokenUrl : size === "large" ? avatar.portraitUrl : avatar.thumbUrl;
  const style = {
    "--avatar-main": avatar.themeColor ?? fallbackColor ?? "#3b82f6",
    "--avatar-accent": avatar.accentColor ?? "#facc15"
  } as CSSProperties;

  return (
    <span
      className={`avatarPortrait avatar-${size} ${className ?? ""}`}
      style={style}
      title={label ?? avatar.nameZh}
      aria-label={label ?? avatar.nameZh}
    >
      <img src={imageUrl} alt="" aria-hidden="true" draggable={false} />
    </span>
  );
}
