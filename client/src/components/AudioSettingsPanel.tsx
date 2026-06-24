import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { audioManager, type AudioSettings } from "../audio/AudioManager";
import { socket } from "../socket/socket";

interface AudioPanelPlayer {
  id: string;
  nickname: string;
  color?: string | undefined;
  connected?: boolean | undefined;
}

interface AudioSettingsPanelProps {
  roomId?: string | null;
  playerId?: string | null;
  players?: AudioPanelPlayer[];
}

type VoiceSettings = {
  listening: boolean;
  micEnabled: boolean;
  inputDeviceId: string;
  outputDeviceId: string;
  peerVolumes: Record<string, number>;
  peerMuted: Record<string, boolean>;
};

type VoiceParticipant = {
  listening: boolean;
  speaking: boolean;
};

const voiceSettingsKey = "monopoly-online-voice-settings";

function defaultVoiceSettings(): VoiceSettings {
  return {
    listening: false,
    micEnabled: false,
    inputDeviceId: "",
    outputDeviceId: "",
    peerVolumes: {},
    peerMuted: {}
  };
}

function clampVoiceVolume(value: number): number {
  return Math.max(0, Math.min(2.5, Number.isFinite(value) ? value : 0));
}

function loadVoiceSettings(): VoiceSettings {
  try {
    const raw = window.localStorage.getItem(voiceSettingsKey);
    return raw ? { ...defaultVoiceSettings(), ...JSON.parse(raw), micEnabled: false } : defaultVoiceSettings();
  } catch {
    return defaultVoiceSettings();
  }
}

function saveVoiceSettings(settings: VoiceSettings): void {
  window.localStorage.setItem(
    voiceSettingsKey,
    JSON.stringify({ ...settings, micEnabled: false })
  );
}

function supportedRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  return "";
}

