import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import type { ChatMessage } from "@monopoly/shared";
import { useI18n } from "../i18n";
import { socket } from "../socket/socket";

interface ChatBoxProps {
  messages: ChatMessage[];
}

export function ChatBox({ messages }: ChatBoxProps) {
  const [draft, setDraft] = useState("");
  const { t } = useI18n();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) {
      return;
    }
    socket.emit("chatMessage", { message });
    setDraft("");
  }

  return (
    <section className="chatPanel">
      <div className="panelHeader">
        <span className="eyebrow">{t("chat")}</span>
        <strong>{messages.length}</strong>
      </div>
      <div className="chatMessages">
        {messages.slice(-30).map((message) => (
          <p key={message.id}>
            <strong>{message.nickname}</strong>
            <span>{message.message}</span>
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="chatForm">
        <input
          value={draft}
          maxLength={180}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("message")}
        />
        <button aria-label={t("sendMessage")} type="submit">
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
