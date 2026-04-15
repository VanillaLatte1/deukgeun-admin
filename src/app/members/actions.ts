"use server";

import { revalidatePath } from "next/cache";

import { COMMUNITY_START_WEEK } from "@/lib/data";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type MemberActionState = {
  ok: boolean;
  message: string;
  submittedAt: number;
};

const initialMemberActionState: MemberActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
};

function isMissingOverallGoalColumn(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42703"
  );
}

function parseOverallGoalAchieved(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function memberSuccess(message: string): MemberActionState {
  return { ok: true, message, submittedAt: Date.now() };
}

function memberFailure(message: string): MemberActionState {
  return { ok: false, message, submittedAt: Date.now() };
}

export async function createMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const overallGoalTitle = String(formData.get("overall_goal_title") ?? "").trim();
  const overallGoalValue = String(formData.get("overall_goal_value") ?? "").trim();
  const overallGoalNote = String(formData.get("overall_goal_note") ?? "").trim();
  const overallGoalAchieved = parseOverallGoalAchieved(formData.get("overall_goal_achieved"));

  if (!name) {
    throw new Error("회원 이름은 필수입니다.");
  }

  if (!gender || !["M", "F"].includes(gender)) {
    throw new Error("성별은 M/F 값으로 입력해야 합니다.");
  }

  const supabase = createSupabaseAdmin();
  const payload = {
    name,
    gender,
    overall_goal_title: overallGoalTitle || null,
    overall_goal_value: overallGoalValue || null,
    overall_goal_note: overallGoalNote || null,
    overall_goal_achieved: overallGoalAchieved,
  };

  const { error } = await supabase.from("members").insert(payload);

  if (error) {
    if (!isMissingOverallGoalColumn(error)) {
      throw error;
    }

    const { error: fallbackError } = await supabase.from("members").insert({
      name,
      gender,
    });

    if (fallbackError) {
      throw fallbackError;
    }
  }

  revalidatePath("/members");
  revalidatePath("/");
}

export async function createMemberWithGoal(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const targetSessions = Number(formData.get("target_sessions") ?? 0);
  const targetMinutes = Number(formData.get("target_minutes") ?? 0);
  const overallGoalTitle = String(formData.get("overall_goal_title") ?? "").trim();
  const overallGoalValue = String(formData.get("overall_goal_value") ?? "").trim();
  const overallGoalNote = String(formData.get("overall_goal_note") ?? "").trim();
  const overallGoalAchieved = parseOverallGoalAchieved(formData.get("overall_goal_achieved"));

  if (!name) {
    throw new Error("회원 이름은 필수입니다.");
  }

  if (!gender || !["M", "F"].includes(gender)) {
    throw new Error("성별은 M/F 값으로 입력해야 합니다.");
  }

  if (!Number.isFinite(targetSessions) || targetSessions <= 0) {
    throw new Error("목표 회차를 올바르게 입력하세요.");
  }

  if (!Number.isFinite(targetMinutes) || targetMinutes < 0) {
    throw new Error("기본 운동 시간을 올바르게 입력하세요.");
  }

  const supabase = createSupabaseAdmin();
  let member: { id: string } | null = null;
  const memberInsertPayload = {
    name,
    gender,
    overall_goal_title: overallGoalTitle || null,
    overall_goal_value: overallGoalValue || null,
    overall_goal_note: overallGoalNote || null,
    overall_goal_achieved: overallGoalAchieved,
  };

  const { data: insertedMember, error: memberError } = await supabase
    .from("members")
    .insert(memberInsertPayload)
    .select("id")
    .single();

  if (memberError) {
    if (!isMissingOverallGoalColumn(memberError)) {
      throw memberError;
    }

    const { data: fallbackMember, error: fallbackMemberError } = await supabase
      .from("members")
      .insert({
        name,
        gender,
      })
      .select("id")
      .single();

    if (fallbackMemberError) {
      throw fallbackMemberError;
    }

    member = fallbackMember;
  } else {
    member = insertedMember;
  }

  const { error: goalError } = await supabase.from("weekly_goals").insert({
    member_id: member.id,
    week_start: COMMUNITY_START_WEEK,
    target_sessions: targetSessions,
    target_minutes: targetMinutes,
  });

  if (goalError) {
    throw goalError;
  }

  revalidatePath("/members");
  revalidatePath("/");
}

