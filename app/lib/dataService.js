import { supabase } from "./supabase";
import { SEED_INVESTORS } from "./data";
import { SAMPLE_PROVIDERS, SAMPLE_OPPORTUNITIES } from "./saudiData";

// ===== VISITOR TRACKING =====
export async function trackVisit(userId, email, tier, page, action = "view", metadata = {}) {
  try {
    await supabase.from("visitor_log").insert({
      user_id: userId, user_email: email,
      subscription_tier: tier || "basic",
      page, action, metadata,
      session_id: getSessionId(),
    });
  } catch(e) {}
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_sid");
  if (!sid) { sid = Date.now().toString(36) + Math.random().toString(36).slice(2); sessionStorage.setItem("_sid", sid); }
  return sid;
}

// ===== INVESTORS =====
export async function fetchInvestors(tier, isAdmin) {
  try {
    // Basic users get limited fields via the view
    if (tier === "basic" && !isAdmin) {
      const { data, error } = await supabase.from("investors_basic").select("*").order("last_updated", { ascending: false });
      if (error) throw error;
      // Transform to match app format
      return (data || []).map(row => ({
        ...row,
        domains: typeof row.domains === "string" ? JSON.parse(row.domains) : (row.domains || []),
        cSuite: [],
        portfolio: [],
        lastUpdated: row.last_updated,
      }));
    }

    // Silver/Gold/Admin get full data
    const { data, error } = await supabase.from("investors").select("*").order("last_updated", { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToInvestor);
  } catch (e) {
    console.error("Fetch investors error:", e);
    // Fallback to localStorage if Supabase tables don't exist yet
    return loadLocalInvestors();
  }
}

function rowToInvestor(row) {
  return {
    id: row.id,
    company: row.company,
    country: row.country || "",
    city: row.city || "",
    website: row.website || "",
    type: row.type || "",
    aum: row.aum || "",
    region: row.region || "GCC",
    domains: typeof row.domains === "string" ? JSON.parse(row.domains) : (row.domains || []),
    stages: typeof row.stages === "string" ? JSON.parse(row.stages) : (row.stages || []),
    description: row.description || "",
    cSuite: typeof row.c_suite === "string" ? JSON.parse(row.c_suite) : (row.c_suite || []),
    portfolio: typeof row.portfolio === "string" ? JSON.parse(row.portfolio) : (row.portfolio || []),
    totalInvestments: row.total_investments || 0,
    activeDeals: row.active_deals || 0,
    status: row.status || "Active",
    source: row.source || "",
    logo: row.logo || "",
    createdAt: row.created_at,
    lastUpdated: row.last_updated,
  };
}

function investorToRow(inv) {
  return {
    id: inv.id,
    company: inv.company,
    country: inv.country || "",
    city: inv.city || "",
    website: inv.website || "",
    type: inv.type || "",
    aum: inv.aum || "",
    region: inv.region || "GCC",
    domains: inv.domains || [],
    stages: inv.stages || [],
    description: inv.description || "",
    c_suite: inv.cSuite || [],
    portfolio: inv.portfolio || [],
    total_investments: inv.totalInvestments || 0,
    active_deals: inv.activeDeals || 0,
    status: inv.status || "Active",
    source: inv.source || "",
    logo: inv.logo || "",
    last_updated: new Date().toISOString(),
  };
}

export async function upsertInvestor(inv) {
  const row = investorToRow(inv);
  const { data, error } = await supabase.from("investors").upsert(row).select().single();
  if (error) throw error;
  return rowToInvestor(data);
}

export async function deleteInvestor(id) {
  const { error } = await supabase.from("investors").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkDeleteInvestors(ids) {
  const { error } = await supabase.from("investors").delete().in("id", ids);
  if (error) throw error;
}

export async function bulkInsertInvestors(investors) {
  const rows = investors.map(investorToRow);
  const { data, error } = await supabase.from("investors").upsert(rows).select();
  if (error) throw error;
  return (data || []).map(rowToInvestor);
}

// ===== MAP PROVIDERS =====
export async function fetchProviders() {
  try {
    const { data, error } = await supabase.from("map_providers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ ...r, type: "provider" }));
  } catch(e) {
    return loadLocalMap().providers;
  }
}

export async function upsertProvider(p) {
  const { type, ...row } = p;
  const { data, error } = await supabase.from("map_providers").upsert({ ...row, type: undefined }).select().single();
  if (error) throw error;
  return { ...data, type: "provider" };
}

export async function deleteProvider(id) {
  await supabase.from("map_providers").delete().eq("id", id);
}

export async function bulkInsertProviders(items) {
  const rows = items.map(({ type, ...r }) => r);
  const { data, error } = await supabase.from("map_providers").upsert(rows).select();
  if (error) throw error;
  return (data || []).map(r => ({ ...r, type: "provider" }));
}

export async function bulkDeleteProviders(ids) {
  await supabase.from("map_providers").delete().in("id", ids);
}

// ===== MAP OPPORTUNITIES =====
export async function fetchOpportunities() {
  try {
    const { data, error } = await supabase.from("map_opportunities").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ ...r, type: "opportunity" }));
  } catch(e) {
    return loadLocalMap().opportunities;
  }
}

