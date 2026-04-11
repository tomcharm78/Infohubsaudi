export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "";
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    let prompt = "";
    if (body.action === "custom" && body.prompt) {
      prompt = body.prompt;
    } else if (body.action === "test") {
      return Response.json({ ok: true, keyPrefix: apiKey.slice(0, 12) + "..." });
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const attempts = [
      { model: "claude-sonnet-4-6", tools: [{ type: "web_search_20250305", name: "web_search" }] },
      { model: "claude-sonnet-4-6" },
      { model: "claude-sonnet-4-5-20250929", tools: [{ type: "web_search_20250305", name: "web_search" }] },
      { model: "claude-sonnet-4-5-20250929" },
      { model: "claude-sonnet-4-20250514", tools: [{ type: "web_search_20250305", name: "web_search" }] },
      { model: "claude-sonnet-4-20250514" },
      { model: "claude-haiku-4-5-20251001" },
      { model: "claude-3-5-sonnet-20241022" },
      { model: "claude-3-haiku-20240307" },
    ];

    let data = null, usedModel = "", errors = [];
    for (const att of attempts) {
      try {
        const reqBody = { model: att.model, max_tokens: 4000, messages: [{ role: "user", content: prompt }] };
        if (att.tools) reqBody.tools = att.tools;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify(reqBody),
        });
        if (res.ok) { data = await res.json(); usedModel = att.model + (att.tools ? " +search" : ""); break; }
        else { errors.push({ model: att.model, status: res.status, err: (await res.text()).slice(0, 100) }); }
      } catch (e) { errors.push({ model: att.model, err: e.message }); }
    }

    if (!data) return Response.json({ error: "All attempts failed", attempts: errors, hint: "Check API credits" }, { status: 502 });

    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
    let parsed = null;
    try { parsed = JSON.parse(text.replace(new RegExp("```json|```","g"), "").trim()); }
    catch(e1) { const m = text.match(new RegExp("(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\})")); if (m) try { parsed = JSON.parse(m[1]); } catch(e2) {} }

    return Response.json({ success: true, data: parsed, model: usedModel, raw: parsed ? null : text.slice(0, 300) });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}