export async function upsertWeeklyGoal(formData: FormData) {
  const memberId = String(formData.get("member_id") ?? "").trim();
  const targetSessions = Number(formData.get("target_sessions") ?? 0);
  const targetMinutes = Number(formData.get("target_minutes") ?? 0);

  if (!memberId) {
    throw new Error("회원을 선택하세요.");
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("weekly_goals").upsert(
    {
      member_id: memberId,
      week_start: COMMUNITY_START_WEEK,
      target_sessions: targetSessions,
      target_minutes: targetMinutes,
    },
    {
      onConflict: "member_id,week_start",
    },
  );

  if (error) {
    throw error;
  }

  revalidatePath("/members");
  revalidatePath("/");
}

export async function updateMemberWithGoal(formData: FormData) {
  const memberId = String(formData.get("member_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const targetSessions = Number(formData.get("target_sessions") ?? 0);
  const targetMinutes = Number(formData.get("target_minutes") ?? 0);
  const overallGoalTitle = String(formData.get("overall_goal_title") ?? "").trim();
  const overallGoalValue = String(formData.get("overall_goal_value") ?? "").trim();
  const overallGoalNote = String(formData.get("overall_goal_note") ?? "").trim();
  const overallGoalAchieved = parseOverallGoalAchieved(formData.get("overall_goal_achieved"));

  if (!memberId) {
    throw new Error("수정할 회원 정보가 없습니다.");
  }

  if (!name) {
    throw new Error("회원 이름은 필수입니다.");
  }

  if (!gender || !["M", "F"].includes(gender)) {
    throw new Error("성별은 M/F 값으로 입력해야 합니다.");
  }

  if (!Number.isFinite(targetSessions) || targetSessions <= 0) {
    throw new Error("목표 회차를 올바르게 입력하세요.");
  }

  if (!Number.isFinite(targetMinutes) || targetMinutes < 0) {
    throw new Error("기본 운동 시간을 올바르게 입력하세요.");
  }

  const supabase = createSupabaseAdmin();

  const { error: memberError } = await supabase
    .from("members")
    .update({
      name,
      gender,
      overall_goal_title: overallGoalTitle || null,
      overall_goal_value: overallGoalValue || null,
      overall_goal_note: overallGoalNote || null,
      overall_goal_achieved: overallGoalAchieved,
    })
    .eq("id", memberId);

  if (memberError) {
    if (!isMissingOverallGoalColumn(memberError)) {
      throw memberError;
    }

    const { error: fallbackMemberError } = await supabase
      .from("members")
      .update({
        name,
        gender,
      })
      .eq("id", memberId);

    if (fallbackMemberError) {
      throw fallbackMemberError;
    }
  }

  const { error: goalError } = await supabase.from("weekly_goals").upsert(
    {
      member_id: memberId,
      week_start: COMMUNITY_START_WEEK,
      target_sessions: targetSessions,
      target_minutes: targetMinutes,
    },
    {
      onConflict: "member_id,week_start",
    },
  );

  if (goalError) {
    throw goalError;
  }

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}/edit`);
  revalidatePath("/");
}

export async function createMemberWithGoalAction(
  _prevState: MemberActionState = initialMemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  try {
    await createMemberWithGoal(formData);
    return memberSuccess("회원 등록이 완료되었습니다.");
  } catch (error) {
    return memberFailure(
      error instanceof Error ? error.message : "회원 등록 중 오류가 발생했습니다.",
    );
  }
}

export async function updateMemberWithGoalAction(
  _prevState: MemberActionState = initialMemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  try {
    await updateMemberWithGoal(formData);
    return memberSuccess("회원 정보가 저장되었습니다.");
  } catch (error) {
    return memberFailure(
      error instanceof Error ? error.message : "회원 저장 중 오류가 발생했습니다.",
    );
  }
}