export function AudioSettingsPanel({ roomId, playerId, players = [] }: AudioSettingsPanelProps) {
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings());
  const [tracks, setTracks] = useState(audioManager.getBgmTracks());
  const [open, setOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(loadVoiceSettings);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [voiceParticipants, setVoiceParticipants] = useState<Record<string, VoiceParticipant>>({});
  const [voiceStatus, setVoiceStatus] = useState("语音未开启");
  const [loopbackTesting, setLoopbackTesting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceLoopActiveRef = useRef(false);
  const voiceTimersRef = useRef<number[]>([]);
  const playbackQueuesRef = useRef<Record<string, Promise<void>>>({});
  const voiceAudioContextRef = useRef<AudioContext | null>(null);

  const canUseVoice = Boolean(roomId && playerId && navigator.mediaDevices);
  const canUseLoopback = Boolean(
    typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined"
  );
  const peerPlayers = players.filter((player) => player.id !== playerId);

  useEffect(() => audioManager.subscribe(setSettings), []);
  useEffect(() => audioManager.subscribeLibrary(setTracks), []);

  useEffect(() => {
    saveVoiceSettings(voiceSettings);
  }, [voiceSettings]);

  useEffect(() => {
    async function refreshDevices() {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(devices.filter((device) => device.kind === "audioinput"));
      setOutputDevices(devices.filter((device) => device.kind === "audiooutput"));
    }

    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
  }, [open, voiceSettings.listening]);

  useEffect(() => {
    function onVoiceParticipantUpdated(payload: { playerId: string; listening: boolean; speaking: boolean }) {
      setVoiceParticipants((current) => ({
        ...current,
        [payload.playerId]: { listening: payload.listening, speaking: payload.speaking }
      }));
    }

    socket.on("voiceParticipantUpdated", onVoiceParticipantUpdated);
    return () => {
      socket.off("voiceParticipantUpdated", onVoiceParticipantUpdated);
    };
  }, []);

  useEffect(() => {
    function playVoiceChunk(payload: { playerId: string; mimeType: string; chunk: ArrayBuffer }) {
      if (!voiceSettings.listening || payload.playerId === playerId || voiceSettings.peerMuted[payload.playerId]) {
        return;
      }
      const rawChunk = payload.chunk as ArrayBuffer | Uint8Array;
      const chunk =
        rawChunk instanceof ArrayBuffer
          ? rawChunk
          : rawChunk?.buffer instanceof ArrayBuffer
            ? rawChunk.buffer.slice(rawChunk.byteOffset, rawChunk.byteOffset + rawChunk.byteLength)
            : null;
      if (!chunk || chunk.byteLength === 0) {
        return;
      }

      const peerVolume = voiceSettings.peerVolumes[payload.playerId] ?? 1;
      const playbackVolume = clampVoiceVolume(settings.voiceVolume * peerVolume);
      const previous = playbackQueuesRef.current[payload.playerId] ?? Promise.resolve();
      playbackQueuesRef.current[payload.playerId] = previous
        .catch(() => undefined)
        .then(() => playRemoteVoiceChunk(chunk, payload.mimeType || "audio/webm", playbackVolume))
        .catch(() => {
          setVoiceStatus("收到房间语音，但浏览器阻止播放。请先点一次听筒或环回测试。");
        });
    }

    socket.on("voiceChunk", playVoiceChunk);
    return () => {
      socket.off("voiceChunk", playVoiceChunk);
    };
  }, [playerId, settings.voiceVolume, voiceSettings]);

  useEffect(() => {
    return () => {
      stopMic(false);
      voiceAudioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (canUseVoice) {
      return;
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVoiceSettings((current) =>
      current.listening || current.micEnabled
        ? { ...current, listening: false, micEnabled: false }
        : current
    );
  }, [canUseVoice]);

  function update(patch: Partial<AudioSettings>) {
    audioManager.updateSettings(patch);
    audioManager.unlock();
  }

  function selectedPlaylist(): string[] {
    return settings.playlistBgm && settings.playlistBgm.length > 0
      ? settings.playlistBgm
      : tracks.map((track) => track.name);
  }

  function togglePlaylistTrack(trackName: string, checked: boolean) {
    const current = new Set(selectedPlaylist());
    if (checked) {
      current.add(trackName);
    } else {
      current.delete(trackName);
    }
    update({ playlistBgm: [...current] });
  }

  function selectAllTracks() {
    update({ playlistBgm: tracks.map((track) => track.name) });
  }

  function invertTracks() {
    const current = new Set(selectedPlaylist());
    const inverted = tracks.filter((track) => !current.has(track.name)).map((track) => track.name);
    update({ playlistBgm: inverted.length > 0 ? inverted : tracks.map((track) => track.name) });
  }

  function emitVoiceState(next: Partial<VoiceSettings>) {
    if (!roomId || !playerId) {
      return;
    }
    socket.emit("voiceParticipantUpdated", {
      listening: next.listening ?? voiceSettings.listening,
      speaking: next.micEnabled ?? voiceSettings.micEnabled
    });
  }

  function stopMic(emit = true) {
    voiceLoopActiveRef.current = false;
    for (const timer of voiceTimersRef.current) {
      window.clearTimeout(timer);
    }
    voiceTimersRef.current = [];
    if (recorderRef.current?.state && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVoiceSettings((current) => ({ ...current, micEnabled: false }));
    setVoiceStatus("麦克风已关闭");
    if (emit) {
      emitVoiceState({ micEnabled: false });
    }
  }

  async function toggleListening(enabled: boolean) {
    audioManager.unlock();
    if (!canUseVoice) {
      setVoiceStatus("进入房间后才能使用语音。");
      return;
    }
    if (!enabled) {
      stopMic(false);
    }
    setVoiceSettings((current) => ({ ...current, listening: enabled, micEnabled: enabled ? current.micEnabled : false }));
    setVoiceStatus(enabled ? "听筒已开启，可以接收其他玩家语音。自己的声音请用环回测试。" : "听筒已关闭。");
    socket.emit("voiceParticipantUpdated", { listening: enabled, speaking: enabled ? voiceSettings.micEnabled : false });
  }

  async function playAudioElement(audio: HTMLAudioElement, volume: number) {
    const safeVolume = clampVoiceVolume(volume);
    if (safeVolume <= 1) {
      audio.volume = safeVolume;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("voice playback failed"));
        void audio.play().catch(reject);
      });
      return;
    }

    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) {
      audio.volume = 1;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("voice playback failed"));
        void audio.play().catch(reject);
      });
      return;
    }

    const context = voiceAudioContextRef.current ?? new AudioCtor();
    voiceAudioContextRef.current = context;
    await context.resume();
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    gain.gain.value = safeVolume;
    source.connect(gain);
    gain.connect(context.destination);
    audio.volume = 1;
    try {
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("voice playback failed"));
        void audio.play().catch(reject);
      });
    } finally {
      source.disconnect();
      gain.disconnect();
    }
  }

  async function playRemoteVoiceChunk(chunk: ArrayBuffer, mimeType: string, volume: number) {
    const blob = new Blob([chunk], { type: mimeType });
    const url = URL.createObjectURL(blob);
    try {
      const audio = new Audio(url);
      const sinkAudio = audio as HTMLAudioElement & { setSinkId?: (sinkId: string) => Promise<void> };
      if (voiceSettings.outputDeviceId && sinkAudio.setSinkId) {
        await sinkAudio.setSinkId(voiceSettings.outputDeviceId);
      }
      await playAudioElement(audio, volume);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function scheduleVoiceTimer(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    voiceTimersRef.current.push(timer);
  }

  function startVoiceCaptureLoop(stream: MediaStream, mimeType: string) {
    voiceLoopActiveRef.current = true;

    const recordOnce = () => {
      if (!voiceLoopActiveRef.current || !stream.active) {
        return;
      }
      try {
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const chunks: Blob[] = [];
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onstop = () => {
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
            void blob.arrayBuffer().then((chunk) => {
              if (voiceLoopActiveRef.current && chunk.byteLength > 0) {
                socket.emit("voiceChunk", { mimeType: recorder.mimeType || "audio/webm", chunk });
              }
            });
          }
          if (voiceLoopActiveRef.current) {
            scheduleVoiceTimer(recordOnce, 80);
          }
        };
        recorder.onerror = () => {
          setVoiceStatus("麦克风录音中断，正在尝试继续。");
          if (voiceLoopActiveRef.current) {
            scheduleVoiceTimer(recordOnce, 500);
          }
        };
        recorder.start();
        scheduleVoiceTimer(() => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }, 900);
      } catch {
        setVoiceStatus("麦克风录音失败，请检查浏览器权限。");
        stopMic();
      }
    };

    recordOnce();
  }

  async function toggleMic(enabled: boolean) {
    audioManager.unlock();
    if (!enabled) {
      stopMic();
      return;
    }
    if (!voiceSettings.listening) {
      setVoiceStatus("请先开启听筒，再开启麦克风。");
      return;
    }
    if (!canUseVoice || !navigator.mediaDevices?.getUserMedia) {
      setVoiceStatus("当前浏览器不支持麦克风采集。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: voiceSettings.inputDeviceId ? { deviceId: { exact: voiceSettings.inputDeviceId } } : true
      });
      const mimeType = supportedRecorderMimeType();
      streamRef.current = stream;
      startVoiceCaptureLoop(stream, mimeType);
      setVoiceSettings((current) => ({ ...current, micEnabled: true }));
      setVoiceStatus("麦克风已开启。对方也需要开启听筒才可以听到你。");
      socket.emit("voiceParticipantUpdated", { listening: true, speaking: true });
    } catch {
      setVoiceSettings((current) => ({ ...current, micEnabled: false }));
      setVoiceStatus("无法开启麦克风，请检查浏览器权限。");
      socket.emit("voiceParticipantUpdated", { listening: voiceSettings.listening, speaking: false });
    }
  }

  async function runLoopbackTest() {
    if (!canUseLoopback || loopbackTesting) {
      setVoiceStatus("当前浏览器不支持环回测试。");
      return;
    }

    let testStream: MediaStream | null = null;
    let testUrl = "";
    setLoopbackTesting(true);
    setVoiceStatus("正在录制 2 秒环回测试...");

    try {
      testStream = await navigator.mediaDevices.getUserMedia({
        audio: voiceSettings.inputDeviceId ? { deviceId: { exact: voiceSettings.inputDeviceId } } : true
      });
      const mimeType = supportedRecorderMimeType();
      const recorder = new MediaRecorder(testStream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.start();
      window.setTimeout(() => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }, 2000);
      await stopped;

      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (!blob.size) {
        setVoiceStatus("没有录到声音，请检查麦克风输入。");
        return;
      }

      testUrl = URL.createObjectURL(blob);
      const audio = new Audio(testUrl);
      const sinkAudio = audio as HTMLAudioElement & { setSinkId?: (sinkId: string) => Promise<void> };
      if (voiceSettings.outputDeviceId && sinkAudio.setSinkId) {
        try {
          await sinkAudio.setSinkId(voiceSettings.outputDeviceId);
        } catch {
          setVoiceStatus("指定听筒不可用，正在用默认听筒回放...");
        }
      }

      setVoiceStatus("正在回放环回测试...");
      await playAudioElement(audio, settings.voiceVolume);
      setVoiceStatus("环回测试完成：如果能听到自己的声音，麦克风和听筒正常。");
    } catch {
      setVoiceStatus("环回测试失败，请检查麦克风权限或设备选择。");
    } finally {
      testStream?.getTracks().forEach((track) => track.stop());
      if (testUrl) {
        URL.revokeObjectURL(testUrl);
      }
      setLoopbackTesting(false);
    }
  }

  function setPeerMuted(peerId: string, muted: boolean) {
    setVoiceSettings((current) => ({
      ...current,
      peerMuted: { ...current.peerMuted, [peerId]: muted }
    }));
  }

  function setPeerVolume(peerId: string, volume: number) {
    setVoiceSettings((current) => ({
      ...current,
      peerVolumes: { ...current.peerVolumes, [peerId]: clampVoiceVolume(volume) }
    }));
  }

  return (
    <div className="audioSettingsDock">
      <button
        type="button"
        className={`audioToggle ${settings.enabled || voiceSettings.listening ? "on" : ""}`}
        onClick={() => {
          audioManager.unlock();
          setOpen((value) => !value);
        }}
        title="音频与语音设置"
      >
        {voiceSettings.micEnabled ? <Mic size={18} /> : settings.enabled || voiceSettings.listening ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      {open && (
        <section className="audioSettingsPanel">
          <div className="panelHeader">
            <span className="eyebrow">声音</span>
            <strong>音频设置</strong>
          </div>
          <button
            type="button"
            className="secondaryButton loopbackTestButton"
            disabled={!canUseLoopback || loopbackTesting}
            onClick={() => void runLoopbackTest()}
          >
            {loopbackTesting ? "环回测试中..." : "环回测试（麦克风 / 听筒）"}
          </button>
          <label className="audioCheck">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => update({ enabled: event.target.checked })}
            />
            <span className="audioCheckLabel">总开关</span>
          </label>
          <label className="audioCheck">
            <input
              type="checkbox"
              checked={settings.bgmEnabled}
              onChange={(event) => update({ bgmEnabled: event.target.checked })}
            />
            <span className="audioCheckLabel">背景音乐</span>
          </label>
          <label>
            播放模式
            <select
              value={settings.bgmMode}
              disabled={tracks.length === 0 || !settings.bgmEnabled}
              onChange={(event) => update({ bgmMode: event.target.value as AudioSettings["bgmMode"] })}
            >
              <option value="single">单曲循环</option>
              <option value="playlist">勾选列表轮播</option>
            </select>
          </label>
          <label>
            当前曲目
            <select
              value={settings.selectedBgm}
              disabled={tracks.length === 0 || !settings.bgmEnabled}
              onChange={(event) => update({ selectedBgm: event.target.value })}
            >
              {tracks.length === 0 && <option value="">未找到本地音乐</option>}
              {tracks.map((track) => (
                <option key={track.name} value={track.name}>
                  {track.name}
                </option>
              ))}
            </select>
          </label>
          {tracks.length === 0 ? (
            <p className="audioHint">把 mp3 放进 client/public/audio/bgm，并更新 manifest.json 后刷新即可切换；没有文件时会使用内置轻音乐。</p>
          ) : (
            <div className="audioPlaylistBox">
              <div className="audioPlaylistTools">
                <span>轮播范围</span>
                <button type="button" className="secondaryButton" onClick={selectAllTracks}>全选</button>
                <button type="button" className="secondaryButton" onClick={invertTracks}>反选</button>
              </div>
              <div className="audioTrackList">
                {tracks.map((track) => {
                  const checked = selectedPlaylist().includes(track.name);
                  return (
                    <label key={track.name} className="audioTrackItem">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!settings.bgmEnabled}
                        onChange={(event) => togglePlaylistTrack(track.name, event.target.checked)}
                      />
                      <span>{track.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <label>
            BGM 音量
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.bgmVolume}
              onChange={(event) => update({ bgmVolume: Number(event.target.value) })}
            />
          </label>
          <label className="audioCheck">
            <input
              type="checkbox"
              checked={settings.sfxEnabled}
              onChange={(event) => update({ sfxEnabled: event.target.checked })}
            />
            <span className="audioCheckLabel">事件音效</span>
          </label>
          <label>
            音效音量
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(event) => update({ sfxVolume: Number(event.target.value) })}
            />
          </label>
          <label className="audioCheck">
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(event) => update({ voiceEnabled: event.target.checked })}
            />
            <span className="audioCheckLabel">语音播报</span>
          </label>
          <label>
            语音总音量 {Math.round(settings.voiceVolume * 100)}%
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.voiceVolume}
              onChange={(event) => update({ voiceVolume: Number(event.target.value) })}
            />
          </label>
          <div className="audioPlaylistTools">
            <span>音频素材</span>
            <button type="button" className="secondaryButton" onClick={() => void audioManager.reloadLibrary().then(() => setTracks(audioManager.getBgmTracks()))}>
              重新读取清单
            </button>
          </div>
          <p className="audioHint">替换音效入口：把 mp3 放进 client/public/audio/sfx，并在 manifest.json 写入文件名；文件名包含 dice、lucky、fail、portal、stock、cash、victory 等关键词时会自动匹配。缺少文件时游戏会使用内置柔和音效。</p>

          <div className="voiceDivider" />
          <div className="panelHeader compact">
            <span className="eyebrow">房间语音</span>
            <strong>{voiceSettings.micEnabled ? "麦克风开启中" : "语音通话"}</strong>
          </div>
          <label className="audioCheck">
            <input
              type="checkbox"
              checked={voiceSettings.listening}
              disabled={!canUseVoice}
              onChange={(event) => void toggleListening(event.target.checked)}
            />
            <span className="audioCheckLabel">开启听筒</span>
          </label>
          <label className="audioCheck">
            <input
              type="checkbox"
              checked={voiceSettings.micEnabled}
              disabled={!canUseVoice || !voiceSettings.listening}
              onChange={(event) => void toggleMic(event.target.checked)}
            />
            <span className="audioCheckLabel">
              {voiceSettings.micEnabled ? <Mic size={15} /> : <MicOff size={15} />}
              开启麦克风
            </span>
          </label>
          <label>
            麦克风
            <select
              value={voiceSettings.inputDeviceId}
              disabled={!canUseVoice}
              onChange={(event) => setVoiceSettings((current) => ({ ...current, inputDeviceId: event.target.value }))}
            >
              <option value="">默认麦克风</option>
              {inputDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `麦克风 ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            听筒
            <select
              value={voiceSettings.outputDeviceId}
              disabled={!canUseVoice || outputDevices.length === 0}
              onChange={(event) => setVoiceSettings((current) => ({ ...current, outputDeviceId: event.target.value }))}
            >
              <option value="">默认听筒</option>
              {outputDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `听筒 ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <div className="voicePeerList">
            <strong>对手麦克风</strong>
            {peerPlayers.length === 0 ? (
              <p className="audioHint">房间里有其他玩家后，可以单独调节每个人的语音音量或静音。</p>
            ) : (
              peerPlayers.map((player) => {
                const participant = voiceParticipants[player.id];
                const muted = voiceSettings.peerMuted[player.id] ?? false;
                const volume = voiceSettings.peerVolumes[player.id] ?? 1;
                return (
                  <div className="voicePeerItem" key={player.id}>
                    <div className="voicePeerHeader">
                      <span className="voicePeerDot" style={{ backgroundColor: player.color ?? "#7dd3fc" }} />
                      <span>{player.nickname}</span>
                      <em>
                        {participant?.speaking
                          ? "说话中"
                          : participant?.listening
                            ? "已接入"
                            : player.connected === false
                              ? "离线"
                              : "待接入"}
                      </em>
                    </div>
                    <div className="voicePeerControls">
                      <label className="audioCheck voicePeerToggle">
                        <input
                          type="checkbox"
                          checked={!muted}
                          onChange={(event) => setPeerMuted(player.id, !event.target.checked)}
                        />
                        <span className="audioCheckLabel">接收</span>
                      </label>
                      <label>
                        {Math.round(volume * 100)}%
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={volume}
                          disabled={muted}
                          onChange={(event) => setPeerVolume(player.id, Number(event.target.value))}
                        />
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="audioHint">{canUseVoice ? voiceStatus : "进入房间后才能使用房间语音。"}</p>
        </section>
      )}
    </div>
  );
}
