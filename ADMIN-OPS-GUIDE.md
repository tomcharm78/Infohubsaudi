# Admin Operations API + MCP Server — Setup Guide

## What This Does
- **Admin API**: A single endpoint (`/api/admin-ops`) that accepts 15 commands to manage your entire platform
- **MCP Server**: Connects Claude Desktop to your API so you can manage the platform in plain English

---

## STEP 1: Add Environment Variable to Vercel

Go to Vercel → Your Project → Settings → Environment Variables → Add:

| Variable | Value | Example |
|----------|-------|---------|
| `ADMIN_OPS_KEY` | Any strong random string (you choose) | `hip-admin-2026-xK9mP4qR7` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → service_role key | `eyJhbGci...` (the LONG key, not the anon key) |

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS (Row Level Security) so the API can manage all users. Keep it secret.

Redeploy your app after adding these.

---

## STEP 2: Test the Admin API

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# Replace YOUR-APP with your Vercel URL and YOUR-KEY with your ADMIN_OPS_KEY

# Test: Get help (list all commands)
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "help"}'

# Test: Get platform stats
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "get-stats"}'
```

If you see JSON output with your stats, it's working.

---

## STEP 3: Common Commands (copy-paste these)

### Check platform stats
```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "get-stats"}'
```

### Upgrade a user to Gold
```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "change-tier", "email": "user@example.com", "tier": "gold"}'
```

### Send promo code to all Basic users
```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "send-promo", "code": "GHE2025", "to": "tier", "tier": "basic", "message": "Upgrade now with 10% off!"}'
```

### Post an urgent regulatory alert
```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "post-alert", "title": "New Hospital Licensing Requirements", "entity": "MOH", "category": "new_regulation", "summary": "MOH has updated hospital licensing requirements effective July 2026.", "impact": "All hospital investors must update their license applications.", "is_urgent": true}'
```

### Create a new promo code
```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "create-promo", "code": "NEWCODE", "discount_value": 15, "discount_type": "percentage", "max_uses": 50}'
```

### Approve pending testimonials
```bash
# First, list pending testimonials
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "approve-testimonial"}'

# Then approve one by ID
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "approve-testimonial", "id": "UUID-HERE", "featured": true}'
```

### Handle a pending connection request
```bash
# List pending
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "get-connections"}'

# Introduce both parties
curl -X POST https://YOUR-APP.vercel.app/api/admin-ops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-KEY" \
  -d '{"command": "handle-connection", "id": "UUID-HERE", "action": "introduced", "note": "I recommend you both explore the dental clinic opportunity in Jeddah."}'
```

---

## STEP 4: Set Up Claude Desktop MCP (Optional — for natural language control)

### Prerequisites
- Install Claude Desktop: https://claude.ai/download
- Install Node.js 18+: https://nodejs.org

### Install MCP SDK
```bash
cd your-project-folder
npm install @modelcontextprotocol/sdk
```

### Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config
3. This opens `claude_desktop_config.json` — replace its contents with:

```json
{
  "mcpServers": {
    "healthcare-platform": {
      "command": "node",
      "args": ["/FULL/PATH/TO/YOUR/PROJECT/mcp-server.js"],
      "env": {
        "PLATFORM_URL": "https://YOUR-APP.vercel.app",
        "ADMIN_OPS_KEY": "YOUR-SECRET-KEY-HERE"
      }
    }
  }
}
```

Replace:
- `/FULL/PATH/TO/YOUR/PROJECT/` with the actual path to your project folder
- `YOUR-APP.vercel.app` with your deployed URL
- `YOUR-SECRET-KEY-HERE` with your ADMIN_OPS_KEY

4. Restart Claude Desktop

### Test It

In Claude Desktop, you should now see a 🔧 tools icon. Try saying:

- "Show me platform stats"
- "How many Gold subscribers do we have?"
- "Upgrade user@example.com to Gold"
- "Send the GHE2025 promo code to all Basic users"
- "Post an urgent alert: MOH updated hospital requirements"
- "Are there any pending testimonials to approve?"
- "Show me pending connection requests"
- "Create a new promo code SUMMER15 for 15% off"

Claude will call the appropriate API command and show you the results.

---

## STEP 5: Using with Claude Code (Alternative to Claude Desktop)

If you prefer the terminal:

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# In your project directory
claude

# Then just type naturally:
> "Check my platform stats"
> "Upgrade john@example.com to silver"
> "Post an alert about new SFDA medical device rules"
```

Claude Code can also read your codebase, so it can help you make code changes too.

---

## Security Notes

- `ADMIN_OPS_KEY` is like a master password — keep it secret
- `SUPABASE_SERVICE_ROLE_KEY` bypasses all security — never expose it to the frontend
- Both should only be in Vercel environment variables (server-side only)
- The API rejects any request without the correct Bearer token
- Change your key periodically for security

---

## All 15 Commands Reference

| Command | What it Does | Required Params |
|---------|-------------|-----------------|
| `help` | List all commands | — |
| `get-stats` | Users, revenue, deals, alerts count | — |
| `list-users` | List users with filters | tier?, user_type?, limit? |
| `search-users` | Search by email/name/org | query |
| `change-tier` | Upgrade/downgrade user | email, tier |
| `send-promo` | Send promo to users | code, to?, tier?, email? |
| `create-promo` | Create new promo code | code, discount_value |
| `post-alert` | Create regulatory alert | title, entity |
| `approve-testimonial` | List pending or approve by ID | id?, featured? |
| `post-deal` | Create deal listing | title |
| `manage-card` | Flag/remove/feature card | id, action |
| `get-contacts` | Contact form submissions | limit? |
| `send-notification` | Notify a specific user | email, title, message |
| `get-connections` | Pending connection requests | status? |
| `handle-connection` | Introduce/reject connection | id, action, note? |
