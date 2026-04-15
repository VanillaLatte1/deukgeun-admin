import { createSupabaseAdmin } from "@/lib/supabase-server";
import { toWorkoutType, type WorkoutType } from "@/lib/workout-policy";

export const COMMUNITY_START_WEEK = "2026-02-01";

export type Member = {
  id: string;
  name: string;
  gender: string | null;
  overall_goal_title: string | null;
  overall_goal_value: string | null;
  overall_goal_note: string | null;
  overall_goal_achieved: boolean | null;
  created_at: string;
};

export type WeeklyGoal = {
  member_id: string;
  week_start: string;
  target_sessions: number;
  target_minutes: number;
};

export type WeeklyException = {
  id: string;
  member_id: string;
  week_start: string;
  reason: string | null;
  created_at: string;
  members: { name: string } | null;
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

type WeeklyExceptionRow = Omit<WeeklyException, "members"> & {
  members: { name: string } | { name: string }[] | null;
};

export type WorkoutSession = Omit<WorkoutSessionRow, "members" | "exercise_type"> & {
  members: { name: string } | null;
  exercise_type: WorkoutType;
  start_image_url: string | null;
  end_image_url: string | null;
};

export type WorkoutSessionSlot = Pick<WorkoutSessionRow, "member_id" | "workout_date" | "session_no">;

export type HalfYearKey = "1" | "2";

export type HalfYearRange = {
  year: number;
  half: HalfYearKey;
  label: string;
  from: string;
  to: string;
  selectedWeekStart: string;
  defaultWeekStart: string;
  maxWeekStart: string;
};

export type PenaltyDocumentSummary = {
  member: Member;
  weeklyTargetSessions: number;
  activeWeeks: number;
  excusedWeeks: number;
  targetSessionsTotal: number;
  completedSessionsTotal: number;
  shortfallWeeks: number;
  shortfallWeekStarts: string[];
  weeklyFineAmount: number;
  finalGoalAchieved: boolean | null;
  finalFineAmount: number;
  totalFineAmount: number;
};

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
  const fullSelect =
    "id, name, gender, overall_goal_title, overall_goal_value, overall_goal_note, overall_goal_achieved, created_at";
  const { data, error } = await supabase
    .from("members")
    .select(fullSelect)
    .order("name", { ascending: true })
    .order("created_at", { ascending: true });

  if (!error) {
    return (data ?? []) as Member[];
  }

  if (error.code !== "42703") {
    throw error;
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("members")
    .select("id, name, gender, created_at")
    .order("name", { ascending: true })
    .order("created_at", { ascending: true });

  if (fallbackError) {
    throw fallbackError;
  }

  return ((fallbackData ?? []) as Omit<Member, "overall_goal_title" | "overall_goal_value" | "overall_goal_note" | "overall_goal_achieved">[]).map(
    (member) => ({
      ...member,
      overall_goal_title: null,
      overall_goal_value: null,
      overall_goal_note: null,
      overall_goal_achieved: null,
    }),
  );
}

export async function getMemberById(memberId: string) {
  const supabase = createSupabaseAdmin();
  const fullSelect =
    "id, name, gender, overall_goal_title, overall_goal_value, overall_goal_note, overall_goal_achieved, created_at";
  const { data, error } = await supabase
    .from("members")
    .select(fullSelect)
    .eq("id", memberId)
    .maybeSingle();

  if (!error) {
    return (data ?? null) as Member | null;
  }

  if (error.code !== "42703") {
    throw error;
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("members")
    .select("id, name, gender, created_at")
    .eq("id", memberId)
    .maybeSingle();

  if (fallbackError) {
    throw fallbackError;
  }

  if (!fallbackData) {
    return null;
  }

  return {
    ...(fallbackData as Omit<
      Member,
      "overall_goal_title" | "overall_goal_value" | "overall_goal_note" | "overall_goal_achieved"
    >),
    overall_goal_title: null,
    overall_goal_value: null,
    overall_goal_note: null,
    overall_goal_achieved: null,
  };
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

export async function listWeeklyExceptions(weekStart: string) {
  const supabase = createSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from("weekly_exceptions")
      .select("id, member_id, week_start, reason, created_at, members(name)")
      .eq("week_start", weekStart)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load weekly exceptions", error);
      return [];
    }

    return ((data ?? []) as WeeklyExceptionRow[]).map((row) => ({
      ...row,
      members: Array.isArray(row.members) ? (row.members[0] ?? null) : row.members,
    }));
  } catch (error) {
    console.error("Unexpected weekly exceptions error", error);
    return [];
  }
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

  const signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedImages, error: signedError } = await supabase.storage
      .from("workout-proofs")
      .createSignedUrls(paths, 60 * 60);

    if (signedError) {
      throw signedError;
    }

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

async function listWorkoutsInRange(from: string, toInclusive: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, member_id, workout_date, session_no, exercise_type, duration_minutes, start_image_path, end_image_path, notes, created_at, members(name)",
    )
    .gte("workout_date", from)
    .lte("workout_date", toInclusive)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as WorkoutSessionRow[];

  return rows.map((row) => ({
    ...row,
    exercise_type: toWorkoutType(row.exercise_type ?? ""),
    members: Array.isArray(row.members) ? (row.members[0] ?? null) : row.members,
    start_image_url: null,
    end_image_url: null,
  })) satisfies WorkoutSession[];
}

