#!/usr/bin/env node

// MCP Server for Healthcare Investor Platform
// This allows Claude Desktop to manage your platform via natural language
// 
// Setup: 
// 1. Install: npm install @modelcontextprotocol/sdk
// 2. Copy this file + claude_desktop_config.json
// 3. Update PLATFORM_URL and ADMIN_OPS_KEY in config
// 4. Add to Claude Desktop settings

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_OPS_KEY || "";

async function callAPI(command, params = {}) {
  const res = await fetch(`${PLATFORM_URL}/api/admin-ops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ADMIN_KEY}`,
    },
    body: JSON.stringify({ command, ...params }),
  });
  return res.json();
}

const server = new Server(
  { name: "healthcare-platform", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    { name: "get_stats", description: "Get platform statistics — users, revenue, deals, alerts", inputSchema: { type: "object", properties: {} } },
    { name: "list_users", description: "List platform users, optionally filtered by tier or type", inputSchema: { type: "object", properties: { tier: { type: "string", enum: ["basic", "silver", "gold"] }, user_type: { type: "string", enum: ["investor", "seeker", "partner"] }, limit: { type: "number" } } } },
    { name: "search_users", description: "Search users by email, name, or organization", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
    { name: "change_tier", description: "Change a user's subscription tier", inputSchema: { type: "object", properties: { email: { type: "string" }, tier: { type: "string", enum: ["basic", "silver", "gold"] } }, required: ["email", "tier"] } },
    { name: "send_promo", description: "Send a promo code to users via notification", inputSchema: { type: "object", properties: { code: { type: "string" }, to: { type: "string", enum: ["all", "tier", "individual"] }, tier: { type: "string" }, email: { type: "string" }, message: { type: "string" } }, required: ["code"] } },
    { name: "create_promo", description: "Create a new promo code", inputSchema: { type: "object", properties: { code: { type: "string" }, discount_value: { type: "number" }, discount_type: { type: "string", enum: ["percentage", "fixed_usd", "free_trial_days"] }, max_uses: { type: "number" }, target_tier: { type: "string" } }, required: ["code", "discount_value"] } },
    { name: "post_alert", description: "Create a regulatory alert from a government entity", inputSchema: { type: "object", properties: { title: { type: "string" }, entity: { type: "string" }, category: { type: "string", enum: ["new_regulation", "amendment", "deadline", "announcement", "opportunity", "warning"] }, summary: { type: "string" }, impact: { type: "string" }, source_url: { type: "string" }, effective_date: { type: "string" }, is_urgent: { type: "boolean" } }, required: ["title", "entity"] } },
    { name: "approve_testimonial", description: "List pending testimonials (no params) or approve one by ID", inputSchema: { type: "object", properties: { id: { type: "string" }, featured: { type: "boolean" } } } },
    { name: "post_deal", description: "Create a deal in the deal flow pipeline", inputSchema: { type: "object", properties: { title: { type: "string" }, deal_type: { type: "string" }, sector: { type: "string" }, city: { type: "string" }, funding_amount: { type: "string" }, description: { type: "string" }, highlights: { type: "array", items: { type: "string" } } }, required: ["title"] } },
    { name: "manage_card", description: "Flag, remove, or feature a marketplace card", inputSchema: { type: "object", properties: { id: { type: "string" }, action: { type: "string", enum: ["flag", "remove", "feature", "unfeature"] }, reason: { type: "string" } }, required: ["id", "action"] } },
    { name: "get_contacts", description: "Get contact form submissions", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
    { name: "send_notification", description: "Send a notification to a specific user", inputSchema: { type: "object", properties: { email: { type: "string" }, title: { type: "string" }, message: { type: "string" }, type: { type: "string" } }, required: ["email", "title", "message"] } },
    { name: "get_connections", description: "Get pending connection/facilitation requests", inputSchema: { type: "object", properties: { status: { type: "string" } } } },
    { name: "handle_connection", description: "Introduce or reject a connection request", inputSchema: { type: "object", properties: { id: { type: "string" }, action: { type: "string", enum: ["introduced", "rejected"] }, note: { type: "string" } }, required: ["id", "action"] } },
  ]
}));

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  const command = name.replace(/_/g, "-");
  
  try {
    const result = await callAPI(command, args || {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }] };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
