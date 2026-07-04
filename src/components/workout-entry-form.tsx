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
  const [sessionMode, setSessionMode] = useState<"auto" | "manual">("auto");
  const [exerciseType, setExerciseType] = useState(WORKOUT_TYPE_GENERAL);
  const [durationMinutes, setDurationMinutes] = useState(
    getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes,
  );

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const policy = useMemo(() => getWorkoutPolicy(exerciseType), [exerciseType]);
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
    sessionMode === "manual"
      ? selectedSessionNo
      : selectedSessionNo && !takenSessions.has(selectedSessionNo)
        ? selectedSessionNo
        : availableSession;
  const isExcusedMember = excusedMemberIds.includes(selectedMemberId);
  const hasAutoSession = Boolean(availableSession);
  const takenSessionText =
    takenSessions.size > 0
      ? [...takenSessions].sort((a, b) => Number(a) - Number(b)).map((value) => `${value}회차`).join(", ")
      : "등록된 회차 없음";
  const showSuccessModal =
    state.ok && state.submittedAt > 0 && state.submittedAt !== dismissedAt;
  const formKey = state.ok ? state.submittedAt : dismissedAt;

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
    setSessionMode("auto");
    setExerciseType(WORKOUT_TYPE_GENERAL);
    setDurationMinutes(getWorkoutPolicy(WORKOUT_TYPE_GENERAL).defaultDurationMinutes);
  };

  return (
    <>
      <form key={formKey} action={formAction} className="admin-detail-form">
        <input type="hidden" name="session_no" value={effectiveSessionNo} />

        <div className="admin-form-notice">
          <strong>운동 인증 등록 전에 회원, 날짜, 회차를 확인해 주세요.</strong>
          <span>
            일반 운동은 시작/종료 사진이 필요하고, 러닝은 인증 사진 1장만 등록하면 됩니다.
            날짜나 회차를 정정해야 할 때는 관리자 보정 모드를 켜세요.
          </span>
        </div>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <div className="admin-form-section-title-row">
              <h3>회원 및 운동 정보</h3>
              <span className="admin-form-step">1</span>
            </div>
            <p>회원, 날짜, 운동 종류, 운동 시간을 먼저 설정합니다.</p>
          </div>

          <div className="admin-form-grid admin-form-grid-workout-basic">
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

            <label>
              회차 입력 방식
              <select
                value={sessionMode}
                onChange={(event) => setSessionMode(event.target.value === "manual" ? "manual" : "auto")}
              >
                <option value="auto">자동 추천</option>
                <option value="manual">관리자 보정</option>
              </select>
            </label>
          </div>

          <div className="admin-session-panel">
            <div>
              <strong>등록된 회차</strong>
              <span>{takenSessionText}</span>
            </div>
            <div>
              <strong>{sessionMode === "manual" ? "보정 회차" : "추천 회차"}</strong>
              {sessionMode === "manual" ? (
                <select value={selectedSessionNo} onChange={(event) => setSelectedSessionNo(event.target.value)}>
                  {sessionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}회차{option.disabled ? " - 이미 등록됨" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{effectiveSessionNo ? `${effectiveSessionNo}회차` : "배정 가능한 회차 없음"}</span>
              )}
            </div>
          </div>

          {sessionMode === "manual" && takenSessions.has(selectedSessionNo) ? (
            <p className="error">
              선택한 회차는 이미 등록되어 있습니다. 저장 시 서버에서 중복을 막습니다.
            </p>
          ) : null}

          {isExcusedMember ? (
            <p className="error">
              이 회원은 이번 주 제외 처리 상태입니다. 기록은 저장할 수 있지만 진행 집계에서는 제외됩니다.
            </p>
          ) : null}

          {selectedMemberId && !hasAutoSession && sessionMode === "auto" ? (
            <p className="error">선택한 회원은 이번 주 1~5회차 인증이 모두 등록되어 있습니다.</p>
          ) : null}
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <div className="admin-form-section-title-row">
              <h3>인증 이미지</h3>
              <span className="admin-form-step">2</span>
            </div>
            <p>
              {policy.requiredImageCount === 1
                ? "러닝은 인증 사진 1장만 업로드합니다."
                : "일반 운동은 시작과 종료 이미지를 각각 업로드합니다."}
            </p>
          </div>

          <div className="admin-form-grid admin-form-grid-proof">
            <FileInputField
              label={policy.requiredImageCount === 1 ? "인증 이미지" : "시작 이미지"}
              name="start_image"
              required
            />

            {policy.requiredImageCount === 2 ? (
              <FileInputField label="종료 이미지" name="end_image" required />
            ) : (
              <div className="admin-form-helper-card">
                <strong>러닝 등록 안내</strong>
                <p>러닝은 종료 이미지 없이 등록되며, 최소 30분 이상 운동 시간 입력이 필요합니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="admin-form-section">
          <div className="admin-form-section-head">
            <div className="admin-form-section-title-row">
              <h3>추가 메모</h3>
              <span className="admin-form-step">3</span>
            </div>
            <p>정정 사유나 확인 근거가 있으면 간단히 남겨 주세요.</p>
          </div>

          <div className="admin-form-grid">
            <label className="admin-form-full">
              메모(선택)
              <textarea name="notes" rows={4} placeholder="예: 카톡 인증 기준 수기 보정" />
            </label>
          </div>
        </section>

        {!state.ok && state.message ? <p className="error">{state.message}</p> : null}

        <div className="admin-form-actions">
          <Button type="submit" size="lg" disabled={isPending || (!effectiveSessionNo && sessionMode === "auto")}>
            {isPending ? "등록 중..." : "인증 등록"}
          </Button>
        </div>
      </form>

      <Modal
        open={showSuccessModal}
        title="등록 완료"
        description={state.message || "운동 인증이 정상적으로 저장되었습니다."}
        onClose={handleSuccessClose}
      />
    </>
  );
}