async function listWeeklyExceptionsInRange(from: string, toInclusive: string) {
  const supabase = createSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from("weekly_exceptions")
      .select("id, member_id, week_start, reason, created_at, members(name)")
      .gte("week_start", from)
      .lte("week_start", toInclusive)
      .order("week_start", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load weekly exceptions in range", error);
      return [];
    }

    return ((data ?? []) as WeeklyExceptionRow[]).map((row) => ({
      ...row,
      members: Array.isArray(row.members) ? (row.members[0] ?? null) : row.members,
    }));
  } catch (error) {
    console.error("Unexpected weekly exceptions range error", error);
    return [];
  }
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
  const [members, goals, workouts, exceptions] = await Promise.all([
    listMembers(),
    listFixedGoals(),
    listWorkoutsForWeek(weekStart),
    listWeeklyExceptions(weekStart),
  ]);

  const goalByMember = new Map(goals.map((goal) => [goal.member_id, goal]));
  const doneByMember = new Map<string, { sessions: number; minutes: number }>();
  const exceptionByMember = new Map(exceptions.map((item) => [item.member_id, item]));

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
    const exception = exceptionByMember.get(member.id) ?? null;

    return {
      member,
      targetSessions: exception ? -1 : (goal?.target_sessions ?? 0),
      targetMinutes: exception ? 0 : (goal?.target_minutes ?? 0),
      doneSessions: done.sessions,
      doneMinutes: done.minutes,
      isExcused: Boolean(exception),
      excusedReason: exception?.reason ?? null,
    };
  });

  const activeMemberStats = memberStats.filter((item) => !item.isExcused);

  return {
    weekStart,
    totals: {
      members: members.length,
      activeMembers: activeMemberStats.length,
      excusedMembers: memberStats.length - activeMemberStats.length,
      goals: activeMemberStats.filter((item) => item.targetSessions > 0).length,
      workouts: workouts.length,
      minutes: workouts.reduce((acc, cur) => acc + cur.duration_minutes, 0),
    },
    memberStats,
    recent: workouts.slice(0, 10),
    exceptions,
  };
}

