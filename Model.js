function supportedAgents() {
  return [
    { value: "opencode", label: "OpenCode", icon: "󰚩" },
    { value: "claude", label: "Claude Code", icon: "󰧑" },
    { value: "codex", label: "Codex", icon: "󰘦" },
    { value: "agy", label: "Antigravity", icon: "󰚩" },
    { value: "copilot", label: "Copilot", icon: "󰚩" },
    { value: "grok", label: "Grok", icon: "󰚩" },
    { value: "pi", label: "Pi", icon: "󰚩" },
    { value: "omp", label: "Oh My Pi", icon: "󰚩" },
    { value: "ori", label: "Ori", icon: "󰚩" },
    { value: "crush", label: "Crush", icon: "󰚩" }
  ]
}

function agentLabel(agent) {
  var list = supportedAgents()
  for (var i = 0; i < list.length; i++) if (list[i].value === agent) return list[i].label
  return agent || "opencode"
}

function isValidAgent(agent) {
  var list = supportedAgents()
  for (var i = 0; i < list.length; i++) if (list[i].value === agent) return true
  return false
}

// model is "provider/model" for opencode, or empty for default.
// We let any non-empty string through but sanitize for shell quoting.
function normalizeModel(model) {
  var s = String(model || "").trim()
  // disallow newlines, control chars, overly long
  if (s.indexOf("\n") >= 0 || s.indexOf("\r") >= 0) return ""
  if (s.length > 120) s = s.slice(0, 120)
  s = s.trim()
  if (s === "") return ""
  // legacy short names without provider prefix: auto-prefix for backward compat
  if (s.indexOf("/") === -1) {
    if (/^gpt-/.test(s) || /^codex/.test(s)) s = "openai/" + s
    else if (/^claude-/.test(s)) s = "anthropic/" + s
    else if (/^gemini-/.test(s)) s = "google/" + s
    else return ""
  }
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._:\/-]+$/.test(s)) return ""
  return s
}

function defaultModelFor(agent) {
  var s = String(agent || "")
  if (s === "opencode") return "openai/gpt-5.6-sol"
  return ""
}

function parseModelsOutput(raw) {
  var lines = String(raw || "").split("\n")
  var out = []
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue
    // opencode models prints one "provider/model" per line
    if (line.indexOf("/") >= 0) out.push(line)
  }
  return out
}

function providerFromModel(modelId) {
  var idx = String(modelId || "").indexOf("/")
  if (idx < 0) return ""
  return String(modelId).slice(0, idx)
}

function shortModelName(modelId) {
  var idx = String(modelId || "").indexOf("/")
  if (idx < 0) return String(modelId)
  return String(modelId).slice(idx + 1)
}

function modelsForAgent(agent, allModels) {
  var a = String(agent || "").toLowerCase()
  var list = Array.isArray(allModels) ? allModels : []
  // opencode shows the full list (dynamic, from cache)
  if (a === "" || a === "opencode") return list.slice()

  var filtered = []
  for (var i = 0; i < list.length; i++) {
    var m = String(list[i])
    var low = m.toLowerCase()
    var slashIdx = low.indexOf("/")
    var prov = slashIdx >= 0 ? low.slice(0, slashIdx) : ""
    var name = slashIdx >= 0 ? low.slice(slashIdx + 1) : low

    if (a === "claude") {
      if (prov === "anthropic" || prov === "claude" || name.indexOf("claude") >= 0) filtered.push(m)
    } else if (a === "codex") {
      if (prov === "openai" || name.indexOf("gpt") >= 0 || name.indexOf("codex") >= 0) filtered.push(m)
    } else if (a === "agy" || a === "gemini" || a === "antigravity") {
      if (prov === "google" || name.indexOf("gemini") >= 0) filtered.push(m)
    } else if (a === "copilot") {
      if (prov === "github-copilot" || low.indexOf("copilot") >= 0) filtered.push(m)
    } else if (a === "grok") {
      if (prov === "x-ai" || name.indexOf("grok") >= 0) filtered.push(m)
    } else if (a === "pi" || a === "omp") {
      if (prov === "pi" || prov === "omp" || /(^|[\/_-])pi([\/_-]|$)/.test(low)) filtered.push(m)
    } else if (a === "ori" || a === "openrouter") {
      if (prov === "openrouter" || low.indexOf("openrouter") >= 0) filtered.push(m)
    } else if (a === "crush") {
      if (prov === "crush" || /(^|[\/_-])crush([\/_-]|$)/.test(low)) filtered.push(m)
    }
  }
  return filtered
}

function authHelpFor(agent) {
  if (agent === "claude") return "Run `claude auth login` or `opencode providers` to add Anthropic key."
  if (agent === "codex") return "Run `codex login` or add OpenAI key."
  if (agent === "agy") return "Run `agy` to authenticate Antigravity."
  if (agent === "opencode") return "Run `opencode providers` or check ~/.local/share/opencode/auth.json"
  if (agent === "copilot") return "Run `gh auth login` and ensure Copilot access."
  if (agent === "grok") return "Set XAI key or run `grok auth`."
  return "Check provider credentials."
}

function stripThinking(text) {
  var s = String(text || "")
  // Remove <thinking>...</thinking> blocks that some agents emit
  return s.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim()
}

function formatDuration(ms) {
  if (!(ms > 0)) return "now"
  var s = Math.floor(ms / 1000)
  if (s < 60) return s + "s"
  var minutes = Math.floor(s / 60)
  var hours = Math.floor(minutes / 60)
  var days = Math.floor(hours / 24)
  if (days > 0) return days + "d " + (hours % 24) + "h"
  if (hours > 0) return hours + "h " + (minutes % 60) + "m"
  return minutes + "m " + (s % 60) + "s"
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

if (typeof module !== "undefined") {
  module.exports = {
    supportedAgents: supportedAgents,
    agentLabel: agentLabel,
    isValidAgent: isValidAgent,
    normalizeModel: normalizeModel,
    defaultModelFor: defaultModelFor,
    parseModelsOutput: parseModelsOutput,
    providerFromModel: providerFromModel,
    shortModelName: shortModelName,
    modelsForAgent: modelsForAgent,
    authHelpFor: authHelpFor,
    stripThinking: stripThinking,
    formatDuration: formatDuration,
    clamp: clamp
  }
}
