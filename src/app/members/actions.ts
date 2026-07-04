"use server";

import { revalidatePath } from "next/cache";

import { COMMUNITY_START_WEEK } from "@/lib/data";
import { getActiveSettlementPeriod } from "@/lib/settlement-period";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export type MemberActionState = {
  ok: boolean;
  message: string;
  submittedAt: number;
};

function isMissingOverallGoalColumn(error: unknown) {
  return isSupabaseErrorCode(error, "42703") || isSupabaseErrorCode(error, "PGRST204");
}

function isMissingWeeklyGoalConflictConstraint(error: unknown) {
  return isSupabaseErrorCode(error, "42P10");
}

function isSupabaseErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}

function throwSupabaseError(action: string, error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }

  if (typeof error === "object" && error !== null) {
    const supabaseError = error as {
      code?: string;
      details?: string | null;
      hint?: string | null;
      message?: string;
    };
    const code = supabaseError.code ? ` (${supabaseError.code})` : "";
    const details = supabaseError.details ? ` ${supabaseError.details}` : "";
    const hint = supabaseError.hint ? ` ${supabaseError.hint}` : "";
    const message = supabaseError.message || "알 수 없는 데이터베이스 오류가 발생했습니다.";

    throw new Error(`${action} 실패${code}: ${message}${details}${hint}`);
  }

  throw new Error(`${action} 실패: 알 수 없는 오류가 발생했습니다.`);
}

function parseOverallGoalAchieved(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return false;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function parsePenaltyAmount(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  const amount = raw ? Number(raw) : 100_000;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("본인 설정 벌금액을 올바르게 입력하세요.");
  }

  return Math.round(amount);
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const date = String(value ?? "").trim();
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("증적 날짜를 올바르게 입력하세요.");
  }

  return date;
}

function getSettlementFields(formData: FormData, overallGoalAchieved: boolean | null) {
  const penaltyAmount = parsePenaltyAmount(formData.get("penalty_amount"));
  const shouldSaveJuneProof = overallGoalAchieved === false;
  const settlementPeriod = getActiveSettlementPeriod();

  if (!shouldSaveJuneProof) {
    return {
      penalty_amount: penaltyAmount,
      june_goal_proof_achieved: false,
      june_goal_proof_date: null,
      june_goal_proof_note: null,
    };
  }

  const juneGoalProofAchieved = parseBoolean(formData.get("june_goal_proof_achieved"));
  const juneGoalProofDate = parseOptionalDate(formData.get("june_goal_proof_date"));
  const juneGoalProofNote = String(formData.get("june_goal_proof_note") ?? "").trim();

  if (juneGoalProofAchieved && !juneGoalProofDate) {
    throw new Error(`${settlementPeriod.proofMonthLabel} 운동 증적이 있으면 증적 날짜를 입력하세요.`);
  }

  if (
    juneGoalProofAchieved &&
    juneGoalProofDate &&
    (juneGoalProofDate < settlementPeriod.proofStartsAt ||
      juneGoalProofDate > settlementPeriod.proofEndsAt)
  ) {
    throw new Error(
      `${settlementPeriod.proofMonthLabel} 운동 증적 날짜는 ${settlementPeriod.proofStartsAt} ~ ${settlementPeriod.proofEndsAt} 사이로 입력하세요.`,
    );
  }

  return {
    penalty_amount: penaltyAmount,
    june_goal_proof_achieved: juneGoalProofAchieved,
    june_goal_proof_date: juneGoalProofAchieved ? juneGoalProofDate : null,
    june_goal_proof_note: juneGoalProofAchieved ? juneGoalProofNote || null : null,
  };
}

function memberSuccess(message: string): MemberActionState {
  return { ok: true, message, submittedAt: Date.now() };
}

function memberFailure(message: string): MemberActionState {
  return { ok: false, message, submittedAt: Date.now() };
}

