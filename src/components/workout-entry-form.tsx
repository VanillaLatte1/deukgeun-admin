"use client";

import { useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { createWorkoutSession, type WorkoutActionState } from "@/app/workouts/actions";
import { FileInputField } from "@/components/file-input-field";
import { MemberSearchSelect } from "@/components/member-search-select";
import { Modal } from "@/components/modal";
import type { WorkoutSessionSlot } from "@/lib/data";

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
    if (state.ok) {
      setSelectedMemberId("");
      setSelectedWorkoutDate(defaultWorkoutDate);
      setSelectedSessionNo("1");
    }
  }, [defaultWorkoutDate, state.ok]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <form key={formKey} action={formAction} className="form-grid">
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
          운동 시간(분)
          <input
            type="number"
            name="duration_minutes"
            min={0}
            defaultValue={60}
            required
          />
        </label>
        <FileInputField label="시작 이미지" name="start_image" required />
        <FileInputField label="종료 이미지" name="end_image" required />
        <label className="span-2">
          메모 (선택)
          <textarea name="notes" rows={3} />
        </label>
        <button className="primary-btn" type="submit" disabled={isPending || !availableSession}>
          {isPending ? "저장 중..." : "인증 저장"}
        </button>
      </form>

      {selectedMemberId && !availableSession ? (
        <p className="error">선택한 회원은 해당 주간의 1~5회차가 모두 등록되어 있습니다.</p>
      ) : null}

      {!state.ok && state.message ? <p className="error">{state.message}</p> : null}

      <Modal
        open={showSuccessModal}
        title="저장 완료"
        description="운동 인증이 정상적으로 저장되었습니다."
        onClose={() => setDismissedAt(state.submittedAt)}
      />
    </>
  );
}
