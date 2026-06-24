export type AudioScene = "lobby" | "game" | "ended" | "silent";

export type SfxKind =
  | "dice"
  | "move"
  | "lucky"
  | "bad"
  | "portal"
  | "stock"
  | "buy"
  | "bankrupt"
  | "victory"
  | "notice";

export interface AudioTrack {
  name: string;
  url: string;
}

export interface AudioSettings {
  enabled: boolean;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  selectedBgm: string;
  bgmMode: "single" | "playlist";
  playlistBgm: string[];
}

interface AudioManifest {
  bgm?: string[];
  sfx?: string[];
}

const storageKey = "qiqu-monopoly-audio-settings";
const defaultsVersionKey = "qiqu-monopoly-audio-defaults-v2";

const defaultSettings: AudioSettings = {
  enabled: true,
  bgmEnabled: true,
  sfxEnabled: false,
  voiceEnabled: false,
  bgmVolume: 0.28,
  sfxVolume: 0.65,
  voiceVolume: 1,
  selectedBgm: "",
  bgmMode: "single",
  playlistBgm: []
};

const sceneLoops: Record<AudioScene, number[]> = {
  lobby: [392, 494, 523, 494, 440, 392],
  game: [523, 659, 784, 659, 698, 784, 659],
  ended: [523, 659, 784, 1046, 784, 659],
  silent: []
};

const sfxNotes: Record<SfxKind, number[]> = {
  dice: [320, 460, 620],
  move: [520],
  lucky: [660, 880, 1040],
  bad: [260, 190],
  portal: [420, 720, 360],
  stock: [740, 620],
  buy: [520, 660],
  bankrupt: [220, 160, 120],
  victory: [660, 880, 1100, 1320],
  notice: [580, 760]
};

function clampUnitVolume(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clampVoiceVolume(value: number): number {
  return Math.max(0, Math.min(2.5, Number.isFinite(value) ? value : 0));
}

function encodeAudioUrl(folder: "bgm" | "sfx", filename: string): string {
  return `/audio/${folder}/${filename.split("/").map(encodeURIComponent).join("/")}`;
}

function loadSettings(): AudioSettings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const loaded = raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<AudioSettings>) } : { ...defaultSettings };
    if (!window.localStorage.getItem(defaultsVersionKey)) {
      loaded.sfxEnabled = false;
      loaded.voiceEnabled = false;
      window.localStorage.setItem(defaultsVersionKey, "1");
      window.localStorage.setItem(storageKey, JSON.stringify(loaded));
    }
    return loaded;
  } catch {
    return defaultSettings;
  }
}

class GameAudioManager {
  private context: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private fileBgm: HTMLAudioElement | null = null;
  private scene: AudioScene = "silent";
  private loopTimer: number | null = null;
  private noteIndex = 0;
  private settings: AudioSettings = loadSettings();
  private tracks: AudioTrack[] = [];
  private playlistIndex = 0;
  private sfxFiles = new Map<SfxKind, AudioTrack>();
  private listeners = new Set<(settings: AudioSettings) => void>();
  private libraryListeners = new Set<(tracks: AudioTrack[]) => void>();
  private manifestLoaded = false;

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  getBgmTracks(): AudioTrack[] {
    return [...this.tracks];
  }

  subscribe(listener: (settings: AudioSettings) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => this.listeners.delete(listener);
  }

  subscribeLibrary(listener: (tracks: AudioTrack[]) => void): () => void {
    this.libraryListeners.add(listener);
    listener(this.getBgmTracks());
    void this.loadLibrary();
    return () => this.libraryListeners.delete(listener);
  }

