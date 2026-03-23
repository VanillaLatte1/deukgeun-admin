"use server";

import { revalidatePath } from "next/cache";

import { COMMUNITY_START_WEEK } from "@/lib/data";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function createMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();

  if (!name) {
    throw new Error("회원 이름은 필수입니다.");
  }

  if (!gender || !["M", "F"].includes(gender)) {
    throw new Error("성별은 M/F 값으로 입력해야 합니다.");
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("members").insert({
    name,
    gender,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/members");
  revalidatePath("/");
}

export async function createMemberWithGoal(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const targetSessions = Number(formData.get("target_sessions") ?? 0);
  const targetMinutes = Number(formData.get("target_minutes") ?? 0);

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
    throw new Error("목표 시간을 올바르게 입력하세요.");
  }

  const supabase = createSupabaseAdmin();
  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      name,
      gender,
    })
    .select("id")
    .single();

  if (memberError) {
    throw memberError;
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
    throw new Error("목표 시간을 올바르게 입력하세요.");
  }

  const supabase = createSupabaseAdmin();

  const { error: memberError } = await supabase
    .from("members")
    .update({
      name,
      gender,
    })
    .eq("id", memberId);

  if (memberError) {
    throw memberError;
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




