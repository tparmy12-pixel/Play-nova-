import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { gender } = await req.json();
    const genderLabel = gender === "female" ? "female" : "male";

    const prompts = [
      `Professional ${genderLabel} spokesperson avatar, friendly smile, business casual attire, clean studio background, photorealistic portrait, looking at camera, warm lighting, upper body shot, for video advertisement`,
      `Young trendy ${genderLabel} influencer avatar, casual modern outfit, colorful background, photorealistic portrait, confident expression, social media style, upper body shot, for app promotion video`,
      `Elegant ${genderLabel} presenter avatar, professional attire, gradient background, photorealistic portrait, trustworthy expression, corporate style, upper body shot, for product advertisement`,
      `Friendly ${genderLabel} tech reviewer avatar, smart casual outfit, minimal background, photorealistic portrait, enthusiastic expression, tech vibe, upper body shot, for app review video`,
    ];

    const results = await Promise.all(
      prompts.map(async (prompt) => {
        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI gateway error:", response.status, errorText);
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a moment.");
          }
          if (response.status === 402) {
            throw new Error("AI credits exhausted. Please add credits to continue.");
          }
          throw new Error(`AI generation failed: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl =
          data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        return imageUrl || null;
      })
    );

    const avatars = results
      .filter(Boolean)
      .map((url, i) => ({
        id: `${genderLabel}-${i + 1}`,
        imageUrl: url,
        label: `${genderLabel === "female" ? "Female" : "Male"} Avatar ${i + 1}`,
      }));

    return new Response(JSON.stringify({ avatars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ad-avatars error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
