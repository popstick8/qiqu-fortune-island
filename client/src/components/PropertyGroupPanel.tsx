import type { GameState } from "@monopoly/shared";

interface PropertyGroupPanelProps {
  game: GameState;
  playerId: string | null;
}

export function PropertyGroupPanel({ game, playerId }: PropertyGroupPanelProps) {
  if (!playerId) {
    return null;
  }

  return (
    <section className="propertyGroupPanel">
      <div className="panelHeader">
        <span className="eyebrow">地产套装</span>
        <strong>租金翻倍</strong>
      </div>
      <div className="propertyGroupList">
        {Object.values(game.propertyGroups).map((group) => {
          const owned = group.tileIds.filter((tileId) => {
            const property = game.properties[tileId];
            return property?.ownerId === playerId && !property.isMortgaged;
          }).length;
          const mortgaged = group.tileIds.some((tileId) => {
            const property = game.properties[tileId];
            return property?.ownerId === playerId && property.isMortgaged;
          });
          const complete = owned === group.tileIds.length;
          return (
            <article key={group.id} className={complete ? "complete" : ""}>
              <strong>{group.name}</strong>
              <span>{owned} / {group.tileIds.length}</span>
              <small>{mortgaged ? "有地产抵押中，套装暂不生效。" : group.bonusDescription}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