export async function upsertOpportunity(o) {
  const { type, ...row } = o;
  const { data, error } = await supabase.from("map_opportunities").upsert({ ...row, type: undefined }).select().single();
  if (error) throw error;
  return { ...data, type: "opportunity" };
}

export async function deleteOpportunity(id) {
  await supabase.from("map_opportunities").delete().eq("id", id);
}

export async function bulkInsertOpportunities(items) {
  const rows = items.map(({ type, ...r }) => r);
  const { data, error } = await supabase.from("map_opportunities").upsert(rows).select();
  if (error) throw error;
  return (data || []).map(r => ({ ...r, type: "opportunity" }));
}

// ===== MIGRATION: localStorage → Supabase (run once) =====
export async function migrateLocalToSupabase() {
  if (typeof window === "undefined") return { migrated: false };

  const migKey = "_supabase_migrated_v1";
  if (localStorage.getItem(migKey)) return { migrated: false, reason: "already_done" };

  let investorCount = 0, providerCount = 0, oppCount = 0;

  try {
    // Migrate investors
    const invKey = "hc_inv_platform_v3";
    const invData = localStorage.getItem(invKey);
    if (invData) {
      const parsed = JSON.parse(invData);
      if (parsed.investors?.length) {
        // Check if Supabase already has data
        const { count } = await supabase.from("investors").select("id", { count: "exact", head: true });
        if (!count || count === 0) {
          await bulkInsertInvestors(parsed.investors);
          investorCount = parsed.investors.length;
        }
      }
    } else {
      // Seed with default data if nothing exists
      const { count } = await supabase.from("investors").select("id", { count: "exact", head: true });
      if (!count || count === 0) {
        await bulkInsertInvestors(JSON.parse(JSON.stringify(SEED_INVESTORS)));
        investorCount = SEED_INVESTORS.length;
      }
    }

    // Migrate map data
    const mapKeys = ["sa_map_v4", "sa_map_v3", "sa_map_v2", "sa_invest_map_v1"];
    let mapData = null;
    for (const k of mapKeys) {
      const d = localStorage.getItem(k);
      if (d) { mapData = JSON.parse(d); break; }
    }

    if (mapData?.p?.length) {
      const { count } = await supabase.from("map_providers").select("id", { count: "exact", head: true });
      if (!count || count === 0) {
        await bulkInsertProviders(mapData.p);
        providerCount = mapData.p.length;
      }
    } else {
      const { count } = await supabase.from("map_providers").select("id", { count: "exact", head: true });
      if (!count || count === 0) {
        await bulkInsertProviders(SAMPLE_PROVIDERS);
        providerCount = SAMPLE_PROVIDERS.length;
      }
    }

    if (mapData?.o?.length) {
      const { count } = await supabase.from("map_opportunities").select("id", { count: "exact", head: true });
      if (!count || count === 0) {
        await bulkInsertOpportunities(mapData.o);
        oppCount = mapData.o.length;
      }
    } else {
      const { count } = await supabase.from("map_opportunities").select("id", { count: "exact", head: true });
      if (!count || count === 0) {
        await bulkInsertOpportunities(SAMPLE_OPPORTUNITIES);
        oppCount = SAMPLE_OPPORTUNITIES.length;
      }
    }

    localStorage.setItem(migKey, new Date().toISOString());
    return { migrated: true, investorCount, providerCount, oppCount };
  } catch (e) {
    console.error("Migration error:", e);
    return { migrated: false, error: e.message };
  }
}

