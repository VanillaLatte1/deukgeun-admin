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
  excusedMemberIds: string[];
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
  excusedMemberIds,
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

  const policy = useMemo(() => getWorkoutPolicy(exerciseType), [exerciseType]);
  const guideContent = useMemo(() => {
    if (exerciseType === WORKOUT_TYPE_RUNNING) {
      return {
        title: "러닝 등록 안내",
        description: "러닝은 인증 사진 1장과 운동 시간을 직접 입력해 등록합니다.",
        accent: "사진 1장, 시간 직접 입력",
      };
    }

    return {
      title: "일반 운동 등록 안내",
      description: "일반 운동은 시작 이미지와 종료 이미지를 모두 등록하고 운동 시간을 직접 입력해 저장합니다.",
      accent: "사진 2장, 시간 직접 입력",
    };
  }, [exerciseType]);
  const showSuccessModal =
    state.ok && state.submittedAt > 0 && state.submittedAt !== dismissedAt;
  const formKey = state.ok ? state.submittedAt : dismissedAt;

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
  const isExcusedMember = excusedMemberIds.includes(selectedMemberId);

  if (!mounted) {
    return null;
  }

  const handleExerciseTypeChange = (nextValue: string) => {
    const nextType =
      nextValue === WORKOUT_TYPE_RUNNING ? WORKOUT_TYPE_RUNNING : WORKOUT_TYPE_GENERAL;
    setExerciseType(nextType);
    setDurationMinutes(getWorkoutPolicy(nextType).defaultDurationMinutes);
  };

  const handleSuccessClose = () => {
    setDismissedAt(state.submittedAt);
    setSelectedMemberId("");
    setSelectedWorkoutDate(defaultWorkoutDate);
    setSelectedSessionNo("1");
    setExerciseType(WORKOUT_TYPE_GENERAL);
    setDurationMinutes(getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes);
  };

  return (
    <>
      <form key={formKey} action={formAction} className="form-grid workout-form-grid">
        <input type="hidden" name="session_no" value={effectiveSessionNo} />

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

        {isExcusedMember ? (
          <p className="error span-2">
            이 회원은 이번 주 진행 체크에서 제외 처리되어 있습니다. 기록은 등록할 수 있지만 대시보드 진행률에서는 제외됩니다.
          </p>
        ) : null}

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

        <FileInputField
          label={policy.requiredImageCount === 1 ? "인증 이미지" : "시작 이미지"}
          name="start_image"
          required
        />

        {policy.requiredImageCount === 2 ? (
          <FileInputField
            label="종료 이미지"
            name="end_image"
            required
          />
        ) : null}

        <label className="span-2">
          메모 (선택)
          <textarea name="notes" rows={3} />
        </label>

        <Button type="submit" disabled={isPending || !availableSession}>
          {isPending ? "등록 중..." : "인증 등록"}
        </Button>
      </form>

      {selectedMemberId && !availableSession ? (
        <p className="error">선택한 회원은 해당 주간의 1~5회차 인증이 모두 등록되어 있습니다.</p>
      ) : null}

      {!state.ok && state.message ? (
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
