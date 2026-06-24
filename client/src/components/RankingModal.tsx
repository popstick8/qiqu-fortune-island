import type { GameState } from "@monopoly/shared";
import { useEffect, useState } from "react";
import { money } from "../game/economy";
import { loadLocalResults, type LocalGameResult } from "../game/localResults";
import { useI18n } from "../i18n";

interface RankingModalProps {
  game: GameState;
  isOpen: boolean;
  onClose: () => void;
  canRestart: boolean;
  onRestart: () => void;
}

export function RankingModal({
  game,
  isOpen,
  onClose,
  canRestart,
  onRestart
}: RankingModalProps) {
  const { t } = useI18n();
  const [localResults, setLocalResults] = useState<LocalGameResult[]>([]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setLocalResults(loadLocalResults());
    }
  }, [isOpen]);

  if (!isOpen || game.status !== "ended") {
    return null;
  }

  return (
    <div className="eventOverlay rankingOverlay" onClick={onClose}>
      <article className="rankingModal" onClick={(event) => event.stopPropagation()}>
        <button className="modalCloseButton" type="button" aria-label="关闭排行榜" onClick={onClose}>
          X
        </button>
        <div className="coinRain" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, index) => (
            <i key={index} />
          ))}
        </div>
        <span className="eyebrow">{t("finalRanking")}</span>
        <h2>{t("gameOver")}</h2>
        <ol>
          {game.rankings.map((rank, index) => (
            <li key={rank.playerId}>
              <span>{index + 1}</span>
              <strong>{rank.nickname}</strong>
              <em>{money(rank.asset)}</em>
            </li>
          ))}
        </ol>
        <section className="localResultHistory">
          <strong>本地战绩记录</strong>
          {localResults.length === 0 ? (
            <p>暂无本地记录。</p>
          ) : (
            localResults.slice(0, 5).map((result) => (
              <article key={result.id}>
                <span>{new Date(result.endedAt).toLocaleString()}</span>
                <b>房间 {result.roomId} · 冠军 {result.winnerName}</b>
                <small>{result.calendar} · {result.rankings.map((rank, index) => `${index + 1}.${rank.nickname} ${money(rank.asset)}`).join(" / ")}</small>
              </article>
            ))
          )}
        </section>
        <div className="rankingActions">
          <button className="primaryButton" type="button" onClick={onClose}>
            关闭排行榜
          </button>
          <button className="secondaryButton" type="button" onClick={onClose}>
            查看地图
          </button>
          <button
            className="restartButton"
            type="button"
            disabled={!canRestart}
            title={canRestart ? "回到准备房，重新开一局。" : "只有房主可以重开。"}
            onClick={onRestart}
          >
            再开一局
          </button>
        </div>
      </article>
    </div>
  );
}
