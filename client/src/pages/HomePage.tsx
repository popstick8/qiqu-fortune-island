import { DoorOpen, PlusCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { ConnectionHint } from "../components/ConnectionHint";
import { useI18n } from "../i18n";

interface HomePageProps {
  initialNickname: string;
  onCreate: (nickname: string) => void;
  onJoin: (roomId: string, nickname: string) => void;
}

export function HomePage({ initialNickname, onCreate, onJoin }: HomePageProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [roomId, setRoomId] = useState("");
  const { t } = useI18n();

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate(nickname);
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onJoin(roomId, nickname);
  }

  return (
    <main className="homePage">
      <section className="homePanel">
        <span className="eyebrow">{t("tagline")}</span>
        <h1>{t("appName")}</h1>
        <p>{t("homeSubtitle")}</p>
        <label>
          {t("nickname")}
          <input value={nickname} maxLength={18} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <div className="homeActions">
          <form onSubmit={submitCreate}>
            <button className="primaryButton" type="submit">
              <PlusCircle size={18} />
              {t("createRoom")}
            </button>
          </form>
          <form onSubmit={submitJoin} className="joinForm">
            <input
              value={roomId}
              maxLength={6}
              onChange={(event) => setRoomId(event.target.value.toUpperCase())}
              placeholder={t("roomId")}
            />
            <button type="submit">
              <DoorOpen size={18} />
              {t("join")}
            </button>
          </form>
        </div>
        <ConnectionHint />
      </section>
    </main>
  );
}