  async loadLibrary(): Promise<void> {
    if (this.manifestLoaded) {
      return;
    }
    this.manifestLoaded = true;
    try {
      const response = await fetch(`/audio/manifest.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const manifest = (await response.json()) as AudioManifest;
      this.tracks = (manifest.bgm ?? []).map((name) => ({ name, url: encodeAudioUrl("bgm", name) }));
      this.sfxFiles = new Map(
        (manifest.sfx ?? []).map((name) => {
          const key = this.guessSfxKind(name);
          return [key, { name, url: encodeAudioUrl("sfx", name) }] as const;
        })
      );
      for (const listener of this.libraryListeners) {
        listener(this.getBgmTracks());
      }
      if (this.tracks.length > 0) {
        const missingPlaylist = !this.settings.playlistBgm || this.settings.playlistBgm.length === 0;
        const nextSettings: Partial<AudioSettings> = {};
        if (!this.settings.selectedBgm && this.tracks[0]) {
          nextSettings.selectedBgm = this.tracks[0].name;
        }
        if (missingPlaylist) {
          nextSettings.playlistBgm = this.tracks.map((track) => track.name);
        }
        if (Object.keys(nextSettings).length > 0) {
          this.updateSettings(nextSettings);
        }
      }
    } catch {
      this.tracks = [];
      this.sfxFiles = new Map();
    }
  }

  async reloadLibrary(): Promise<void> {
    this.manifestLoaded = false;
    await this.loadLibrary();
  }

  updateSettings(patch: Partial<AudioSettings>): void {
    this.settings = {
      ...this.settings,
      ...patch,
      bgmVolume: clampUnitVolume(patch.bgmVolume ?? this.settings.bgmVolume),
      sfxVolume: clampUnitVolume(patch.sfxVolume ?? this.settings.sfxVolume),
      voiceVolume: clampVoiceVolume(patch.voiceVolume ?? this.settings.voiceVolume)
    };
    this.settings.playlistBgm = [...new Set(this.settings.playlistBgm ?? [])].filter((name) =>
      this.tracks.length === 0 || this.tracks.some((track) => track.name === name)
    );
    window.localStorage.setItem(storageKey, JSON.stringify(this.settings));
    this.applyVolumes();
    for (const listener of this.listeners) {
      listener(this.getSettings());
    }
    this.refreshBgm();
  }

  setScene(scene: AudioScene): void {
    this.scene = scene;
    this.noteIndex = 0;
    void this.loadLibrary().then(() => this.refreshBgm());
  }

  unlock(): void {
    void this.ensureContext()?.resume();
    void this.loadLibrary().then(() => this.refreshBgm());
  }

  playSfx(kind: SfxKind): void {
    if (!this.settings.enabled || !this.settings.sfxEnabled) {
      return;
    }
    const file = this.sfxFiles.get(kind);
    if (file) {
      const audio = new Audio(file.url);
      audio.volume = this.settings.sfxVolume;
      void audio.play().catch(() => this.playProceduralSfx(kind));
      return;
    }
    this.playProceduralSfx(kind);
  }

  speak(text: string): void {
    if (!this.settings.enabled || !this.settings.voiceEnabled || !("speechSynthesis" in window)) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.volume = clampUnitVolume(this.settings.voiceVolume);
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  private guessSfxKind(filename: string): SfxKind {
    const lower = filename.toLowerCase();
    if (lower.includes("dice")) return "dice";
    if (lower.includes("move") || lower.includes("step")) return "move";
    if (lower.includes("win") || lower.includes("lucky") || lower.includes("coin")) return "lucky";
    if (lower.includes("fail") || lower.includes("bad")) return "bad";
    if (lower.includes("portal") || lower.includes("teleport")) return "portal";
    if (lower.includes("stock") || lower.includes("market") || lower.includes("bell")) return "stock";
    if (lower.includes("buy") || lower.includes("cash")) return "buy";
    if (lower.includes("bankrupt")) return "bankrupt";
    if (lower.includes("victory") || lower.includes("end")) return "victory";
    return "notice";
  }

  private refreshBgm(): void {
    if (!this.settings.enabled || !this.settings.bgmEnabled || this.scene === "silent") {
      this.stopFileBgm();
      this.stopLoop();
      return;
    }
    const selected = this.resolveCurrentTrack();
    if (selected) {
      this.stopLoop();
      this.startFileBgm(selected);
    } else {
      this.stopFileBgm();
      this.startLoop();
    }
  }

  private startFileBgm(track: AudioTrack): void {
    if (!this.fileBgm || this.fileBgm.dataset.src !== track.url) {
      this.stopFileBgm();
      this.fileBgm = new Audio(track.url);
      this.fileBgm.dataset.src = track.url;
      this.fileBgm.onended = () => {
        if (this.settings.bgmMode === "playlist") {
          this.playNextBgm();
        }
      };
    }
    this.fileBgm.loop = this.settings.bgmMode !== "playlist";
    this.fileBgm.volume = this.settings.bgmVolume;
    void this.fileBgm.play().catch(() => {
      this.stopFileBgm();
      this.startLoop();
    });
  }

  private getActivePlaylist(): AudioTrack[] {
    if (this.tracks.length === 0) {
      return [];
    }
    const selectedNames = new Set(this.settings.playlistBgm ?? []);
    const selectedTracks = this.tracks.filter((track) => selectedNames.has(track.name));
    return selectedTracks.length > 0 ? selectedTracks : this.tracks;
  }

  private resolveCurrentTrack(): AudioTrack | undefined {
    if (this.settings.bgmMode === "playlist") {
      const playlist = this.getActivePlaylist();
      if (playlist.length === 0) {
        return undefined;
      }
      const selectedIndex = playlist.findIndex((track) => track.name === this.settings.selectedBgm);
      if (selectedIndex >= 0) {
        this.playlistIndex = selectedIndex;
        return playlist[selectedIndex];
      }
      const track = playlist[this.playlistIndex % playlist.length] ?? playlist[0];
      if (track) {
        this.settings.selectedBgm = track.name;
        window.localStorage.setItem(storageKey, JSON.stringify(this.settings));
      }
      return track;
    }
    return this.tracks.find((track) => track.name === this.settings.selectedBgm) ?? this.tracks[0];
  }

  private playNextBgm(): void {
    const playlist = this.getActivePlaylist();
    if (playlist.length === 0) {
      return;
    }
    const currentIndex = playlist.findIndex((track) => track.name === this.settings.selectedBgm);
    this.playlistIndex = currentIndex >= 0 ? currentIndex + 1 : this.playlistIndex + 1;
    const next = playlist[this.playlistIndex % playlist.length] ?? playlist[0];
    if (!next) {
      return;
    }
    this.settings.selectedBgm = next.name;
    window.localStorage.setItem(storageKey, JSON.stringify(this.settings));
    for (const listener of this.listeners) {
      listener(this.getSettings());
    }
    this.refreshBgm();
  }

  private stopFileBgm(): void {
    if (this.fileBgm) {
      this.fileBgm.pause();
      this.fileBgm = null;
    }
  }

  private ensureContext(): AudioContext | null {
    if (!("AudioContext" in window) && !("webkitAudioContext" in window)) {
      return null;
    }
    if (!this.context) {
      const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
      this.context = new AudioCtor();
      this.bgmGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.bgmGain.connect(this.context.destination);
      this.sfxGain.connect(this.context.destination);
      this.applyVolumes();
    }
    return this.context;
  }

  private applyVolumes(): void {
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.settings.enabled && this.settings.bgmEnabled ? this.settings.bgmVolume : 0;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.settings.enabled && this.settings.sfxEnabled ? this.settings.sfxVolume : 0;
    }
    if (this.fileBgm) {
      this.fileBgm.volume = this.settings.enabled && this.settings.bgmEnabled ? this.settings.bgmVolume : 0;
    }
  }

  private startLoop(): void {
    const context = this.ensureContext();
    if (!context || !this.bgmGain || this.loopTimer !== null) {
      return;
    }
    const tick = () => {
      const notes = sceneLoops[this.scene] ?? [];
      if (notes.length === 0 || !this.context || !this.bgmGain) {
        return;
      }
      const note = notes[this.noteIndex % notes.length] ?? 440;
      this.playTone(note, 0.16, this.context.currentTime, this.bgmGain, "triangle");
      this.noteIndex += 1;
    };
    tick();
    this.loopTimer = window.setInterval(tick, this.scene === "game" ? 310 : 460);
  }

  private stopLoop(): void {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private playProceduralSfx(kind: SfxKind): void {
    const context = this.ensureContext();
    if (!context || !this.sfxGain) {
      return;
    }
    const notes = sfxNotes[kind] ?? sfxNotes.notice;
    const waveByKind: Partial<Record<SfxKind, OscillatorType>> = {
      bad: "triangle",
      bankrupt: "triangle",
      lucky: "sine",
      notice: "sine",
      portal: "sine",
      stock: "sine",
      victory: "triangle"
    };
    notes.forEach((frequency, index) => {
      this.playTone(frequency, 0.11, context.currentTime + index * 0.092, this.sfxGain!, waveByKind[kind] ?? "triangle");
    });
  }

  private playTone(frequency: number, duration: number, start: number, gain: GainNode, type: OscillatorType): void {
    const context = this.ensureContext();
    if (!context) {
      return;
    }
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const audioManager = new GameAudioManager();
