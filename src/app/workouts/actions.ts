"use server";

import { revalidatePath } from "next/cache";

import { getCurrentWeekStart } from "@/lib/data";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getWorkoutPolicy, toWorkoutType } from "@/lib/workout-policy";

export type WorkoutActionState = {
  ok: boolean;
  message: string;
  submittedAt: number;
};

function fileExtension(file: File) {
  const byName = file.name.split(".").pop();
  if (byName && byName.length <= 8) {
    return byName.toLowerCase();
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadImage(
  bucket: string,
  memberId: string,
  workoutDate: string,
  type: "start" | "end",
  file: File,
) {
  const supabase = createSupabaseAdmin();
  const ext = fileExtension(file);
  const path = `${memberId}/${workoutDate}/${Date.now()}-${type}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return path;
}

function success(message: string): WorkoutActionState {
  return { ok: true, message, submittedAt: Date.now() };
}

function failure(message: string): WorkoutActionState {
  return { ok: false, message, submittedAt: Date.now() };
}

function revalidateWorkoutPages() {
  revalidatePath("/");
  revalidatePath("/workouts");
  revalidatePath("/workout-records");
}

function validateWorkoutInput(
  exerciseTypeRaw: string,
  durationMinutes: number,
  startImage: File | null,
  endImage: File | null,
) {
  const exerciseType = toWorkoutType(exerciseTypeRaw);
  const policy = getWorkoutPolicy(exerciseType);
  const hasStartImage = Boolean(startImage && startImage.size > 0);
  const hasEndImage = Boolean(endImage && endImage.size > 0);

  if (!Number.isFinite(durationMinutes) || durationMinutes < policy.minimumValidMinutes) {
    return failure(`${policy.label}은(는) 최소 ${policy.minimumValidMinutes}분 이상이어야 합니다.`);
  }

  if (!hasStartImage) {
    return failure("인증 이미지를 첨부해 주세요.");
  }

  if (policy.requiredImageCount === 2 && !hasEndImage) {
    return failure("일반 운동은 시작/종료 이미지를 모두 첨부해야 합니다.");
  }

  return null;
}

export async function createWorkoutSession(
  _prevState: WorkoutActionState,
  formData: FormData,
): Promise<WorkoutActionState> {
  try {
    const memberId = String(formData.get("member_id") ?? "").trim();
    const workoutDate = String(formData.get("workout_date") ?? "").trim();
    const sessionNo = Number(formData.get("session_no") ?? 1);
    const exerciseType = toWorkoutType(String(formData.get("exercise_type") ?? ""));
    const durationMinutes = Number(formData.get("duration_minutes") ?? 0);
    const notes = String(formData.get("notes") ?? "").trim();
    const startImage = formData.get("start_image") as File | null;
    const endImage = formData.get("end_image") as File | null;

    if (!memberId || !workoutDate) {
      return failure("회원과 운동 날짜는 필수입니다.");
    }

    const inputError = validateWorkoutInput(exerciseType, durationMinutes, startImage, endImage);
    if (inputError) {
      return inputError;
    }

    const supabase = createSupabaseAdmin();
    const weekStart = getCurrentWeekStart(new Date(workoutDate));
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    const { data: existingSessions, error: existingSessionError } = await supabase
      .from("workout_sessions")
      .select("id, workout_date")
      .eq("member_id", memberId)
      .eq("session_no", sessionNo)
      .gte("workout_date", weekStart)
      .lt("workout_date", weekEnd);

    if (existingSessionError) {
      throw existingSessionError;
    }

    if ((existingSessions ?? []).length > 0) {
      return failure("선택한 회원은 해당 주간/회차 인증이 이미 등록되어 있습니다.");
    }

    const bucket = "workout-proofs";
    const policy = getWorkoutPolicy(exerciseType);
    const startPath = await uploadImage(bucket, memberId, workoutDate, "start", startImage as File);
    const endPath =
      policy.requiredImageCount === 2
        ? await uploadImage(bucket, memberId, workoutDate, "end", endImage as File)
        : null;

    const { error } = await supabase.from("workout_sessions").insert({
      member_id: memberId,
      workout_date: workoutDate,
      session_no: sessionNo,
      exercise_type: exerciseType,
      duration_minutes: durationMinutes,
      start_image_path: startPath,
      end_image_path: endPath,
      notes: notes || null,
      created_by: "admin",
    });

    if (error) {
      throw error;
    }

    revalidateWorkoutPages();
    return success("인증 저장이 완료되었습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "인증 저장 중 오류가 발생했습니다.");
  }
}

export async function updateWorkoutSession(
  _prevState: WorkoutActionState,
  formData: FormData,
): Promise<WorkoutActionState> {
  try {
    const id = String(formData.get("id") ?? "").trim();
    const workoutDate = String(formData.get("workout_date") ?? "").trim();
    const sessionNo = Number(formData.get("session_no") ?? 1);
    const exerciseType = toWorkoutType(String(formData.get("exercise_type") ?? ""));
    const inputDurationMinutes = Number(formData.get("duration_minutes") ?? 0);
    const notesRaw = String(formData.get("notes") ?? "").trim();
    const startImage = formData.get("start_image") as File | null;
    const endImage = formData.get("end_image") as File | null;

    if (!id || !workoutDate || !Number.isFinite(sessionNo) || !Number.isFinite(inputDurationMinutes)) {
      return failure("수정 값이 올바르지 않습니다.");
    }

    const supabase = createSupabaseAdmin();
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("member_id, exercise_type, start_image_path, end_image_path")
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      throw sessionError ?? new Error("수정할 인증 내역을 찾을 수 없습니다.");
    }

    const policy = getWorkoutPolicy(exerciseType);
    const hasStartImage = Boolean(startImage && startImage.size > 0);
    const hasEndImage = Boolean(endImage && endImage.size > 0);
    const nextStartCandidate = hasStartImage ? (startImage as File) : null;
    const nextEndCandidate = hasEndImage ? (endImage as File) : null;
    const hasStartProofAfterUpdate = Boolean(session.start_image_path || nextStartCandidate);
    const hasEndProofAfterUpdate =
      policy.requiredImageCount === 1 ? true : Boolean(session.end_image_path || nextEndCandidate);

    const durationMinutes = inputDurationMinutes;

    if (durationMinutes < policy.minimumValidMinutes) {
      return failure(`${policy.label}은(는) 최소 ${policy.minimumValidMinutes}분 이상이어야 합니다.`);
    }

    if (!hasStartProofAfterUpdate) {
      return failure("인증 이미지를 첨부해 주세요.");
    }

    if (!hasEndProofAfterUpdate) {
      return failure("일반 운동은 시작/종료 이미지를 모두 첨부해야 합니다.");
    }

    const bucket = "workout-proofs";

    const [nextStartPath, nextEndPath] = await Promise.all([
      nextStartCandidate
        ? uploadImage(bucket, session.member_id, workoutDate, "start", nextStartCandidate)
        : Promise.resolve<string | null>(null),
      policy.requiredImageCount === 2 && nextEndCandidate
        ? uploadImage(bucket, session.member_id, workoutDate, "end", nextEndCandidate)
        : Promise.resolve<string | null>(null),
    ]);

    const { error } = await supabase
      .from("workout_sessions")
      .update({
        workout_date: workoutDate,
        session_no: Math.max(1, Math.min(5, sessionNo)),
        exercise_type: exerciseType,
        duration_minutes: Math.max(0, durationMinutes),
        notes: notesRaw || null,
        ...(nextStartPath ? { start_image_path: nextStartPath } : {}),
        ...(policy.requiredImageCount === 2
          ? nextEndPath
            ? { end_image_path: nextEndPath }
            : {}
          : { end_image_path: null }),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    const removablePaths: string[] = [];
    if (nextStartPath && session.start_image_path) {
      removablePaths.push(session.start_image_path);
    }
    if (policy.requiredImageCount === 1 && session.end_image_path) {
      removablePaths.push(session.end_image_path);
    }
    if (nextEndPath && session.end_image_path) {
      removablePaths.push(session.end_image_path);
    }

    if (removablePaths.length > 0) {
      await supabase.storage.from(bucket).remove(removablePaths);
    }

    revalidateWorkoutPages();
    return success("인증 정보가 수정되었습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "인증 수정 중 오류가 발생했습니다.");
  }
}

export async function deleteWorkoutSession(
  _prevState: WorkoutActionState,
  formData: FormData,
): Promise<WorkoutActionState> {
  try {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return failure("삭제 대상이 없습니다.");
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("workout_sessions").delete().eq("id", id);

    if (error) {
      throw error;
    }

    revalidateWorkoutPages();
    return success("인증 내역이 삭제되었습니다.");
  } catch (error) {
    return failure(error instanceof Error ? error.message : "인증 삭제 중 오류가 발생했습니다.");
  }
}
