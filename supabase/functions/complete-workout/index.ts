import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2400, 3700, 5500, 8000, 12000];

function getLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function calculateXP(correctReps: number, totalReps: number, fatigue: number, streak: number): number {
  if (totalReps <= 0 || correctReps < 0) return 0;
  const accuracy = correctReps / totalReps;
  const base = Math.min(correctReps, 100) * 10; // cap at 100 reps
  const bonus = accuracy > 0.90 ? 20 : 0;
  const penalty = fatigue > 0.60 ? 10 : 0;
  const streakMult = streak >= 30 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1.0;
  const xp = Math.max(0, Math.floor((base + bonus - penalty) * streakMult));
  return Math.min(xp, 1500); // hard cap per session
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { exercise, total_reps, correct_reps, fatigue_score, duration_seconds } = body;

    // Validate inputs
    if (!exercise || typeof exercise !== "string") {
      return new Response(JSON.stringify({ error: "Invalid exercise" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validExercises = ["bicep_curl", "shoulder_press", "squat", "plank"];
    if (!validExercises.includes(exercise)) {
      return new Response(JSON.stringify({ error: "Invalid exercise type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeTotal = Math.max(0, Math.min(Math.floor(Number(total_reps) || 0), 1000));
    const safeCorrect = Math.max(0, Math.min(Math.floor(Number(correct_reps) || 0), safeTotal));
    const safeFatigue = Math.max(0, Math.min(Number(fatigue_score) || 0, 1));
    const safeDuration = Math.max(0, Math.min(Math.floor(Number(duration_seconds) || 0), 7200));

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_xp, streak, level")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const xpEarned = calculateXP(safeCorrect, safeTotal, safeFatigue, profile.streak || 0);

    // Insert workout log
    const { error: insertError } = await supabase.from("workout_logs").insert({
      user_id: userId,
      exercise,
      duration_seconds: safeDuration,
      total_reps: safeTotal,
      correct_reps: safeCorrect,
      xp_earned: xpEarned,
      fatigue_score: safeFatigue,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to save workout" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile
    const newTotalXp = (profile.total_xp || 0) + xpEarned;
    const newLevel = getLevel(newTotalXp);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        total_xp: newTotalXp,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        xp_earned: xpEarned,
        total_xp: newTotalXp,
        level: newLevel,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
