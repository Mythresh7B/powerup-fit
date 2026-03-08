import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_XP_THRESHOLDS = [
  0, 200, 500, 1000, 1750, 2800, 4200, 6000,
  8300, 11100, 14500, 18500, 23200, 28700,
  35100, 42500, 51000, 60700, 71700, 84200,
];

function getLevel(totalXp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 20);
}

function calculateXP(correctReps: number, totalReps: number, fatigue: number, streak: number): number {
  if (totalReps <= 0 || correctReps < 0) return 0;
  const accuracy = correctReps / totalReps;
  const base = Math.min(correctReps, 100) * 10;
  const bonus = accuracy > 0.90 ? 20 : 0;
  const penalty = fatigue > 0.60 ? 10 : 0;
  const streakMult = streak >= 30 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1.0;
  return Math.min(Math.max(0, Math.floor((base + bonus - penalty) * streakMult)), 1500);
}

function calculateStatDeltas(exercise: string, correctReps: number) {
  const d = { attack: 0, defence: 0, focus: 0, agility: 0 };
  switch (exercise) {
    case "bicep_curl": d.attack += correctReps * 2; break;
    case "shoulder_press": d.defence += correctReps * 2; d.attack += correctReps; break;
    case "squat": d.agility += correctReps * 2; d.defence += correctReps; break;
    case "plank": d.focus += correctReps * 3; d.agility += correctReps; break;
  }
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { exercise, total_reps, correct_reps, fatigue_score, duration_seconds } = body;

    const validExercises = ["bicep_curl", "shoulder_press", "squat", "plank"];
    if (!exercise || !validExercises.includes(exercise)) {
      return new Response(JSON.stringify({ error: "Invalid exercise" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeTotal = Math.max(0, Math.min(Math.floor(Number(total_reps) || 0), 1000));
    const safeCorrect = Math.max(0, Math.min(Math.floor(Number(correct_reps) || 0), safeTotal));
    const safeFatigue = Math.max(0, Math.min(Number(fatigue_score) || 0, 1));
    const safeDuration = Math.max(0, Math.min(Math.floor(Number(duration_seconds) || 0), 7200));

    // Use service role to bypass RLS for profile read/write
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("total_xp, streak, level, stat_attack, stat_defence, stat_focus, stat_agility")
      .eq("id", userId)
      .single();

    // Auto-create profile if missing
    if (profileError && profileError.code === "PGRST116") {
      const { data: newProfile, error: createErr } = await adminClient
        .from("profiles")
        .insert({ id: userId, username: "User" })
        .select("total_xp, streak, level, stat_attack, stat_defence, stat_focus, stat_agility")
        .single();
      if (createErr) {
        return new Response(JSON.stringify({ error: "Failed to create profile" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      profile = newProfile;
    } else if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const xpEarned = calculateXP(safeCorrect, safeTotal, safeFatigue, profile.streak || 0);
    const statDeltas = calculateStatDeltas(exercise, safeCorrect);

    // Insert workout log
    const { error: insertError } = await adminClient.from("workout_logs").insert({
      user_id: userId, exercise, duration_seconds: safeDuration,
      total_reps: safeTotal, correct_reps: safeCorrect,
      xp_earned: xpEarned, fatigue_score: safeFatigue,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to save workout" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newTotalXp = (profile.total_xp || 0) + xpEarned;
    const newLevel = getLevel(newTotalXp);

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        total_xp: newTotalXp,
        level: newLevel,
        stat_attack: (profile.stat_attack || 0) + statDeltas.attack,
        stat_defence: (profile.stat_defence || 0) + statDeltas.defence,
        stat_focus: (profile.stat_focus || 0) + statDeltas.focus,
        stat_agility: (profile.stat_agility || 0) + statDeltas.agility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        xp_earned: xpEarned,
        total_xp: newTotalXp,
        level: newLevel,
        stat_deltas: statDeltas,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
