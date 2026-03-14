# VizX — Claude ↔ Figma MCP Bridge

Chat with Claude and watch your Figma canvas update in real time.

---

## How it works

```
You chat with Claude
  → Claude calls MCP tools
    → MCP server (hosted on Railway) sends commands via WebSocket
      → Figma plugin executes them on the canvas
```

---

## Setup (one time, ~10 minutes)

### Step 1 — Deploy to Railway

1. Fork or upload this repo to your GitHub account
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select this repo — Railway auto-detects Node.js and deploys
4. Once deployed, go to **Settings → Networking → Generate Domain**
5. Copy your public domain — it looks like `your-app.railway.app`

### Step 2 — Load the Figma plugin

1. Open **Figma Desktop** (must be the desktop app, not browser)
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Select `figma-plugin/manifest.json` from this repo
4. **VizX Claude Bridge** will appear under Development plugins

### Step 3 — Connect the plugin to Railway

1. Open any Figma file
2. Run: **Plugins → Development → VizX Claude Bridge**
3. Replace `YOUR-APP.railway.app` in the URL field with your actual Railway domain
4. Click **Connect**
5. You should see **"Connected — ready for Claude commands"**

### Step 4 — Register with Claude Desktop

Open (or create):
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add this block, updating the path to where you cloned this repo:
```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/FULL/PATH/TO/figma-mcp/server.js"]
    }
  }
}
```

Restart Claude Desktop.

### Step 5 — Chat

Example prompts to try:

> "Create a pitchbook slide called Revenue Growth with the headline '$281M revenue by 2030'"

> "Add a stacked bar chart showing LiveWell vs acquired revenue 2026-2030"

> "Add stat cards: $45M 2026 revenue, $281M 2030 revenue, 6.2× growth"

> "Update the headline to 'Revenue scales 6× through roll-up strategy'"

---

## Tools Claude can call

| Tool | What it does |
|------|-------------|
| `ping_figma` | Check connection status |
| `list_frames` | List all frames on the page |
| `create_slide` | Create a pitchbook slide frame |
| `add_stat_cards` | Add KPI stat cards to a slide |
| `add_chart` | Add a chart as editable SVG vectors |
| `add_legend` | Add a color legend row |
| `add_text` | Add a text node |
| `update_text` | Edit existing text by name |
| `delete_node` | Remove a node |
| `focus_frame` | Zoom viewport to a frame |
| `set_fill_color` | Change background color |
| `duplicate_frame` | Clone a frame as a template |

## Chart types

- `bar` — grouped bar chart
- `stacked_bar` — stacked bar chart
- `line` — line chart with area fill
- `horizontal_bar` — horizontal bars (tornado, bridge)
- `combo` — bars + line on dual axis

All charts render as **editable SVG vector paths** — not images.

---

## Environment variables (Railway)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP health check (set automatically by Railway) |
| `WS_PORT` | `9001` | WebSocket port the Figma plugin connects to |

---

## Troubleshooting

**"Figma plugin is not connected"** — Make sure the plugin panel is open in Figma Desktop.

**"Connection error" in plugin** — Check your Railway domain is correct and the service is awake.

**Charts look stretched** — Resize the SVG node in Figma; it scales to frame width on import.

**Claude doesn't see figma tools** — Restart Claude Desktop after editing the config file.

**Railway goes to sleep** — Disable sleep under Railway → Settings, or upgrade to a paid plan.

---

*Copyright © 2026 Vizx Global. All rights reserved.*
