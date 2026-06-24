import type { ReactNode } from "react";

interface GameLayoutProps {
  top: ReactNode;
  left?: ReactNode;
  board: ReactNode;
  sidebar: ReactNode;
  bottom: ReactNode;
  children?: ReactNode;
}

export function GameLayout({ top, left, board, sidebar, bottom, children }: GameLayoutProps) {
  return (
    <div className="game-layout">
      {top}
      <div className="main-game-area">
        {left}
        <section className="board-shell">{board}</section>
        {sidebar}
      </div>
      {bottom}
      {children}
    </div>
  );
}
