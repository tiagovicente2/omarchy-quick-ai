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

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function inlineFormat(text) {
  var s = escapeHtml(text)
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#5dade2; text-decoration:underline;">$1</a>')
  // bold & italic combined
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>')
  // bold
  s = s.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
  s = s.replace(/__(.*?)__/g, '<b>$1</b>')
  // italic
  s = s.replace(/\*([^*\n]+)\*/g, '<i>$1</i>')
  s = s.replace(/_([^_\n]+)_/g, '<i>$1</i>')
  // inline code
  s = s.replace(/`([^`]+)`/g, '<code style="background-color:rgba(128,128,128,0.22); font-family:monospace;">&nbsp;$1&nbsp;</code>')
  return s
}

function markdownToRichText(md) {
  if (!md) return ""
  var lines = String(md).split("\n")
  var out = []
  var inTable = false
  var tableRows = []
  var inCode = false
  var codeBuf = []
  var inList = false

  function flushTable() {
    if (tableRows.length === 0) return
    var html = '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse; margin-top:6px; margin-bottom:6px; border-color:rgba(128,128,128,0.35);">'
    for (var r = 0; r < tableRows.length; r++) {
      var isHeader = (r === 0)
      html += '<tr>'
      var cells = tableRows[r]
      for (var c = 0; c < cells.length; c++) {
        var tag = isHeader ? 'th' : 'td'
        var style = isHeader
          ? 'style="background-color:rgba(128,128,128,0.25); font-weight:bold; text-align:left; padding:4px 8px;"'
          : 'style="padding:4px 8px;"'
        html += '<' + tag + ' ' + style + '>' + inlineFormat(cells[c].trim()) + '</' + tag + '>'
      }
      html += '</tr>'
    }
    html += '</table>'
    out.push(html)
    tableRows = []
    inTable = false
  }

  function flushList() {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    var trimmed = line.trim()

    // Code blocks
    if (trimmed.indexOf("```") === 0) {
      if (inTable) flushTable()
      flushList()
      if (inCode) {
        out.push('<pre style="background-color:rgba(128,128,128,0.15); padding:8px; border-radius:4px; font-family:monospace; margin:6px 0;"><code>' + escapeHtml(codeBuf.join("\n")) + '</code></pre>')
        codeBuf = []
        inCode = false
      } else {
        inCode = true
        codeBuf = []
      }
      continue
    }
    if (inCode) {
      codeBuf.push(line)
      continue
    }

    // Tables: lines starting and ending with |
    if (trimmed.indexOf("|") === 0 && trimmed.lastIndexOf("|") === trimmed.length - 1 && trimmed.length > 2) {
      flushList()
      // Skip separator rows like |---|---|
      if (/^\|(\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        continue
      }
      var parts = trimmed.slice(1, trimmed.length - 1).split("|")
      tableRows.push(parts)
      inTable = true
      continue
    } else if (inTable) {
      flushTable()
    }

    // Lists
    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inList) {
        out.push('<ul style="margin:4px 0; padding-left:20px;">')
        inList = true
      }
      out.push('<li style="margin:2px 0;">' + inlineFormat(trimmed.replace(/^[-*+]\s+/, '')) + '</li>')
      continue
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList) {
        out.push('<ol style="margin:4px 0; padding-left:20px;">')
        inList = true
      }
      out.push('<li style="margin:2px 0;">' + inlineFormat(trimmed.replace(/^\d+\.\s+/, '')) + '</li>')
      continue
    } else {
      flushList()
    }

    // Headers
    if (trimmed.indexOf("### ") === 0) {
      out.push('<h3 style="margin-top:10px; margin-bottom:4px; font-size:1.1em; font-weight:bold;">' + inlineFormat(trimmed.slice(4)) + '</h3>')
    } else if (trimmed.indexOf("## ") === 0) {
      out.push('<h2 style="margin-top:14px; margin-bottom:6px; font-size:1.25em; font-weight:bold;">' + inlineFormat(trimmed.slice(3)) + '</h2>')
    } else if (trimmed.indexOf("# ") === 0) {
      out.push('<h1 style="margin-top:16px; margin-bottom:8px; font-size:1.4em; font-weight:bold;">' + inlineFormat(trimmed.slice(2)) + '</h1>')
    } else if (trimmed.indexOf("> ") === 0) {
      out.push('<blockquote style="border-left:3px solid rgba(128,128,128,0.5); margin:6px 0; padding-left:8px; font-style:italic;">' + inlineFormat(trimmed.slice(2)) + '</blockquote>')
    } else if (trimmed === "") {
      out.push('<p style="margin:4px 0;"></p>')
    } else {
      out.push('<p style="margin:4px 0; line-height:1.4;">' + inlineFormat(trimmed) + '</p>')
    }
  }

  if (inTable) flushTable()
  if (inList) flushList()
  if (inCode) {
    out.push('<pre style="background-color:rgba(128,128,128,0.15); padding:8px; border-radius:4px; font-family:monospace; margin:6px 0;"><code>' + escapeHtml(codeBuf.join("\n")) + '</code></pre>')
  }

  return out.join("\n")
}

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
    clamp: clamp,
    markdownToRichText: markdownToRichText
  }
}
