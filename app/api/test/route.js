export const runtime = "nodejs";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY || "";
  const hasKey = key.length > 10 && key.startsWith("sk-");

  return Response.json({
    status: hasKey ? "✅ API Key is configured" : "❌ API Key NOT found",
    keyPrefix: key ? key.slice(0, 12) + "..." : "empty",
    keyLength: key.length,
    envVarsAvailable: {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      NEXT_PUBLIC_ANTHROPIC_API_KEY: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    },
    hint: hasKey ? "Key looks good! Try the AI Update button." : "Go to Vercel → Settings → Environment Variables → Add ANTHROPIC_API_KEY → then REDEPLOY the project."
  });
}
