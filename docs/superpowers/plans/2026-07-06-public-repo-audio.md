# Public Repository Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove local third-party audio and lyrics from Git history without changing local playback.

**Architecture:** Git ignores local audio directories and the generated manifest while retaining directory placeholders. The existing Vite plugin continues to discover local files and supplies an empty manifest for fresh public clones.

**Tech Stack:** Git, Vite, React, TypeScript, PowerShell

## Global Constraints

- Do not delete, move, rename, or modify local MP3/LRC files.
- Do not change the audio playback implementation.
- Remove restricted files from the sole unpublished commit, not only from the current index.

---

### Task 1: Protect and untrack local audio

**Files:**
- Modify: `.gitignore`
- Create: `client/public/audio/bgm/.gitkeep`
- Create: `client/public/audio/sfx/.gitkeep`

- [ ] Record file counts, byte count, aggregate SHA-256, and manifest SHA-256.
- [ ] Add ignore rules for local audio, lyrics, and generated manifest.
- [ ] Run `git rm -r --cached client/public/audio/bgm client/public/audio/sfx client/public/audio/manifest.json` so only index entries are removed.
- [ ] Stage the placeholder files.
- [ ] Recompute the baseline and require an exact match.

### Task 2: Document public audio behavior

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/specs/2026-07-06-public-repo-audio-design.md`
- Create: `docs/superpowers/plans/2026-07-06-public-repo-audio.md`

- [ ] Explain that public clones use built-in audio until licensed files are added locally.
- [ ] Explain that Git LFS does not provide copyright permission.

### Task 3: Rewrite and verify the unpublished initial commit

**Files:**
- Modify: Git history only

- [ ] Amend the sole local commit with the cleaned index.
- [ ] Expire unreachable reflogs and prune unreachable restricted blobs.
- [ ] Confirm no MP3 or LRC path exists in `git ls-files` or `git rev-list --objects --all`.
- [ ] Run `npm.cmd run typecheck` and require exit code 0.
- [ ] Run `npm.cmd run build` and require exit code 0.
- [ ] Confirm the local audio baseline still matches exactly.