async function saveFixedWeeklyGoal(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  memberId: string,
  targetSessions: number,
  targetMinutes: number,
) {
  const payload = {
    member_id: memberId,
    week_start: COMMUNITY_START_WEEK,
    target_sessions: targetSessions,
    target_minutes: targetMinutes,
  };

  const { error } = await supabase.from("weekly_goals").upsert(payload, {
    onConflict: "member_id,week_start",
  });

  if (!error) {
    return;
  }

  if (!isMissingWeeklyGoalConflictConstraint(error)) {
    throwSupabaseError("주간 목표 저장", error);
  }

  const { data: existingGoal, error: lookupError } = await supabase
    .from("weekly_goals")
    .select("id")
    .eq("member_id", memberId)
    .eq("week_start", COMMUNITY_START_WEEK)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throwSupabaseError("기존 주간 목표 조회", lookupError);
  }

  if (existingGoal) {
    const { error: updateError } = await supabase
      .from("weekly_goals")
      .update({
        target_sessions: targetSessions,
        target_minutes: targetMinutes,
      })
      .eq("member_id", memberId)
      .eq("week_start", COMMUNITY_START_WEEK);

    if (updateError) {
      throwSupabaseError("주간 목표 수정", updateError);
    }

    return;
  }

  const { error: insertError } = await supabase.from("weekly_goals").insert(payload);

  if (insertError) {
    throwSupabaseError("주간 목표 등록", insertError);
  }
}

export async function createMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const overallGoalAchieved = parseOverallGoalAchieved(formData.get("overall_goal_achieved"));
  const settlementFields = getSettlementFields(formData, overallGoalAchieved);

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
    overall_goal_title: null,
    overall_goal_value: null,
    overall_goal_achieved: overallGoalAchieved,
    ...settlementFields,
  };

  const { error } = await supabase.from("members").insert(payload);

  if (error) {
    if (!isMissingOverallGoalColumn(error)) {
      throwSupabaseError("회원 등록", error);
    }

    const { error: fallbackError } = await supabase.from("members").insert({
      name,
      gender,
    });

    if (fallbackError) {
      throwSupabaseError("회원 기본 정보 등록", fallbackError);
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
  const overallGoalAchieved = parseOverallGoalAchieved(formData.get("overall_goal_achieved"));
  const settlementFields = getSettlementFields(formData, overallGoalAchieved);

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
    overall_goal_title: null,
    overall_goal_value: null,
    overall_goal_achieved: overallGoalAchieved,
    ...settlementFields,
  };

  const { data: insertedMember, error: memberError } = await supabase
    .from("members")
    .insert(memberInsertPayload)
    .select("id")
    .single();

  if (memberError) {
    if (!isMissingOverallGoalColumn(memberError)) {
      throwSupabaseError("회원 등록", memberError);
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
      throwSupabaseError("회원 기본 정보 등록", fallbackMemberError);
    }

    member = fallbackMember;
  } else {
    member = insertedMember;
  }

  await saveFixedWeeklyGoal(supabase, member.id, targetSessions, targetMinutes);

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

  await saveFixedWeeklyGoal(supabase, memberId, targetSessions, targetMinutes);

  revalidatePath("/members");
  revalidatePath("/");
}

export async function updateMemberWithGoal(formData: FormData) {
  const memberId = String(formData.get("member_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const targetSessions = Number(formData.get("target_sessions") ?? 0);
  const targetMinutes = Number(formData.get("target_minutes") ?? 0);
  const overallGoalAchieved = parseOverallGoalAchieved(formData.get("overall_goal_achieved"));
  const settlementFields = getSettlementFields(formData, overallGoalAchieved);

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
      overall_goal_achieved: overallGoalAchieved,
      ...settlementFields,
    })
    .eq("id", memberId);

  if (memberError) {
    if (!isMissingOverallGoalColumn(memberError)) {
      throwSupabaseError("회원 정보 수정", memberError);
    }

    const { error: fallbackMemberError } = await supabase
      .from("members")
      .update({
        name,
        gender,
      })
      .eq("id", memberId);

    if (fallbackMemberError) {
      throwSupabaseError("회원 기본 정보 수정", fallbackMemberError);
    }
  }

  await saveFixedWeeklyGoal(supabase, memberId, targetSessions, targetMinutes);

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}/edit`);
  revalidatePath("/");
  revalidatePath("/penalty-documents");
}

export async function createMemberWithGoalAction(
  _prevState: MemberActionState,
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
  _prevState: MemberActionState,
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