function clampDateYmd(value: string, min: string, max: string) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function getWeekStartsWithinDates(from: string, toInclusive: string) {
  const communityStart = parseYmd(COMMUNITY_START_WEEK);
  const rangeEnd = parseYmd(toInclusive);
  const weeks: string[] = [];
  const cursor = new Date(communityStart);

  while (cursor <= rangeEnd) {
    const weekStart = toYmd(cursor);
    if (weekStart >= from && weekStart <= toInclusive) {
      weeks.push(weekStart);
    }
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function addDaysToYmd(ymd: string, days: number) {
  const date = parseYmd(ymd);
  date.setDate(date.getDate() + days);
  return toYmd(date);
}

export function getHalfYearRange(
  year: number,
  half: HalfYearKey,
  requestedWeekStart?: string,
): HalfYearRange {
  const halfStart = half === "1" ? `${year}-01-01` : `${year}-07-01`;
  const from = COMMUNITY_START_WEEK > halfStart ? COMMUNITY_START_WEEK : halfStart;
  const maxTo = half === "1" ? `${year}-06-30` : `${year}-12-31`;
  const today = toYmd(new Date());
  const effectiveMaxTo = clampDateYmd(today, from, maxTo);
  const availableWeekStarts = getWeekStartsWithinDates(from, effectiveMaxTo);
  const maxWeekStart = availableWeekStarts.at(-1) ?? from;
  const defaultWeekStart = maxWeekStart;
  const selectedWeekStart =
    requestedWeekStart && availableWeekStarts.includes(requestedWeekStart)
      ? requestedWeekStart
      : defaultWeekStart;
  const selectedWeekEnd = clampDateYmd(addDaysToYmd(selectedWeekStart, 6), from, maxTo);
  const label = `${year}년 ${half === "1" ? "상반기" : "하반기"}`;
  return {
    year,
    half,
    label,
    from,
    to: selectedWeekEnd,
    selectedWeekStart,
    defaultWeekStart,
    maxWeekStart,
  };
}

export async function getPenaltyDocumentData(
  year: number,
  half: HalfYearKey,
  requestedWeekStart?: string,
) {
  const range = getHalfYearRange(year, half, requestedWeekStart);
  const weekStarts = getWeekStartsWithinDates(range.from, range.selectedWeekStart);
  const [members, goals, workouts, exceptions] = await Promise.all([
    listMembers(),
    listFixedGoals(),
    listWorkoutsInRange(range.from, range.to),
    listWeeklyExceptionsInRange(range.from, range.to),
  ]);

  const goalByMember = new Map(goals.map((goal) => [goal.member_id, goal]));
  const workoutCountByMemberWeek = new Map<string, number>();
  const exceptionKeySet = new Set(exceptions.map((item) => `${item.member_id}:${item.week_start}`));
  const excusedCountByMember = new Map<string, number>();
  const doneTotalByMember = new Map<string, number>();

  for (const workout of workouts) {
    const weekStart = getCurrentWeekStart(parseYmd(workout.workout_date));
    const weekKey = `${workout.member_id}:${weekStart}`;
    workoutCountByMemberWeek.set(weekKey, (workoutCountByMemberWeek.get(weekKey) ?? 0) + 1);
    doneTotalByMember.set(workout.member_id, (doneTotalByMember.get(workout.member_id) ?? 0) + 1);
  }

  for (const exception of exceptions) {
    excusedCountByMember.set(
      exception.member_id,
      (excusedCountByMember.get(exception.member_id) ?? 0) + 1,
    );
  }

  const summaries: PenaltyDocumentSummary[] = members.map((member) => {
    const weeklyTargetSessions = goalByMember.get(member.id)?.target_sessions ?? 0;
    const activeWeeks = weekStarts.filter((weekStart) => !exceptionKeySet.has(`${member.id}:${weekStart}`));
    const shortfallWeekStarts = weeklyTargetSessions > 0
      ? activeWeeks.filter((weekStart) => {
          const done = workoutCountByMemberWeek.get(`${member.id}:${weekStart}`) ?? 0;
          return done < weeklyTargetSessions;
        })
      : [];
    const shortfallWeeks = shortfallWeekStarts.length;
    const excusedWeeks = excusedCountByMember.get(member.id) ?? 0;
    const targetSessionsTotal = activeWeeks.length * weeklyTargetSessions;
    const completedSessionsTotal = doneTotalByMember.get(member.id) ?? 0;
    const finalGoalAchieved = member.overall_goal_achieved;
    const weeklyFineAmount = shortfallWeeks * 20_000;
    const finalFineAmount = finalGoalAchieved === false ? 100_000 : 0;

    return {
      member,
      weeklyTargetSessions,
      activeWeeks: activeWeeks.length,
      excusedWeeks,
      targetSessionsTotal,
      completedSessionsTotal,
      shortfallWeeks,
      shortfallWeekStarts,
      weeklyFineAmount,
      finalGoalAchieved,
      finalFineAmount,
      totalFineAmount: weeklyFineAmount + finalFineAmount,
    };
  });

  return {
    range,
    weekStarts,
    summaries,
  };
}
