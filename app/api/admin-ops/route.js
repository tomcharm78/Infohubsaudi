export const runtime = "nodejs";
import { createClient } from "@supabase/supabase-js";

// Admin Operations API
// Secured via ADMIN_OPS_KEY environment variable
// Call from Claude Code, MCP server, Postman, or cron jobs

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function unauthorized() {
  return Response.json({ error: "Unauthorized. Set ADMIN_OPS_KEY in env and pass as Bearer token." }, { status: 401 });
}

function verifyAuth(req) {
  const key = process.env.ADMIN_OPS_KEY;
  if (!key) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${key}` || auth === key;
}

export async function POST(req) {
  if (!verifyAuth(req)) return unauthorized();
  const supabase = getSupabase();

  try {
    const body = await req.json();
    const { command, ...params } = body;

    // ===== STATS =====
    if (command === "get-stats") {
      const [{ count: users }, { count: silver }, { count: gold }, { data: payments }, { count: deals }, { count: alerts }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "silver"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_tier", "gold"),
        supabase.from("payments").select("amount_usd,amount_sar").eq("status", "completed"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("regulatory_alerts").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      const totalUSD = (payments || []).reduce((a, p) => a + Number(p.amount_usd), 0);
      const totalSAR = (payments || []).reduce((a, p) => a + Number(p.amount_sar), 0);
      return Response.json({
        users, basic: users - silver - gold, silver, gold,
        revenue_usd: totalUSD, revenue_sar: totalSAR,
        active_deals: deals, active_alerts: alerts,
      });
    }

    // ===== LIST USERS =====
    if (command === "list-users") {
      let q = supabase.from("profiles").select("id,email,full_name,role,subscription_tier,user_type,organization,created_at").order("created_at", { ascending: false });
      if (params.tier) q = q.eq("subscription_tier", params.tier);
      if (params.user_type) q = q.eq("user_type", params.user_type);
      if (params.limit) q = q.limit(params.limit);
      const { data } = await q;
      return Response.json({ users: data || [], count: (data || []).length });
    }

    // ===== CHANGE TIER =====
    if (command === "change-tier") {
      const { email, tier } = params;
      if (!email || !tier) return Response.json({ error: "email and tier required" }, { status: 400 });
      const { data, error } = await supabase.from("profiles").update({ subscription_tier: tier }).eq("email", email).select().single();
      if (error) return Response.json({ error: error.message }, { status: 400 });
      // Notify user
      await supabase.from("notifications").insert({ user_id: data.id, title: `Subscription Updated`, message: `Your subscription has been changed to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`, type: "system" });
      return Response.json({ success: true, user: data });
    }

    // ===== SEND PROMO =====
    if (command === "send-promo") {
      const { code, to, tier: targetTier, email: targetEmail, message } = params;
      if (!code) return Response.json({ error: "code required" }, { status: 400 });
      const { data: promo } = await supabase.from("promo_codes").select("*").eq("code", code.toUpperCase()).limit(1);
      if (!promo?.length) return Response.json({ error: `Promo code '${code}' not found` }, { status: 404 });

      let users = [];
      if (to === "all" || !to) {
        const { data } = await supabase.from("profiles").select("id,email");
        users = data || [];
      } else if (to === "tier" && targetTier) {
        const { data } = await supabase.from("profiles").select("id,email").eq("subscription_tier", targetTier);
        users = data || [];
      } else if (to === "individual" && targetEmail) {
        const { data } = await supabase.from("profiles").select("id,email").eq("email", targetEmail);
        users = data || [];
      }

      const msg = message || `Use code ${code.toUpperCase()} for ${promo[0].discount_value}${promo[0].discount_type === "percentage" ? "%" : promo[0].discount_type === "free_trial_days" ? " days free" : " USD"} off!`;
      let sent = 0;
      for (const u of users) {
        await supabase.from("notifications").insert({ user_id: u.id, title: `🎁 Promo: ${code.toUpperCase()}`, message: msg, type: "promo", metadata: { code: code.toUpperCase() } });
        sent++;
      }
      return Response.json({ success: true, sent, code: code.toUpperCase() });
    }

    // ===== POST ALERT =====
    if (command === "post-alert") {
      const { title, entity, category, summary, impact, source_url, effective_date, is_urgent } = params;
      if (!title || !entity) return Response.json({ error: "title and entity required" }, { status: 400 });
      const { data, error } = await supabase.from("regulatory_alerts").insert({ title, entity, category: category || "announcement", summary: summary || "", impact: impact || "", source_url: source_url || "", effective_date: effective_date || null, is_urgent: is_urgent || false }).select().single();
      if (error) return Response.json({ error: error.message }, { status: 400 });

      if (is_urgent) {
        const { data: golds } = await supabase.from("profiles").select("id").eq("subscription_tier", "gold");
        for (const g of (golds || [])) {
          await supabase.from("notifications").insert({ user_id: g.id, title: `⚠️ ${entity}: ${title}`, message: (summary || "").slice(0, 200), type: "system" });
        }
      }
      return Response.json({ success: true, alert: data });
    }

    // ===== APPROVE TESTIMONIAL =====
    if (command === "approve-testimonial") {
      const { id, featured } = params;
      if (!id) {
        // List pending
        const { data } = await supabase.from("testimonials").select("*").eq("is_approved", false).order("created_at", { ascending: false });
        return Response.json({ pending: data || [], count: (data || []).length });
      }
      const { error } = await supabase.from("testimonials").update({ is_approved: true, is_featured: featured || false }).eq("id", id);
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, approved: id });
    }

    // ===== POST DEAL =====
    if (command === "post-deal") {
      const { title, deal_type, sector, city, funding_amount, currency, description, highlights, user_email } = params;
      if (!title) return Response.json({ error: "title required" }, { status: 400 });
      let userId = null;
      if (user_email) {
        const { data: u } = await supabase.from("profiles").select("id").eq("email", user_email).limit(1);
        if (u?.length) userId = u[0].id;
      }
      const { data, error } = await supabase.from("deals").insert({
        title, deal_type: deal_type || "equity", sector: sector || "", city: city || "",
        funding_amount: funding_amount || "", currency: currency || "SAR",
        description: description || "", highlights: highlights || [],
        user_id: userId, user_email: user_email || "admin", user_name: "Admin", user_org: "Platform Admin",
        status: "active", is_featured: true,
      }).select().single();
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, deal: data });
    }

    // ===== MANAGE CARD =====
    if (command === "manage-card") {
      const { id, action } = params; // action: flag|remove|feature|unfeature
      if (!id || !action) return Response.json({ error: "id and action required" }, { status: 400 });
      const updates = {};
      if (action === "flag") { updates.is_flagged = true; updates.flag_reason = params.reason || "Admin flagged"; }
      if (action === "remove") updates.is_active = false;
      if (action === "feature") updates.is_featured = true;
      if (action === "unfeature") updates.is_featured = false;
      const { error } = await supabase.from("marketplace_cards").update(updates).eq("id", id);
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, action, id });
    }

    // ===== GET CONTACTS =====
    if (command === "get-contacts") {
      const { data } = await supabase.from("visitor_log").select("*").eq("action", "contact_submit").order("created_at", { ascending: false }).limit(params.limit || 50);
      const contacts = (data || []).map(d => ({ email: d.user_email, ...((d.metadata && typeof d.metadata === 'object') ? d.metadata : {}), date: d.created_at }));
      return Response.json({ contacts, count: contacts.length });
    }

    // ===== SEND NOTIFICATION =====
    if (command === "send-notification") {
      const { email, title, message, type } = params;
      if (!email || !title || !message) return Response.json({ error: "email, title, message required" }, { status: 400 });
      const { data: u } = await supabase.from("profiles").select("id").eq("email", email).limit(1);
      if (!u?.length) return Response.json({ error: "User not found" }, { status: 404 });
      await supabase.from("notifications").insert({ user_id: u[0].id, title, message, type: type || "info" });
      return Response.json({ success: true, sent_to: email });
    }

    // ===== CREATE PROMO CODE =====
    if (command === "create-promo") {
      const { code, discount_value, discount_type, max_uses, target_tier, valid_until } = params;
      if (!code) return Response.json({ error: "code required" }, { status: 400 });
      const { data, error } = await supabase.from("promo_codes").insert({
        code: code.toUpperCase(), discount_pct: discount_type === "percentage" ? discount_value : 0,
        discount_type: discount_type || "percentage", discount_value: discount_value || 10,
        max_uses: max_uses || 0, target_tier: target_tier || "all",
        is_active: true, valid_until: valid_until || null,
      }).select().single();
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, promo: data });
    }

    // ===== SEARCH USERS =====
    if (command === "search-users") {
      const { query } = params;
      if (!query) return Response.json({ error: "query required" }, { status: 400 });
      const { data } = await supabase.from("profiles").select("id,email,full_name,role,subscription_tier,user_type,organization").or(`email.ilike.%${query}%,full_name.ilike.%${query}%,organization.ilike.%${query}%`).limit(20);
      return Response.json({ users: data || [] });
    }

    // ===== GET DEAL INTERESTS =====
    if (command === "get-deal-interests") {
      const { deal_id } = params;
      if (deal_id) {
        const { data } = await supabase.from("deal_interests").select("*").eq("deal_id", deal_id).order("created_at", { ascending: false });
        return Response.json({ interests: data || [] });
      }
      // All recent interests
      const { data } = await supabase.from("deal_interests").select("*").order("created_at", { ascending: false }).limit(50);
      return Response.json({ interests: data || [] });
    }

    // ===== GET CONNECTION REQUESTS =====
    if (command === "get-connections") {
      const status = params.status || "pending";
      const { data } = await supabase.from("connection_requests").select("*").eq("status", status).order("created_at", { ascending: false });
      return Response.json({ connections: data || [], count: (data || []).length });
    }

    // ===== HANDLE CONNECTION =====
    if (command === "handle-connection") {
      const { id, action, note } = params; // action: introduced|rejected
      if (!id || !action) return Response.json({ error: "id and action required" }, { status: 400 });
      const { data: req } = await supabase.from("connection_requests").select("*").eq("id", id).single();
      if (!req) return Response.json({ error: "Not found" }, { status: 404 });

      await supabase.from("connection_requests").update({ status: action, admin_note: note || "", handled_at: new Date().toISOString() }).eq("id", id);

      if (action === "introduced") {
        await supabase.from("notifications").insert({ user_id: req.from_user_id, title: "🤝 Introduction Made!", message: `Connected with ${req.to_name}. Contact: ${req.to_email}${note ? `. Note: ${note}` : ""}`, type: "system" });
        await supabase.from("notifications").insert({ user_id: req.to_user_id, title: "🤝 Introduction Made!", message: `${req.from_name} wants to connect. Contact: ${req.from_email}${note ? `. Note: ${note}` : ""}`, type: "system" });
      }
      return Response.json({ success: true, action, id });
    }

    // ===== HELP =====
    if (command === "help") {
      return Response.json({
        commands: [
          { cmd: "get-stats", desc: "Platform statistics (users, revenue, deals)", params: "none" },
          { cmd: "list-users", desc: "List users", params: "tier?, user_type?, limit?" },
          { cmd: "search-users", desc: "Search by email/name/org", params: "query" },
          { cmd: "change-tier", desc: "Change user subscription", params: "email, tier (basic/silver/gold)" },
          { cmd: "send-promo", desc: "Send promo code notification", params: "code, to (all/tier/individual), tier?, email?, message?" },
          { cmd: "create-promo", desc: "Create new promo code", params: "code, discount_value, discount_type, max_uses?, target_tier?" },
          { cmd: "post-alert", desc: "Create regulatory alert", params: "title, entity, category?, summary?, impact?, is_urgent?" },
          { cmd: "approve-testimonial", desc: "Approve testimonial (no id = list pending)", params: "id?, featured?" },
          { cmd: "post-deal", desc: "Create a deal", params: "title, deal_type?, sector?, city?, funding_amount?, description?" },
          { cmd: "manage-card", desc: "Flag/remove/feature card", params: "id, action (flag/remove/feature/unfeature)" },
          { cmd: "get-contacts", desc: "Get contact form submissions", params: "limit?" },
          { cmd: "send-notification", desc: "Send notification to user", params: "email, title, message, type?" },
          { cmd: "get-deal-interests", desc: "Get expressions of interest", params: "deal_id?" },
          { cmd: "get-connections", desc: "Get connection requests", params: "status? (pending/introduced)" },
          { cmd: "handle-connection", desc: "Approve/reject connection", params: "id, action (introduced/rejected), note?" },
        ]
      });
    }

    return Response.json({ error: `Unknown command: ${command}. Use 'help' to see available commands.` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