// ===== FALLBACK: localStorage reads (if Supabase tables don't exist) =====
function loadLocalInvestors() {
  try {
    const r = localStorage.getItem("hc_inv_platform_v3");
    if (r) { const d = JSON.parse(r); if (d.investors?.length) return d.investors; }
  } catch(e) {}
  return JSON.parse(JSON.stringify(SEED_INVESTORS));
}

function loadLocalMap() {
  try {
    for (const k of ["sa_map_v4", "sa_map_v3", "sa_map_v2"]) {
      const r = localStorage.getItem(k);
      if (r) { const d = JSON.parse(r); if (d.p) return { providers: d.p, opportunities: d.o || [] }; }
    }
  } catch(e) {}
  return { providers: [...SAMPLE_PROVIDERS], opportunities: [...SAMPLE_OPPORTUNITIES] };
}

// ===== ADMIN ANALYTICS: Visitor Stats =====
export async function fetchVisitorStats() {
  try {
    const { data } = await supabase.from("visitor_log").select("*").order("created_at", { ascending: false }).limit(10000);
    return data || [];
  } catch(e) { return []; }
}

// ===== PPP GOVERNMENT PROJECTS =====
export async function fetchPPP() {
  try {
    const { data, error } = await supabase.from("map_ppp").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ ...r, type: "ppp" }));
  } catch(e) { return []; }
}
export async function upsertPPP(item) {
  const { type, ...row } = item;
  const { data, error } = await supabase.from("map_ppp").upsert(row).select().single();
  if (error) throw error;
  return { ...data, type: "ppp" };
}
export async function deletePPP(id) { await supabase.from("map_ppp").delete().eq("id", id); }
export async function bulkInsertPPP(items) {
  const rows = items.map(({ type, ...r }) => r);
  const { data, error } = await supabase.from("map_ppp").upsert(rows).select();
  if (error) throw error;
  return (data || []).map(r => ({ ...r, type: "ppp" }));
}

// ===== PRIVATE ASSETS FOR SALE =====
export async function fetchPrivateAssets() {
  try {
    const { data, error } = await supabase.from("map_private_assets").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ ...r, type: "private_asset" }));
  } catch(e) { return []; }
}
export async function upsertPrivateAsset(item) {
  const { type, ...row } = item;
  const { data, error } = await supabase.from("map_private_assets").upsert(row).select().single();
  if (error) throw error;
  return { ...data, type: "private_asset" };
}
export async function deletePrivateAsset(id) { await supabase.from("map_private_assets").delete().eq("id", id); }
export async function bulkInsertPrivateAssets(items) {
  const rows = items.map(({ type, ...r }) => r);
  const { data, error } = await supabase.from("map_private_assets").upsert(rows).select();
  if (error) throw error;
  return (data || []).map(r => ({ ...r, type: "private_asset" }));
}

// ===== USER PROFILE UPDATE (pathway selection) =====
export async function updateUserProfile(userId, fields) {
  const { data, error } = await supabase.from("profiles").update(fields).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}
