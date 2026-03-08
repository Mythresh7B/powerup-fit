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

// Updated boss definitions with gauntlet phases
const BOSSES = [
  { index: 1, hp: 250, attack: 18, defence: 12, bonusXP: 150, phases: [{ exercise: "bicep_curl", reps: 12 }, { exercise: "squat", reps: 10 }] },
  { index: 2, hp: 500, attack: 32, defence: 30, bonusXP: 250, phases: [{ exercise: "shoulder_press", reps: 15 }, { exercise: "squat", reps: 15 }, { exercise: "bicep_curl", reps: 12 }] },
  { index: 3, hp: 750, attack: 50, defence: 25, bonusXP: 350, phases: [{ exercise: "squat", reps: 20 }, { exercise: "plank", reps: 6 }, { exercise: "bicep_curl", reps: 15 }, { exercise: "shoulder_press", reps: 10 }] },
  { index: 4, hp: 1100, attack: 65, defence: 55, bonusXP: 450, phases: [{ exercise: "plank", reps: 10 }, { exercise: "shoulder_press", reps: 20 }, { exercise: "squat", reps: 20 }, { exercise: "plank", reps: 8 }] },
  { index: 5, hp: 2000, attack: 95, defence: 75, bonusXP: 550, phases: [{ exercise: "bicep_curl", reps: 25 }, { exercise: "shoulder_press", reps: 25 }, { exercise: "squat", reps: 25 }, { exercise: "plank", reps: 12 }] },
];

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
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { boss_index, correct_reps, total_reps, fatigue_score, phase_reps } = body;

    const bossIdx = Math.floor(Number(boss_index));
    const boss = BOSSES.find(b => b.index === bossIdx);
    if (!boss) {
      return new Response(JSON.stringify({ error: "Invalid boss index" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeCorrect = Math.max(0, Math.min(Math.floor(Number(correct_reps) || 0), 2000));
    const safeTotal = Math.max(0, Math.min(Math.floor(Number(total_reps) || 0), 2000));
    const safeFatigue = Math.max(0, Math.min(Number(fatigue_score) || 0, 1));

    // Get profile
    let { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("total_xp, streak, level, stat_attack, stat_defence, stat_focus, stat_agility")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      const { data: newProfile } = await adminClient
        .from("profiles")
        .insert({ id: userId, username: "User" })
        .select("total_xp, streak, level, stat_attack, stat_defence, stat_focus, stat_agility")
        .single();
      profile = newProfile;
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate cumulative stat deltas from all phases
    const statDeltas = { attack: 0, defence: 0, focus: 0, agility: 0 };
    if (phase_reps && typeof phase_reps === "object") {
      for (const [phaseStr, reps] of Object.entries(phase_reps)) {
        const phaseIdx = Number(phaseStr) - 1;
        const phase = boss.phases[phaseIdx];
        if (phase) {
          const d = calculateStatDeltas(phase.exercise, Number(reps) || 0);
          statDeltas.attack += d.attack;
          statDeltas.defence += d.defence;
          statDeltas.focus += d.focus;
          statDeltas.agility += d.agility;
        }
      }
    } else {
      // Fallback: treat as single exercise
      const d = calculateStatDeltas("bicep_curl", safeCorrect);
      statDeltas.attack += d.attack;
      statDeltas.defence += d.defence;
      statDeltas.focus += d.focus;
      statDeltas.agility += d.agility;
    }

    // Base XP from reps (cap raised to 150 for gauntlet)
    const accuracy = safeTotal > 0 ? safeCorrect / safeTotal : 0;
    const base = Math.min(safeCorrect, 150) * 10;
    const bonus = accuracy > 0.90 ? 20 : 0;
    const penalty = safeFatigue > 0.60 ? 10 : 0;
    const streakMult = (profile.streak || 0) >= 30 ? 1.5 : (profile.streak || 0) >= 7 ? 1.25 : (profile.streak || 0) >= 3 ? 1.1 : 1.0;
    const baseXP = Math.min(Math.max(0, Math.floor((base + bonus - penalty) * streakMult)), 1500);

    // Battle resolution
    const attack = profile.stat_attack || 0;
    const defence = profile.stat_defence || 0;
    const focus = profile.stat_focus || 0;
    const agility = profile.stat_agility || 0;
    const hpMax = 100 + ((profile.level || 1) * 25);

    const critChance = Math.min(focus / 500, 0.40);
    const critTriggered = Math.random() < critChance;
    const critMultiplier = critTriggered ? 1.5 : 1.0;
    const playerDmg = ((attack * 1.5) + (focus * 0.5)) * critMultiplier;

    const rawDamageTaken = Math.max(5, boss.attack - (defence * 0.8));
    const dodgeChance = Math.min(agility / 600, 0.35);
    const dodgeTriggered = Math.random() < dodgeChance;
    const actualDmg = dodgeTriggered ? 0 : rawDamageTaken;

    const roundsToKillBoss = Math.ceil(boss.hp / Math.max(playerDmg, 1));
    const roundsToKillPlayer = actualDmg > 0 ? Math.ceil(hpMax / actualDmg) : 9999;

    // Check total reps meet all phase requirements
    const totalRequired = boss.phases.reduce((s, p) => s + p.reps, 0);
    const metRepRequirement = safeCorrect >= totalRequired;
    const playerWins = metRepRequirement && (roundsToKillBoss <= roundsToKillPlayer);
    const rounds = Math.min(roundsToKillBoss, roundsToKillPlayer);

    // Check existing progress
    const { data: existingProgress } = await adminClient
      .from("boss_progress")
      .select("defeated, attempts")
      .eq("user_id", userId)
      .eq("boss_index", bossIdx)
      .single();

    const bossDefeatedFirstTime = playerWins && !(existingProgress?.defeated);
    const isRematch = existingProgress?.defeated === true;

    // Calculate total XP
    let totalXpEarned = baseXP;
    if (playerWins && !isRematch) {
      totalXpEarned += boss.bonusXP;
      if (bossDefeatedFirstTime) totalXpEarned += 200;
    }
    // Rematches: only practice XP from reps, no boss bonus

    const newTotalXp = (profile.total_xp || 0) + totalXpEarned;
    const newLevel = getLevel(newTotalXp);

    await adminClient.from("profiles").update({
      total_xp: newTotalXp,
      level: newLevel,
      stat_attack: (profile.stat_attack || 0) + statDeltas.attack,
      stat_defence: (profile.stat_defence || 0) + statDeltas.defence,
      stat_focus: (profile.stat_focus || 0) + statDeltas.focus,
      stat_agility: (profile.stat_agility || 0) + statDeltas.agility,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    // Insert workout log
    await adminClient.from("workout_logs").insert({
      user_id: userId,
      exercise: "boss_gauntlet",
      total_reps: safeTotal,
      correct_reps: safeCorrect,
      xp_earned: totalXpEarned,
      fatigue_score: safeFatigue,
      duration_seconds: 0,
    });

    // Upsert boss progress
    if (existingProgress) {
      const updateData: Record<string, unknown> = {
        attempts: (existingProgress.attempts || 0) + 1,
        last_attempted_at: new Date().toISOString(),
        current_phase: 1,
        phase_reps: {},
      };
      if (playerWins && !existingProgress.defeated) {
        updateData.defeated = true;
        updateData.first_defeated_at = new Date().toISOString();
      }
      await adminClient.from("boss_progress").update(updateData)
        .eq("user_id", userId).eq("boss_index", bossIdx);
    } else {
      await adminClient.from("boss_progress").insert({
        user_id: userId,
        boss_index: bossIdx,
        defeated: playerWins,
        attempts: 1,
        first_defeated_at: playerWins ? new Date().toISOString() : null,
        last_attempted_at: new Date().toISOString(),
        current_phase: 1,
        phase_reps: {},
      });
    }

    return new Response(JSON.stringify({
      won: playerWins,
      rounds,
      player_dmg_per_round: playerDmg,
      damage_taken_per_round: actualDmg,
      crit_triggered: critTriggered,
      dodge_triggered: dodgeTriggered,
      xp_earned: totalXpEarned,
      stat_deltas: statDeltas,
      boss_defeated_first_time: bossDefeatedFirstTime,
      total_xp: newTotalXp,
      level: newLevel,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Boss battle error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
