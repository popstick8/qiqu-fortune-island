# Public Repository Audio Design

## Goal

Prepare the project for a public GitHub repository without publishing local commercial music or lyrics, while preserving the existing local audio library and playback behavior.

## Design

- Keep all files under `client/public/audio/bgm` and `client/public/audio/sfx` on the local machine.
- Stop tracking media, lyrics, and the generated `client/public/audio/manifest.json`.
- Keep `.gitkeep` placeholders so fresh clones contain the expected directories.
- Continue using the existing Vite audio manifest plugin. It scans local folders at startup and build time, so no playback code changes are required.
- Rewrite the sole unpublished initial commit so restricted blobs are absent from repository history.
- Verify local media counts and aggregate hashes before and after cleanup.
- Verify type checking and production builds after cleanup.

## Public Clone Behavior

A fresh clone starts with empty audio folders. Vite generates an empty manifest, and the client uses its built-in synthesized background music and effects. Users may add audio they are licensed to use locally; those files remain ignored by Git.

## Safety

Only Git index entries and unpublished Git history are changed. Audio files in the working tree are not deleted, moved, renamed, or modified.
