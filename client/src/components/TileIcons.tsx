import type { TileType } from "@monopoly/shared";

interface TileIconProps {
  type: TileType;
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconShadow" d="M8 39h32" />
      <path className="iconRoof" d="M8 24 24 10l16 14" />
      <path className="iconWall" d="M13 23h29v22H13z" />
      <path className="iconDoor" d="M23 31h9v14h-9z" />
      <circle className="iconCoin" cx="39" cy="13" r="6" />
    </svg>
  );
}

function StartIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconFlagPole" d="M13 8v36" />
      <path className="iconFlag" d="M14 9h25l-5 8 5 8H14z" />
      <circle className="iconCoin" cx="31" cy="34" r="8" />
      <text x="14" y="39" className="iconText">
        GO
      </text>
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconRoof" d="M6 19 24 8l18 11z" />
      <path className="iconWall" d="M9 20h33v24H9z" />
      <path className="iconStripe" d="M15 25v15M24 25v15M33 25v15" />
      <circle className="iconCoin" cx="37" cy="12" r="6" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconChart" d="M8 38h34" />
      <path className="iconArrow" d="m10 34 9-10 8 5 12-17" />
      <path className="iconArrowHead" d="M35 12h8v8" />
      <circle className="iconCoin" cx="16" cy="14" r="6" />
    </svg>
  );
}

function LotteryIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle className="iconWheel" cx="24" cy="24" r="17" />
      <path className="iconWheelLine" d="M24 7v34M7 24h34M12 12l24 24M36 12 12 36" />
      <circle className="iconCenter" cx="24" cy="24" r="5" />
    </svg>
  );
}

function ArcadeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconWall" d="M8 15h32v25H8z" />
      <path className="iconRoof" d="M13 9h22l5 6H8z" />
      <circle className="iconButton" cx="30" cy="29" r="3" />
      <circle className="iconButton2" cx="36" cy="25" r="3" />
      <path className="iconJoy" d="M17 25v8M13 29h8" />
    </svg>
  );
}

function LuckyIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconStar" d="m24 6 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z" />
      <path className="iconSmile" d="M17 25c3 5 11 5 14 0" />
      <circle className="iconEye" cx="18" cy="21" r="2" />
      <circle className="iconEye" cx="30" cy="21" r="2" />
    </svg>
  );
}

function BadLuckIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconCloud" d="M14 34h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 8 8 0 0 0-1 18z" />
      <path className="iconLightning" d="M25 26h7l-8 15 1-10h-7l7-13z" />
      <circle className="iconTear" cx="15" cy="38" r="3" />
    </svg>
  );
}

function TaxIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconPaper" d="M13 7h24v36H13z" />
      <path className="iconStripe" d="M18 18h14M18 26h14M18 34h10" />
      <text x="16" y="16" className="iconPercent">
        %
      </text>
    </svg>
  );
}

function TeleportIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle className="iconPortal" cx="24" cy="24" r="17" />
      <path className="iconSwirl" d="M15 25c3-9 18-10 18 0 0 8-13 8-13 2 0-5 8-5 8 0" />
      <circle className="iconSpark" cx="36" cy="13" r="3" />
      <circle className="iconSpark" cx="12" cy="36" r="2" />
    </svg>
  );
}

function SkillShopIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconWall" d="M9 15h30v30H9z" />
      <path className="iconRoof" d="M13 8h22l4 7H9z" />
      <path className="iconStripe" d="M16 23h16M16 30h16" />
      <circle className="iconCoin" cx="36" cy="12" r="6" />
      <text x="17" y="41" className="iconText">
        CARD
      </text>
    </svg>
  );
}

function PlazaIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconStar" d="m24 7 4 11 12 1-9 7 3 12-10-6-10 6 3-12-9-7 12-1z" />
      <path className="iconShadow" d="M10 42h28" />
    </svg>
  );
}

function JailIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconWall" d="M9 10h30v34H9z" />
      <path className="iconStripe" d="M16 12v30M24 12v30M32 12v30" />
      <path className="iconRoof" d="M12 8h24l4 7H8z" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path className="iconWall" d="M8 16h32v28H8z" />
      <path className="iconRoof" d="M14 8h20l6 8H8z" />
      <path className="iconStripe" d="M24 20v17M16 28h16" />
      <circle className="iconCoin" cx="37" cy="12" r="5" />
    </svg>
  );
}

export function TileIcon({ type }: TileIconProps) {
  if (type === "start") {
    return <StartIcon />;
  }
  if (type === "property") {
    return <HouseIcon />;
  }
  if (type === "bank") {
    return <BankIcon />;
  }
  if (type === "stock") {
    return <StockIcon />;
  }
  if (type === "lottery") {
    return <LotteryIcon />;
  }
  if (type === "arcade") {
    return <ArcadeIcon />;
  }
  if (type === "chance") {
    return <LuckyIcon />;
  }
  if (type === "misfortune") {
    return <BadLuckIcon />;
  }
  if (type === "tax") {
    return <TaxIcon />;
  }
  if (type === "skillShop") {
    return <SkillShopIcon />;
  }
  if (type === "jail" || type === "go_jail") {
    return <JailIcon />;
  }
  if (type === "hospital" || type === "hospital_entry") {
    return <HospitalIcon />;
  }
  if (type === "reward" || type === "draw_card") {
    return <LuckyIcon />;
  }
  if (type === "plaza" || type === "safe_landing" || type === "empty") {
    return <PlazaIcon />;
  }
  return <TeleportIcon />;
}
