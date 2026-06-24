import { defineConfig, type ResolvedConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function audioManifestPlugin() {
  const audioExtensions = new Set([".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac", ".webm"]);
  let publicAudioDir = join(process.cwd(), "public", "audio");
  let manifestPath = join(publicAudioDir, "manifest.json");

  function listAudio(folder: string) {
    try {
      return readdirSync(join(publicAudioDir, folder), { withFileTypes: true })
        .filter((item) => item.isFile())
        .map((item) => item.name)
        .filter((name) => audioExtensions.has(name.slice(name.lastIndexOf(".")).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "zh-CN"));
    } catch {
      return [];
    }
  }

  function writeManifest() {
    mkdirSync(join(publicAudioDir, "bgm"), { recursive: true });
    mkdirSync(join(publicAudioDir, "sfx"), { recursive: true });
    writeFileSync(
      manifestPath,
      JSON.stringify({ bgm: listAudio("bgm"), sfx: listAudio("sfx") }, null, 2),
      "utf8"
    );
  }

  return {
    name: "qiqu-audio-manifest",
    configResolved(config: ResolvedConfig) {
      publicAudioDir = join(config.publicDir, "audio");
      manifestPath = join(publicAudioDir, "manifest.json");
    },
    buildStart: writeManifest,
    configureServer(server: ViteDevServer) {
      writeManifest();
      const refresh = () => {
        writeManifest();
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add(join(publicAudioDir, "bgm"));
      server.watcher.add(join(publicAudioDir, "sfx"));
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    }
  };
}

export default defineConfig({
  plugins: [audioManifestPlugin(), react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      ".trycloudflare.com"
    ]
  }
});
