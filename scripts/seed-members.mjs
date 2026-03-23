import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  const v = line.slice(idx + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars.");
}

const supabase = createClient(url, serviceRoleKey);

const weekStart = "2026-02-01";

const payload = [
  { name: "최은비", gender: "F", target_sessions: 1, target_minutes: 45 },
  { name: "정혜린", gender: "F", target_sessions: 2, target_minutes: 45 },
  { name: "서상우", gender: "M", target_sessions: 2, target_minutes: 45 },
  { name: "박서영", gender: "F", target_sessions: 2, target_minutes: 50 },
  { name: "정병건", gender: "M", target_sessions: 1, target_minutes: 50 },
  { name: "김신애", gender: "F", target_sessions: 2, target_minutes: 60 },
  { name: "신성아", gender: "F", target_sessions: 2, target_minutes: 40 },
  { name: "안은빈", gender: "F", target_sessions: 2, target_minutes: 30 },
  { name: "이돈희", gender: "M", target_sessions: 2, target_minutes: 30 },
  { name: "박현지", gender: "F", target_sessions: 1, target_minutes: 40 },
  { name: "김요한", gender: "M", target_sessions: 2, target_minutes: 30 },
  { name: "최예지", gender: "F", target_sessions: 2, target_minutes: 50 },
  { name: "이기쁨", gender: "F", target_sessions: 1, target_minutes: 40 },
  { name: "노지웅", gender: "M", target_sessions: 2, target_minutes: 30 },
  { name: "순예은", gender: "F", target_sessions: 2, target_minutes: 40 },
  { name: "김교희", gender: "M", target_sessions: 2, target_minutes: 40 },
  { name: "이채령", gender: "F", target_sessions: 2, target_minutes: 30 },
  { name: "이언우", gender: "M", target_sessions: 1, target_minutes: 30 },
  { name: "박세인", gender: "F", target_sessions: 1, target_minutes: 50 },
];

const names = payload.map((row) => row.name);
const { data: existingMembers, error: existingError } = await supabase
  .from("members")
  .select("id, name")
  .in("name", names);

if (existingError) throw existingError;

const memberIdByName = new Map((existingMembers ?? []).map((m) => [m.name, m.id]));

for (const row of payload) {
  let memberId = memberIdByName.get(row.name);

  if (memberId) {
    const { error: updateError } = await supabase
      .from("members")
      .update({ gender: row.gender })
      .eq("id", memberId);
    if (updateError) throw updateError;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("members")
      .insert({ name: row.name, gender: row.gender })
      .select("id")
      .single();

    if (insertError) throw insertError;
    memberId = inserted.id;
    memberIdByName.set(row.name, memberId);
  }

  const { error: goalError } = await supabase.from("weekly_goals").upsert(
    {
      member_id: memberId,
      week_start: weekStart,
      target_sessions: row.target_sessions,
      target_minutes: row.target_minutes,
    },
    { onConflict: "member_id,week_start" },
  );

  if (goalError) throw goalError;
}

console.log(`Seeded/updated ${payload.length} members with fixed goals.`);

