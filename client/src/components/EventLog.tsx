import type { GameLogEntry } from "@monopoly/shared";
import { localizeLog } from "../game/localizeLog";
import { useI18n } from "../i18n";

interface EventLogProps {
  logs: GameLogEntry[];
}

export function EventLog({ logs }: EventLogProps) {
  const { language, t } = useI18n();

  return (
    <section className="logPanel">
      <div className="panelHeader">
        <span className="eyebrow">{t("log")}</span>
        <strong>{logs.length}</strong>
      </div>
      <div className="logList">
        {logs.slice(0, 18).map((log) => (
          <p key={log.id}>{localizeLog(log.message, language)}</p>
        ))}
      </div>
    </section>
  );
}
