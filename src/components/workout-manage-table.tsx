"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteWorkoutSession,
  updateWorkoutSession,
  type WorkoutActionState,
} from "@/app/workouts/actions";
import { FileInputField } from "@/components/file-input-field";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import type { WorkoutSession } from "@/lib/data";
import { statusLabel, type ProgressStatus } from "@/lib/progress";
import {
  getWorkoutPolicy,
  WORKOUT_TYPE_GENERAL,
  WORKOUT_TYPE_RUNNING,
} from "@/lib/workout-policy";

type WorkoutManageTableProps = {
  workouts: WorkoutSession[];
};

const initialActionState: WorkoutActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
};

export function WorkoutManageTable({ workouts }: WorkoutManageTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [showStartUploader, setShowStartUploader] = useState(false);
  const [showEndUploader, setShowEndUploader] = useState(false);
  const [editingExerciseType, setEditingExerciseType] = useState(WORKOUT_TYPE_GENERAL);

  const [updateState, updateAction, updatePending] = useActionState(
    updateWorkoutSession,
    initialActionState,
  );
  const [deleteState, deleteAction] = useActionState(deleteWorkoutSession, initialActionState);

  useEffect(() => {
    if (updateState.ok || deleteState.ok) {
      router.refresh();
    }
  }, [updateState.ok, deleteState.ok, router]);

  useEffect(() => {
    setShowStartUploader(false);
    setShowEndUploader(false);
  }, [editingId]);

  const editingWorkout = workouts.find((item) => item.id === editingId) ?? null;

  useEffect(() => {
    if (editingWorkout) {
      setEditingExerciseType(editingWorkout.exercise_type);
    }
  }, [editingWorkout]);

  const editingPolicy = useMemo(
    () => getWorkoutPolicy(editingExerciseType),
    [editingExerciseType],
  );

  return (
    <>
      <div className="table-scroll table-scroll-wide">
        <table className="table">
          <thead>
            <tr>
              <th>{"등록시각"}</th>
              <th>{"회원"}</th>
              <th>{"운동일"}</th>
              <th>{"회차"}</th>
              <th>{"종류"}</th>
              <th>{"시간(분)"}</th>
              <th>{"진행 상태"}</th>
              <th>{"시작 이미지"}</th>
              <th>{"종료 이미지"}</th>
              <th>{"관리"}</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((workout) => {
              const policy = getWorkoutPolicy(workout.exercise_type);
              const status: ProgressStatus =
                workout.duration_minutes >= policy.minimumValidMinutes ? "complete" : "in_progress";

              return (
                <tr key={workout.id}>
                  <td>{new Date(workout.created_at).toLocaleString("ko-KR")}</td>
                  <td>{workout.members?.name ?? "-"}</td>
                  <td>{workout.workout_date}</td>
                  <td>{workout.session_no}</td>
                  <td>{policy.label}</td>
                  <td>{workout.duration_minutes}</td>
                  <td>
                    <span className={`badge status-${status}`}>{statusLabel(status)}</span>
                  </td>
                  <td className="path-cell">{workout.start_image_path}</td>
                  <td className="path-cell">{workout.end_image_path ?? "-"}</td>
                  <td>
                    <div className="row-actions">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingId(workout.id)}
                      >
                        {"수정"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteTargetId(workout.id)}
                      >
                        {"삭제"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {updateState.message && !updateState.ok ? <p className="error">{updateState.message}</p> : null}
      {deleteState.message && !deleteState.ok ? <p className="error">{deleteState.message}</p> : null}

      <Modal
        open={Boolean(editingWorkout) && !updateState.ok}
        title={"인증 수정"}
        description={"운동 종류에 따라 시간 기준과 필요한 인증 이미지 수가 달라집니다."}
        onClose={() => setEditingId(null)}
        size="lg"
        showDefaultActions={false}
      >
        {editingWorkout ? (
          <form action={updateAction} className="form-grid edit-modal-grid">
            <input type="hidden" name="id" value={editingWorkout.id} />

            <label>
              {"운동 날짜"}
              <input
                type="date"
                name="workout_date"
                defaultValue={editingWorkout.workout_date}
                required
              />
            </label>

            <label>
              {"회차"}
              <select name="session_no" defaultValue={String(editingWorkout.session_no)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <label>
              {"운동 종류"}
              <select
                name="exercise_type"
                value={editingExerciseType}
                onChange={(event) =>
                  setEditingExerciseType(
                    event.target.value === WORKOUT_TYPE_RUNNING
                      ? WORKOUT_TYPE_RUNNING
                      : WORKOUT_TYPE_GENERAL,
                  )
                }
              >
                <option value={WORKOUT_TYPE_GENERAL}>{"일반 운동"}</option>
                <option value={WORKOUT_TYPE_RUNNING}>{"러닝"}</option>
              </select>
            </label>

            <label>
              {"운동 시간(분)"}
              <input
                type="number"
                name="duration_minutes"
                min={editingPolicy.minimumValidMinutes}
                defaultValue={editingWorkout.duration_minutes}
                required
              />
            </label>

            <label>
              {"메모 (선택)"}
              <textarea name="notes" rows={3} defaultValue={editingWorkout.notes ?? ""} />
            </label>

            <div className="edit-proof-preview span-2">
              <div className="edit-proof-card">
                <div className="edit-proof-head">
                  <strong>
                    {editingPolicy.requiredImageCount === 1
                      ? "인증 이미지(현재)"
                      : "시작 이미지(현재)"}
                  </strong>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStartUploader((prev) => !prev)}
                  >
                    {"변경"}
                  </Button>
                </div>
                {editingWorkout.start_image_url ? (
                  <img src={editingWorkout.start_image_url} alt="시작 인증 이미지" loading="lazy" />
                ) : (
                  <span className="muted">{"이미지를 불러올 수 없습니다."}</span>
                )}
                {showStartUploader ? (
                  <FileInputField
                    label={
                      editingPolicy.requiredImageCount === 1
                        ? "인증 이미지 업로드"
                        : "시작 이미지 업로드"
                    }
                    name="start_image"
                  />
                ) : null}
              </div>

              {editingPolicy.requiredImageCount === 2 ? (
                <div className="edit-proof-card">
                  <div className="edit-proof-head">
                    <strong>{"종료 이미지(현재)"}</strong>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEndUploader((prev) => !prev)}
                    >
                      {"변경"}
                    </Button>
                  </div>
                  {editingWorkout.end_image_url ? (
                    <img src={editingWorkout.end_image_url} alt="종료 인증 이미지" loading="lazy" />
                  ) : (
                    <span className="muted">{"이미지를 불러올 수 없습니다."}</span>
                  )}
                  {showEndUploader ? (
                    <FileInputField label="종료 이미지 업로드" name="end_image" />
                  ) : null}
                </div>
              ) : (
                <div className="edit-proof-card">
                  <div className="edit-proof-head">
                    <strong>{"러닝 안내"}</strong>
                  </div>
                  <span className="muted">
                    {"러닝은 사진 1장만 사용하고, 저장 시 기존 종료 이미지는 제거됩니다."}
                  </span>
                </div>
              )}
            </div>

            <p className="muted span-2">
              {
                "변경 버튼으로 새 이미지를 선택하지 않으면 기존 이미지가 유지됩니다. 러닝은 최소 30분부터 인정됩니다."
              }
            </p>

            <Button type="submit" disabled={updatePending}>
              {updatePending ? "수정 중..." : "수정"}
            </Button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteTargetId) && !deleteState.ok}
        title={"인증 삭제"}
        description={"정말 이 인증을 삭제할까요? 삭제 후 복구할 수 없습니다."}
        onClose={() => setDeleteTargetId(null)}
        confirmLabel={isDeleting ? "삭제 중..." : "삭제"}
        onConfirm={() => {
          if (!deleteTargetId || isDeleting) return;
          startDeleteTransition(async () => {
            const formData = new FormData();
            formData.set("id", deleteTargetId);
            await deleteAction(formData);
          });
        }}
      />
    </>
  );
}
