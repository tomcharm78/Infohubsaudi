export const runtime = "nodejs";
import { createClient } from "@supabase/supabase-js";

// Moyasar API integration (SAMA-licensed payment gateway)
// Docs: https://moyasar.com/docs/api/
// Test keys: pk_test_xxx / sk_test_xxx
// Live keys: pk_live_xxx / sk_live_xxx

const MOYASAR_API = "https://api.moyasar.com/v1";

function getMoyasarAuth() {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) return null;
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ===== POST: Create payment / Request refund =====
export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;
    const auth = getMoyasarAuth();

    if (!auth) {
      return Response.json({
        error: "Payment gateway not configured",
        hint: "Set MOYASAR_SECRET_KEY in Vercel Environment Variables (get from moyasar.com/dashboard)"
      }, { status: 500 });
    }

    // ===== CREATE PAYMENT =====
    if (action === "create-payment") {
      const { amount_sar, tier, period, user_id, user_email, promo_code, discount_pct } = body;

      if (!amount_sar || !tier || !user_id) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const description = `HealthBridge GCC - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan (${period})`;

      // Create Moyasar payment using Creditcard + mada + applepay
      const res = await fetch(`${MOYASAR_API}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": auth },
        body: JSON.stringify({
          amount: Math.round(amount_sar * 100), // halalas
          currency: "SAR",
          description,
          callback_url: `${appUrl}/api/payment?action=callback`,
          source: { type: "creditcard", name: "", number: "", cvc: "", month: "", year: "" },
          metadata: {
            user_id,
            user_email,
            tier,
            period,
            promo_code: promo_code || "",
            discount_pct: discount_pct || 0,
            platform: "healthcare-investor-platform",
          },
        }),
      });

      // Moyasar returns a payment form URL for redirect-based flow
      // Alternative: use Moyasar.js embed for inline form
      if (!res.ok) {
        const errText = await res.text();
        console.error("Moyasar create error:", errText);
        return Response.json({ error: "Payment gateway error", details: errText }, { status: 502 });
      }

      const data = await res.json();
      return Response.json({
        success: true,
        payment_id: data.id,
        payment_url: data.source?.transaction_url || data.url || null,
        status: data.status,
      });
    }

    // ===== REQUEST REFUND =====
    if (action === "refund") {
      const { payment_id, user_id, reason } = body;
      const supabase = getSupabase();

      // Verify payment exists and belongs to user
      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("id", payment_id)
        .eq("user_id", user_id)
        .single();

      if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });

      // Check 7-day refund window (Saudi E-Commerce Law)
      const paymentDate = new Date(payment.created_at);
      const now = new Date();
      const daysSince = (now - paymentDate) / (1000 * 60 * 60 * 24);

      if (daysSince > 7) {
        return Response.json({
          error: "Refund window expired",
          message: "Refunds are available within 7 days of payment per Saudi E-Commerce Law. Your payment was made " + Math.floor(daysSince) + " days ago."
        }, { status: 400 });
      }

      if (payment.status === "refunded") {
        return Response.json({ error: "This payment has already been refunded" }, { status: 400 });
      }

      // Check if user has used premium features (if so, refund may be denied)
      const { count: downloadCount } = await supabase
        .from("download_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("created_at", payment.created_at);

      const { count: contractCount } = await supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user_id)
        .gte("created_at", payment.created_at);

      const hasUsedFeatures = (downloadCount || 0) > 0 || (contractCount || 0) > 0;

      if (hasUsedFeatures) {
        return Response.json({
          error: "Refund not available",
          message: "You have already used premium features (downloads, contracts, etc.) since this payment. Per Saudi E-Commerce Law, refunds are not available once services have been used. Contact support for assistance."
        }, { status: 400 });
      }

      // Process refund via Moyasar
      if (payment.moyasar_payment_id) {
        try {
          const refundRes = await fetch(`${MOYASAR_API}/payments/${payment.moyasar_payment_id}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": auth },
            body: JSON.stringify({ amount: Math.round(payment.amount_sar * 100) }),
          });

          if (!refundRes.ok) {
            const errText = await refundRes.text();
            return Response.json({ error: "Refund processing failed", details: errText }, { status: 502 });
          }
        } catch (e) {
          console.error("Moyasar refund error:", e);
        }
      }

      // Update payment record
      await supabase.from("payments").update({
        status: "refunded",
        refund_reason: reason || "User requested within 7-day window",
        refunded_at: new Date().toISOString(),
      }).eq("id", payment_id);

      // Revert user to basic tier
      await supabase.from("profiles").update({
        subscription_tier: "basic",
        subscription_status: "refunded",
      }).eq("id", user_id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id,
        title: "Refund Processed",
        message: `Your refund of ${payment.amount_sar} SAR has been processed. Your account has been reverted to the Basic (free) tier. The refund will appear in your account within 5-14 business days.`,
        type: "system",
      });

      return Response.json({ success: true, message: "Refund processed successfully" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Payment error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ===== GET: Payment callback from Moyasar =====
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const auth = getMoyasarAuth();

  if (!id) {
    return Response.redirect(`${appUrl}?payment=error&message=missing_id`, 302);
  }

  try {
    // Verify payment with Moyasar
    const verifyRes = await fetch(`${MOYASAR_API}/payments/${id}`, {
      headers: { "Authorization": auth },
    });

    if (!verifyRes.ok) {
      return Response.redirect(`${appUrl}?payment=error&message=verification_failed`, 302);
    }

    const payment = await verifyRes.json();

    if (payment.status === "paid") {
      const meta = payment.metadata || {};
      const supabase = getSupabase();

      // Record payment in our database
      const now = new Date();
      const expires = new Date(now);
      if (meta.period === "yearly") expires.setFullYear(expires.getFullYear() + 1);
      else expires.setMonth(expires.getMonth() + 1);

      await supabase.from("payments").insert({
        user_id: meta.user_id,
        amount_usd: Math.round(payment.amount / 100 / 3.75 * 100) / 100,
        amount_sar: payment.amount / 100,
        tier: meta.tier,
        period: meta.period,
        promo_code: meta.promo_code || null,
        discount_pct: meta.discount_pct || 0,
        status: "completed",
        moyasar_payment_id: payment.id,
      });

      // Update user subscription
      await supabase.from("profiles").update({
        subscription_tier: meta.tier,
        subscription_status: "active",
        subscription_period: meta.period,
        subscription_started_at: now.toISOString(),
        subscription_expires_at: expires.toISOString(),
      }).eq("id", meta.user_id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id: meta.user_id,
        title: `Welcome to ${meta.tier.charAt(0).toUpperCase() + meta.tier.slice(1)}!`,
        message: `Your ${meta.tier} subscription is now active. Enjoy all premium features!`,
        type: "system",
      });

      // Track promo usage
      if (meta.promo_code) {
        const { data: promoData } = await supabase.from("promo_codes").select("*").eq("code", meta.promo_code).limit(1);
        if (promoData?.length) {
          await supabase.from("promo_usage").insert({ promo_id: promoData[0].id, code: meta.promo_code, user_id: meta.user_id, user_email: meta.user_email });
          await supabase.from("promo_codes").update({ current_uses: (promoData[0].current_uses || 0) + 1 }).eq("id", promoData[0].id);
        }
      }

      return Response.redirect(`${appUrl}?payment=success&tier=${meta.tier}`, 302);
    } else {
      return Response.redirect(`${appUrl}?payment=failed&status=${payment.status}`, 302);
    }
  } catch (err) {
    console.error("Callback error:", err);
    return Response.redirect(`${appUrl}?payment=error&message=${encodeURIComponent(err.message)}`, 302);
  }
}
