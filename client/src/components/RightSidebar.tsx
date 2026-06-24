import type { GameState, RoomPublicState, TileId } from "@monopoly/shared";
import { ChatBox } from "./ChatBox";
import { EventLog } from "./EventLog";
import { ExchangePanel } from "./ExchangePanel";
import { PlayerPanel } from "./PlayerPanel";
import { PropertyGroupPanel } from "./PropertyGroupPanel";
import { SkillCardPanel } from "./SkillCardPanel";
import { StockMarketPanel } from "./StockMarketPanel";
import { TileDetailPanel } from "./TileDetailPanel";

export type SidebarTab = "players" | "skills" | "stocks" | "properties" | "log";

interface RightSidebarProps {
  game: GameState;
  room: RoomPublicState | null;
  playerId: string | null;
  selectedTileId: TileId | null;
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
}

const tabs: Array<{ id: SidebarTab; label: string }> = [
  { id: "players", label: "玩家" },
  { id: "skills", label: "技能卡" },
  { id: "stocks", label: "股票" },
  { id: "properties", label: "地产" },
  { id: "log", label: "日志" }
];

export function RightSidebar({
  game,
  room,
  playerId,
  selectedTileId,
  activeTab,
  onChangeTab
}: RightSidebarProps) {
  return (
    <aside className="right-sidebar">
      <nav className="sidebarTabs" aria-label="游戏信息面板">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="sidebarContent">
        {activeTab === "players" && (
          <div className="sidebarStack">
            <PlayerPanel game={game} localPlayerId={playerId} hideLocal />
            <ExchangePanel game={game} playerId={playerId} />
            <TileDetailPanel game={game} selectedTileId={selectedTileId} playerId={playerId} />
          </div>
        )}
        {activeTab === "skills" && (
          <div className="sidebarStack">
            <SkillCardPanel game={game} playerId={playerId} />
          </div>
        )}
        {activeTab === "stocks" && (
          <div className="sidebarStack">
            <StockMarketPanel game={game} playerId={playerId} />
          </div>
        )}
        {activeTab === "properties" && (
          <div className="sidebarStack">
            <PropertyGroupPanel game={game} playerId={playerId} />
          </div>
        )}
        {activeTab === "log" && (
          <div className="sidebarStack">
            <EventLog logs={game.logs} />
            <ChatBox messages={room?.chat ?? []} />
          </div>
        )}
      </div>
    </aside>
  );
}
