"use client";

import { useActionState, useMemo, useState, useSyncExternalStore } from "react";

import { createWorkoutSession, type WorkoutActionState } from "@/app/workouts/actions";
import { FileInputField } from "@/components/file-input-field";
import { MemberSearchSelect } from "@/components/member-search-select";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import type { WorkoutSessionSlot } from "@/lib/data";
import {
  getWorkoutPolicy,
  WORKOUT_TYPE_GENERAL,
  WORKOUT_TYPE_RUNNING,
} from "@/lib/workout-policy";

type MemberOption = {
  id: string;
  name: string;
  gender: string | null;
};

type WorkoutEntryFormProps = {
  members: MemberOption[];
  defaultWorkoutDate: string;
  existingSessionSlots: WorkoutSessionSlot[];
};

type DurationCalcState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string; durationMinutes: number }
  | { status: "manual"; message: string };

const initialWorkoutActionState: WorkoutActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
  needsManualDuration: false,
};

function getWeekStart(dateText: string) {
  const date = new Date(dateText);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function idleCalcState(): DurationCalcState {
  return {
    status: "idle",
    message: "사진 2장을 올린 뒤 시간 계산 버튼을 눌러 주세요.",
  };
}

export function WorkoutEntryForm({
  members,
  defaultWorkoutDate,
  existingSessionSlots,
}: WorkoutEntryFormProps) {
  const [state, formAction, isPending] = useActionState(
    createWorkoutSession,
    initialWorkoutActionState,
  );
  const [dismissedAt, setDismissedAt] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(defaultWorkoutDate);
  const [selectedSessionNo, setSelectedSessionNo] = useState("1");
  const [exerciseType, setExerciseType] = useState(WORKOUT_TYPE_GENERAL);
  const [durationMinutes, setDurationMinutes] = useState(
    getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes,
  );
  const [startImageFile, setStartImageFile] = useState<File | null>(null);
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [durationCalcState, setDurationCalcState] = useState<DurationCalcState>(idleCalcState);

  const policy = useMemo(() => getWorkoutPolicy(exerciseType), [exerciseType]);
  const requiresManualDuration =
    exerciseType === WORKOUT_TYPE_RUNNING || durationCalcState.status === "manual";
  const guideContent = useMemo(() => {
    if (exerciseType === WORKOUT_TYPE_RUNNING) {
      return {
        title: "러닝 등록 안내",
        description: "러닝은 인증 사진 1장과 운동 시간을 직접 입력해 등록합니다.",
        accent: "사진 1장, 시간 직접 입력",
      };
    }

    if (durationCalcState.status === "success") {
      return {
        title: "일반 운동 계산 완료",
        description: "사진의 타임스탬프를 읽어 운동 시간이 계산되었습니다. 그대로 등록하면 됩니다.",
        accent: `${durationCalcState.durationMinutes}분 계산 완료`,
      };
    }

    if (durationCalcState.status === "manual") {
      return {
        title: "일반 운동 수동 입력 안내",
        description: "자동 계산에 실패해 이번 등록은 운동 시간을 직접 입력하는 방식으로 전환되었습니다.",
        accent: "자동 계산 실패, 시간 수동 입력",
      };
    }

    return {
      title: "일반 운동 등록 안내",
      description: "사진 2장을 올린 뒤 시간 계산 버튼을 눌러 운동 시간을 먼저 확인한 다음 등록합니다.",
      accent: "사진 2장, 버튼 클릭 시 1회 계산",
    };
  }, [durationCalcState, exerciseType]);
  const showSuccessModal =
    state.ok && state.submittedAt > 0 && state.submittedAt !== dismissedAt;

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const takenSessions = useMemo(() => {
    if (!selectedMemberId || !selectedWorkoutDate) {
      return new Set<string>();
    }

    const selectedWeekStart = getWeekStart(selectedWorkoutDate);

    return new Set(
      existingSessionSlots
        .filter(
          (slot) =>
            slot.member_id === selectedMemberId &&
            getWeekStart(slot.workout_date) === selectedWeekStart,
        )
        .map((slot) => String(slot.session_no)),
    );
  }, [existingSessionSlots, selectedMemberId, selectedWorkoutDate]);

  const sessionOptions = useMemo(
    () =>
      ["1", "2", "3", "4", "5"].map((value) => ({
        value,
        disabled: takenSessions.has(value),
      })),
    [takenSessions],
  );

  const availableSession = useMemo(
    () => sessionOptions.find((option) => !option.disabled)?.value ?? "",
    [sessionOptions],
  );
  const effectiveSessionNo =
    selectedSessionNo && !takenSessions.has(selectedSessionNo) ? selectedSessionNo : availableSession;

  if (!mounted) {
    return null;
  }

  const resetGeneralCalculation = () => {
    setDurationCalcState(idleCalcState());
    setDurationMinutes(getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes);
  };

  const handleExerciseTypeChange = (nextValue: string) => {
    const nextType =
      nextValue === WORKOUT_TYPE_RUNNING ? WORKOUT_TYPE_RUNNING : WORKOUT_TYPE_GENERAL;
    setExerciseType(nextType);
    setDurationMinutes(getWorkoutPolicy(nextType).defaultDurationMinutes);
    if (nextType === WORKOUT_TYPE_GENERAL) {
      resetGeneralCalculation();
      return;
    }

    setDurationCalcState({
      status: "manual",
      message: "러닝은 시간 계산 없이 직접 입력합니다.",
    });
  };

  const handleWorkoutDateChange = (nextValue: string) => {
    setSelectedWorkoutDate(nextValue);
    if (exerciseType === WORKOUT_TYPE_GENERAL) {
      resetGeneralCalculation();
    }
  };

  const handleStartImageChange = (file: File | null) => {
    setStartImageFile(file);
    if (exerciseType === WORKOUT_TYPE_GENERAL) {
      resetGeneralCalculation();
    }
  };

  const handleEndImageChange = (file: File | null) => {
    setEndImageFile(file);
    if (exerciseType === WORKOUT_TYPE_GENERAL) {
      resetGeneralCalculation();
    }
  };

  const handleCalculateDuration = async () => {
    if (!selectedWorkoutDate) {
      setDurationCalcState({ status: "manual", message: "운동 날짜를 먼저 선택해 주세요." });
      return;
    }

    if (!startImageFile || !endImageFile) {
      setDurationCalcState({ status: "manual", message: "시작 이미지와 종료 이미지를 모두 올려 주세요." });
      return;
    }

    setDurationCalcState({ status: "loading", message: "타임스탬프를 읽어 운동 시간을 계산하고 있습니다..." });

    try {
      const body = new FormData();
      body.set("workout_date", selectedWorkoutDate);
      body.set("start_image", startImageFile);
      body.set("end_image", endImageFile);

      const response = await fetch("/api/workout-duration", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        durationMinutes?: number;
        startText?: string;
        endText?: string;
      };

      if (!response.ok || !payload.ok || !payload.durationMinutes) {
        setDurationCalcState({
          status: "manual",
          message: payload.message ?? "자동 계산에 실패했습니다. 운동 시간을 직접 입력해 주세요.",
        });
        return;
      }

      setDurationMinutes(payload.durationMinutes);
      setDurationCalcState({
        status: "success",
        durationMinutes: payload.durationMinutes,
        message: `시작 ${payload.startText ?? "-"} / 종료 ${payload.endText ?? "-"} 기준으로 ${payload.durationMinutes}분이 계산되었습니다.`,
      });
    } catch {
      setDurationCalcState({
        status: "manual",
        message: "자동 계산에 실패했습니다. 운동 시간을 직접 입력해 주세요.",
      });
    }
  };

  const handleSuccessClose = () => {
    setDismissedAt(state.submittedAt);
    setSelectedMemberId("");
    setSelectedWorkoutDate(defaultWorkoutDate);
    setSelectedSessionNo("1");
    setExerciseType(WORKOUT_TYPE_GENERAL);
    setDurationMinutes(getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes);
    setStartImageFile(null);
    setEndImageFile(null);
    setDurationCalcState(idleCalcState());
  };

  return (
    <>
      <form action={formAction} className="form-grid workout-form-grid">
        <input
          type="hidden"
          name="manual_duration_override"
          value={requiresManualDuration ? "1" : "0"}
        />
        <input
          type="hidden"
          name="timestamp_calculated"
          value={durationCalcState.status === "success" ? "1" : "0"}
        />
        <input type="hidden" name="session_no" value={effectiveSessionNo} />
        <input
          type="hidden"
          name="duration_minutes"
          value={String(durationMinutes)}
        />

        <div className="span-2 workout-guide-card">
          <div>
            <span className="workout-guide-kicker">{guideContent.accent}</span>
            <strong>{guideContent.title}</strong>
          </div>
          <p>{guideContent.description}</p>
        </div>

        <MemberSearchSelect
          members={members}
          name="member_id"
          label="회원"
          selectedValue={selectedMemberId}
          onValueChange={setSelectedMemberId}
        />

        <label>
          운동 날짜
          <input
            type="date"
            name="workout_date"
            required
            value={selectedWorkoutDate}
            onChange={(event) => handleWorkoutDateChange(event.target.value)}
          />
        </label>

        <div className="span-2 workout-inline-triplet">
          <label>
            회차
            <input
              type="text"
              value={effectiveSessionNo ? `${effectiveSessionNo}회차 자동 배정` : "배정 가능한 회차 없음"}
              readOnly
            />
          </label>

          <label>
            운동 종류
            <select
              name="exercise_type"
              value={exerciseType}
              onChange={(event) => handleExerciseTypeChange(event.target.value)}
            >
              <option value={WORKOUT_TYPE_GENERAL}>일반 운동</option>
              <option value={WORKOUT_TYPE_RUNNING}>러닝</option>
            </select>
          </label>

          {requiresManualDuration ? (
            <label>
              운동 시간(분)
              <input
                type="number"
                min={policy.minimumValidMinutes}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                required
              />
            </label>
          ) : (
            <div className="workout-guide-card">
              <strong>운동 시간 계산 대기</strong>
              <p>{durationCalcState.message}</p>
            </div>
          )}
        </div>

        {exerciseType === WORKOUT_TYPE_GENERAL && durationCalcState.status !== "idle" ? (
          <div
            className={`span-2 workout-ocr-feedback is-${
              durationCalcState.status === "success"
                ? "success"
                : durationCalcState.status === "loading"
                  ? "loading"
                  : "error"
            }`}
          >
            {durationCalcState.message}
          </div>
        ) : null}

        <FileInputField
          label={policy.requiredImageCount === 1 ? "인증 이미지" : "시작 이미지"}
          name="start_image"
          required
          onFileChange={handleStartImageChange}
        />

        {policy.requiredImageCount === 2 ? (
          <FileInputField
            label="종료 이미지"
            name="end_image"
            required
            onFileChange={handleEndImageChange}
          />
        ) : null}

        {exerciseType === WORKOUT_TYPE_GENERAL && !requiresManualDuration ? (
          <Button
            type="button"
            disabled={!startImageFile || !endImageFile || durationCalcState.status === "loading"}
            onClick={() => void handleCalculateDuration()}
          >
            {durationCalcState.status === "loading" ? "시간 계산 중..." : "시간 계산"}
          </Button>
        ) : null}

        <label className="span-2">
          메모 (선택)
          <textarea name="notes" rows={3} />
        </label>

        <Button
          type="submit"
          disabled={
            isPending ||
            !availableSession ||
            (exerciseType === WORKOUT_TYPE_GENERAL &&
              durationCalcState.status !== "success" &&
              durationCalcState.status !== "manual")
          }
        >
          {isPending ? "등록 중..." : "인증 등록"}
        </Button>
      </form>

      {selectedMemberId && !availableSession ? (
        <p className="error">선택한 회원은 해당 주간의 1~5회차 인증이 모두 등록되어 있습니다.</p>
      ) : null}

      {!state.ok && state.message && !state.needsManualDuration ? (
        <p className="error">{state.message}</p>
      ) : null}

      <Modal
        open={showSuccessModal}
        title="등록 완료"
        description={state.message || "운동 인증이 정상적으로 저장되었습니다."}
        onClose={handleSuccessClose}
      />
    </>
  );
}
