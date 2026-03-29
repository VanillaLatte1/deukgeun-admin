"use client";

import { useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { createWorkoutSession, type WorkoutActionState } from "@/app/workouts/actions";
import { FileInputField } from "@/components/file-input-field";
import { MemberSearchSelect } from "@/components/member-search-select";
import { Modal } from "@/components/modal";
import type { WorkoutSessionSlot } from "@/lib/data";
import { inferWorkoutDurationFromImages } from "@/lib/workout-ocr";
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

const initialWorkoutActionState: WorkoutActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
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
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [ocrMessage, setOcrMessage] = useState("");

  const policy = useMemo(() => getWorkoutPolicy(exerciseType), [exerciseType]);
  const guideContent = useMemo(() => {
    if (exerciseType === WORKOUT_TYPE_RUNNING) {
      return {
        title: "러닝 등록 안내",
        description: "러닝은 인증 사진 1장만 등록하면 되고, 운동 시간은 30분 이상부터 인정됩니다.",
        accent: "사진 1장 · 최소 30분",
      };
    }

    return {
      title: "일반 운동 등록 안내",
      description:
        "일반 운동은 시작 이미지와 종료 이미지를 모두 등록해야 하고, 두 사진의 시간 표시를 읽으면 운동 시간이 자동 계산됩니다.",
      accent: "시작/종료 사진 2장",
    };
  }, [exerciseType]);
  const showSuccessModal =
    state.ok && state.submittedAt > 0 && state.submittedAt !== dismissedAt;
  const formKey = state.ok ? state.submittedAt : 0;

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
        label: `${value}회차`,
        disabled: takenSessions.has(value),
      })),
    [takenSessions],
  );

  const availableSessionOptions = useMemo(
    () => sessionOptions.filter((option) => !option.disabled),
    [sessionOptions],
  );

  const availableSession = useMemo(
    () => availableSessionOptions[0]?.value ?? "",
    [availableSessionOptions],
  );

  useEffect(() => {
    if (!availableSession) {
      setSelectedSessionNo("");
      return;
    }

    if (!selectedSessionNo || takenSessions.has(selectedSessionNo)) {
      setSelectedSessionNo(availableSession);
    }
  }, [availableSession, selectedSessionNo, takenSessions]);

  useEffect(() => {
    setDurationMinutes(policy.defaultDurationMinutes);
    setOcrStatus("idle");
    setOcrMessage("");
  }, [policy.defaultDurationMinutes, exerciseType]);

  useEffect(() => {
    if (state.ok) {
      setSelectedMemberId("");
      setSelectedWorkoutDate(defaultWorkoutDate);
      setSelectedSessionNo("1");
      setExerciseType(WORKOUT_TYPE_GENERAL);
      setDurationMinutes(getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes);
      setStartImageFile(null);
      setEndImageFile(null);
      setOcrStatus("idle");
      setOcrMessage("");
    }
  }, [defaultWorkoutDate, state.ok]);

  useEffect(() => {
    let cancelled = false;

    async function calculateDuration() {
      if (
        exerciseType !== WORKOUT_TYPE_GENERAL ||
        !startImageFile ||
        !endImageFile ||
        !selectedWorkoutDate
      ) {
        return;
      }

      setOcrStatus("loading");
      setOcrMessage("이미지에서 시간을 읽는 중입니다...");

      try {
        const result = await inferWorkoutDurationFromImages(
          startImageFile,
          endImageFile,
          selectedWorkoutDate,
        );

        if (cancelled) {
          return;
        }

        if (result) {
          setDurationMinutes(result.durationMinutes);
          setOcrStatus("success");
          setOcrMessage(`사진 시간을 읽어 운동 시간을 ${result.durationMinutes}분으로 자동 입력했습니다.`);
          return;
        }

        setOcrStatus("error");
        setOcrMessage("시간 인식에 실패해 기존 입력값을 유지합니다.");
      } catch {
        if (cancelled) {
          return;
        }

        setOcrStatus("error");
        setOcrMessage("시간 인식에 실패해 기존 입력값을 유지합니다.");
      }
    }

    void calculateDuration();

    return () => {
      cancelled = true;
    };
  }, [exerciseType, startImageFile, endImageFile, selectedWorkoutDate]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <form key={formKey} action={formAction} className="form-grid workout-form-grid">
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
            onChange={(event) => setSelectedWorkoutDate(event.target.value)}
          />
        </label>
        <div className="span-2 workout-inline-triplet">
          <label>
            회차
            <select
              name="session_no"
              required
              value={selectedSessionNo}
              onChange={(event) => setSelectedSessionNo(event.target.value)}
            >
              {availableSessionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            운동 종류
            <select
              name="exercise_type"
              value={exerciseType}
              onChange={(event) =>
                setExerciseType(
                  event.target.value === WORKOUT_TYPE_RUNNING
                    ? WORKOUT_TYPE_RUNNING
                    : WORKOUT_TYPE_GENERAL,
                )
              }
            >
              <option value={WORKOUT_TYPE_GENERAL}>일반 운동</option>
              <option value={WORKOUT_TYPE_RUNNING}>러닝</option>
            </select>
          </label>
          <label>
            운동 시간(분)
            <input
              type="number"
              name="duration_minutes"
              min={policy.minimumValidMinutes}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              required
            />
          </label>
        </div>
        {exerciseType === WORKOUT_TYPE_GENERAL && ocrStatus !== "idle" ? (
          <div className={`span-2 workout-ocr-feedback is-${ocrStatus}`}>{ocrMessage}</div>
        ) : null}
        <FileInputField
          label={policy.requiredImageCount === 1 ? "인증 이미지" : "시작 이미지"}
          name="start_image"
          required
          onFileChange={setStartImageFile}
        />
        {policy.requiredImageCount === 2 ? (
          <FileInputField
            label="종료 이미지"
            name="end_image"
            required
            onFileChange={setEndImageFile}
          />
        ) : null}
        <label className="span-2">
          메모 (선택)
          <textarea name="notes" rows={3} />
        </label>
        <button className="primary-btn" type="submit" disabled={isPending || !availableSession}>
          {isPending ? "등록 중..." : "인증 등록"}
        </button>
      </form>

      {selectedMemberId && !availableSession ? (
        <p className="error">선택한 회원은 해당 주간의 1~5회차 인증이 모두 등록되어 있습니다.</p>
      ) : null}

      {!state.ok && state.message ? <p className="error">{state.message}</p> : null}

      <Modal
        open={showSuccessModal}
        title="등록 완료"
        description={state.message || "운동 인증이 정상적으로 저장되었습니다."}
        onClose={() => setDismissedAt(state.submittedAt)}
      />
    </>
  );
}
