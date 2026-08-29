# Quick AI — Omarchy Quick Question Overlay

Spotlight-style overlay for fast AI questions. Press a keybind, type a prompt, pick an **agent + model already supported by Omarchy**, get an answer without opening a full TUI.

> **Kind:** `panel` (`keepLoaded: true`) • **IPC:** `omarchy-shell shell toggle omarchy-quick-ai` • **Settings:** `~/.config/omarchy/quick-ai.json`

---

## Features

- Centered overlay (`PanelWindow` + scrim) — not a floating Hyprland window
- One-line prompt input (Enter to send, Esc to close)
- Agent picker: `opencode`, `claude`, `codex`, `agy`, `copilot`, `grok`, `pi`, `omp`, `ori`, `crush` (from `omarchy-default-agent`)
- Model input: `provider/model` (e.g. `openai/gpt-5.6-sol`, `anthropic/claude-opus-4`) — empty = agent default; list via `opencode models`
- Streaming-friendly backend via `bin/quick-ask` dispatcher → `opencode run --format json` or native CLIs
- Copy result (`wl-copy`/`xclip`/`xsel`), Clear, Open in full agent (`omarchy agent prompt`), elapsed timer + error help
- Persists `agent`, `model`, `keepHistory` (+ last 20 Q&A) to `~/.config/omarchy/quick-ai.json`

## Installation

```bash
omarchy plugin add https://github.com/tiagovicente2/omarchy-quick-ai.git --enable
```

## Keybind (recommended)

> `SUPER+K` / `SUPER+ALT+K` / `SUPER+CTRL+K` are taken (Keybindings, Tmux, Herdr).

Add to your Hyprland config (e.g. `~/.config/hypr/bindings.lua` — personal overrides, not `/usr/share/omarchy/...`):

```lua
-- Lua style (omarchy) — suggested: SUPER+SHIFT+K (mnemonic Quick)
o.bind("SUPER + SHIFT + K", "Quick AI", "omarchy-shell shell toggle omarchy-quick-ai")

-- Alternatives if SHIFT+K conflicts with your layout:
-- o.bind("SUPER + ALT + I", "Quick AI", "omarchy-shell shell toggle omarchy-quick-ai")  -- I → AI
-- o.bind("SUPER + CTRL + SHIFT + K", "Quick AI", "omarchy-shell shell toggle omarchy-quick-ai")

-- Or plain Hyprland conf:
-- bind = SUPER SHIFT, K, exec, omarchy-shell shell toggle omarchy-quick-ai
```

Also callable with payload (pre-fill prompt):

```bash
omarchy-shell shell summon omarchy-quick-ai '{"prompt":"explain this error: ..."}'
```

## Configuration

Settings live at `~/.config/omarchy/quick-ai.json` (auto-created):

```json
{
  "agent": "opencode",
  "model": "openai/gpt-5.6-sol",
  "keepHistory": false,
  "history": [],
  "availableModels": ["openai/gpt-5.6-sol", "anthropic/claude-opus-4.7", "opencode/mimo-v2.5-free"]
}
```

- **Agent** — enum from `omarchy-default-agent` (`omarchy default agent <name>`). Plugin reads `~/.config/omarchy/defaults/agent` as fallback default if no settings yet.
- **Model** — free-form `provider/model` for `opencode` (validated `provider/model`, legacy `gpt-…` → `openai/…` etc. via `Model.js:normalizeModel`). Empty = agent default (`opencode` → `openai/gpt-5.6-sol`, others → native default). Refresh list via ↻ button (`opencode models --refresh` → `~/.cache/omarchy/quick-ai/models.json`).
- **keepHistory** — when on, saves last 20 Q&A to disk (`0600`); off = ephemeral (default `false` for privacy). Also stores `modelByAgent`, `allModels`/`availableModels` (up to 300).

To change via CLI:

```bash
# edit file directly, then rescan is not needed — FileView reloads on next open
jq '.model="anthropic/claude-sonnet-4-5"' ~/.config/omarchy/quick-ai.json > /tmp/q && mv /tmp/q ~/.config/omarchy/quick-ai.json
```

## Development

```bash
omarchy plugin validate ./plugins/omarchy-quick-ai
qmllint plugins/omarchy-quick-ai/Panel.qml
node -e "require('./plugins/omarchy-quick-ai/Model.js')"
# live reload after edit:
omarchy-shell shell rescanPlugins
omarchy-shell shell toggle omarchy-quick-ai
```

## TODO / Next

- Streaming `SplitParser` incremental update (replace `StdioCollector` waitForEnd)
- Markdown rendering (selectable `TextEdit` with links)
- Model autocomplete dropdown (from `availableModels` filtered)
- History drawer UI when `keepHistory:true`
- Keybind docs in user Hyprland file auto-suggestion
