import { createSupabaseAdmin } from "@/lib/supabase-server";
import { toWorkoutType, type WorkoutType } from "@/lib/workout-policy";

export const COMMUNITY_START_WEEK = "2026-02-01";

export type Member = {
  id: string;
  name: string;
  gender: string | null;
  created_at: string;
};

export type WeeklyGoal = {
  member_id: string;
  week_start: string;
  target_sessions: number;
  target_minutes: number;
};

type WorkoutSessionRow = {
  id: string;
  member_id: string;
  workout_date: string;
  session_no: number;
  exercise_type: string | null;
  duration_minutes: number;
  start_image_path: string;
  end_image_path: string | null;
  notes: string | null;
  created_at: string;
  members: { name: string } | { name: string }[] | null;
};

export type WorkoutSession = Omit<WorkoutSessionRow, "members" | "exercise_type"> & {
  members: { name: string } | null;
  exercise_type: WorkoutType;
  start_image_url: string | null;
  end_image_url: string | null;
};

export type WorkoutSessionSlot = Pick<WorkoutSessionRow, "member_id" | "workout_date" | "session_no">;

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function getCurrentWeekStart(baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toYmd(d);
}

function getWeekRange(weekStart: string) {
  const start = parseYmd(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    from: toYmd(start),
    to: toYmd(end),
  };
}

export async function listMembers() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("id, name, gender, created_at")
    .order("name", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Member[];
}

export async function getMemberById(memberId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("id, name, gender, created_at")
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as Member | null;
}

export async function listFixedGoals() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("member_id, week_start, target_sessions, target_minutes")
    .order("member_id", { ascending: true })
    .order("week_start", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as WeeklyGoal[];
  const goalMap = new Map<string, WeeklyGoal>();

  for (const row of rows) {
    if (!goalMap.has(row.member_id)) {
      goalMap.set(row.member_id, row);
    }
  }

  return [...goalMap.values()];
}

export async function getFixedGoalByMemberId(memberId: string) {
  const goals = await listFixedGoals();
  return goals.find((goal) => goal.member_id === memberId) ?? null;
}

export async function listWorkoutsForWeek(weekStart: string, memberId?: string) {
  const supabase = createSupabaseAdmin();
  const range = getWeekRange(weekStart);

  let query = supabase
    .from("workout_sessions")
    .select(
      "id, member_id, workout_date, session_no, exercise_type, duration_minutes, start_image_path, end_image_path, notes, created_at, members(name)",
    )
    .gte("workout_date", range.from)
    .lt("workout_date", range.to)
    .order("created_at", { ascending: false });

  if (memberId) {
    query = query.eq("member_id", memberId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as WorkoutSessionRow[];
  const paths = rows.flatMap((row) =>
    [row.start_image_path, row.end_image_path].filter((path): path is string => Boolean(path)),
  );

  let signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedImages, error: signedError } = await supabase.storage
      .from("workout-proofs")
      .createSignedUrls(paths, 60 * 60);

    if (signedError) {
      throw signedError;
    }

    signedMap = new Map<string, string>();
    for (const item of signedImages ?? []) {
      if (item.path && item.signedUrl) {
        signedMap.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    exercise_type: toWorkoutType(row.exercise_type ?? ""),
    members: Array.isArray(row.members) ? (row.members[0] ?? null) : row.members,
    start_image_url: signedMap.get(row.start_image_path) ?? null,
    end_image_url: row.end_image_path ? signedMap.get(row.end_image_path) ?? null : null,
  }));
}

export async function listWorkoutSessionSlots() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("member_id, workout_date, session_no")
    .order("workout_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkoutSessionSlot[];
}

export async function getDashboardData(weekStart: string) {
  const [members, goals, workouts] = await Promise.all([
    listMembers(),
    listFixedGoals(),
    listWorkoutsForWeek(weekStart),
  ]);

  const goalByMember = new Map(goals.map((goal) => [goal.member_id, goal]));
  const doneByMember = new Map<string, { sessions: number; minutes: number }>();

  for (const workout of workouts) {
    const prev = doneByMember.get(workout.member_id) ?? { sessions: 0, minutes: 0 };
    doneByMember.set(workout.member_id, {
      sessions: prev.sessions + 1,
      minutes: prev.minutes + workout.duration_minutes,
    });
  }

  const memberStats = members.map((member) => {
    const goal = goalByMember.get(member.id);
    const done = doneByMember.get(member.id) ?? { sessions: 0, minutes: 0 };
    return {
      member,
      targetSessions: goal?.target_sessions ?? 0,
      targetMinutes: goal?.target_minutes ?? 0,
      doneSessions: done.sessions,
      doneMinutes: done.minutes,
    };
  });

  return {
    weekStart,
    totals: {
      members: members.length,
      goals: goals.length,
      workouts: workouts.length,
      minutes: workouts.reduce((acc, cur) => acc + cur.duration_minutes, 0),
    },
    memberStats,
    recent: workouts.slice(0, 10),
  };
}
