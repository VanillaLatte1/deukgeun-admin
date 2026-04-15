"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdmin } from "@/lib/supabase-server";

export type WeeklyExceptionActionState = {
  ok: boolean;
  message: string;
  submittedAt: number;
};

const initialState: WeeklyExceptionActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
};

function success(message: string): WeeklyExceptionActionState {
  return { ok: true, message, submittedAt: Date.now() };
}

function failure(message: string): WeeklyExceptionActionState {
  return { ok: false, message, submittedAt: Date.now() };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function revalidateWeeklyPages() {
  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/workout-records");
  revalidatePath("/weekly-exceptions");
}

export async function upsertWeeklyExceptionAction(
  _prevState: WeeklyExceptionActionState = initialState,
  formData: FormData,
): Promise<WeeklyExceptionActionState> {
  try {
    const memberId = String(formData.get("member_id") ?? "").trim();
    const weekStart = String(formData.get("week_start") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    if (!memberId || !weekStart) {
      return failure("회원과 주차는 필수입니다.");
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("weekly_exceptions").upsert(
      {
        member_id: memberId,
        week_start: weekStart,
        reason: reason || null,
      },
      {
        onConflict: "member_id,week_start",
      },
    );

    if (error) {
      throw error;
    }

    revalidateWeeklyPages();
    return success("해당 회원을 이번 주 진행 체크에서 제외했습니다.");
  } catch (error) {
    return failure(getErrorMessage(error, "주간 제외 처리 중 오류가 발생했습니다."));
  }
}

export async function deleteWeeklyExceptionAction(
  _prevState: WeeklyExceptionActionState = initialState,
  formData: FormData,
): Promise<WeeklyExceptionActionState> {
  try {
    const memberId = String(formData.get("member_id") ?? "").trim();
    const weekStart = String(formData.get("week_start") ?? "").trim();

    if (!memberId || !weekStart) {
      return failure("해제 대상 정보가 부족합니다.");
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("weekly_exceptions")
      .delete()
      .eq("member_id", memberId)
      .eq("week_start", weekStart);

    if (error) {
      throw error;
    }

    revalidateWeeklyPages();
    return success("주간 제외 처리를 해제했습니다.");
  } catch (error) {
    return failure(getErrorMessage(error, "주간 제외 해제 중 오류가 발생했습니다."));
  }
}
