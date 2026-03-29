"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createMemberWithGoalAction,
  type MemberActionState,
  updateMemberWithGoalAction,
} from "@/app/members/actions";
import { FormSelectField } from "@/components/form-select-field";
import { MembersTable } from "@/components/members-table";
import { Modal } from "@/components/modal";

type MemberRow = {
  id: string;
  name: string;
  gender: string | null;
  genderLabel: string;
  targetSessions: number;
  targetSessionsLabel: string;
  targetMinutes: number;
  targetMinutesLabel: string;
  createdAtLabel: string;
};

type MembersManagerProps = {
  members: MemberRow[];
};

const initialActionState: MemberActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
};

export function MembersManager({ members }: MembersManagerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dismissedAt, setDismissedAt] = useState(0);

  const [createState, createAction, createPending] = useActionState(
    createMemberWithGoalAction,
    initialActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateMemberWithGoalAction,
    initialActionState,
  );

  const editingMember = useMemo(
    () => members.find((member) => member.id === editingId) ?? null,
    [editingId, members],
  );

  const latestSuccessState = updateState.ok
    ? updateState
    : createState.ok
      ? createState
      : null;
  const showSuccessModal = Boolean(
    latestSuccessState &&
      latestSuccessState.submittedAt > 0 &&
      latestSuccessState.submittedAt !== dismissedAt,
  );

  useEffect(() => {
    if (createState.ok) {
      setCreateOpen(false);
      router.refresh();
    }
  }, [createState.ok, router]);

  useEffect(() => {
    if (updateState.ok) {
      setEditingId(null);
      router.refresh();
    }
  }, [updateState.ok, router]);

  return (
    <>
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <h2 className="title-with-icon">회원 및 주간 목표 관리</h2>
          <button type="button" className="primary-btn inline-btn" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> 등록
          </button>
        </div>
      </section>

      <section className="panel">
        <MembersTable members={members} onSelectMember={setEditingId} />
      </section>

      <Modal
        open={createOpen}
        title="회원 등록"
        description="회원 정보와 기본 운동 기준을 한 번에 등록합니다."
        onClose={() => setCreateOpen(false)}
        size="lg"
        showDefaultActions={false}
      >
        <form
          key={createState.ok ? createState.submittedAt : 0}
          action={createAction}
          className="form-grid member-goal-inline"
        >
          <label>
            이름
            <input type="text" name="name" required />
          </label>
          <FormSelectField
            label="성별"
            name="gender"
            placeholder="선택"
            options={[
              { value: "M", label: "남성" },
              { value: "F", label: "여성" },
            ]}
          />
          <FormSelectField
            label="목표 회차"
            name="target_sessions"
            defaultValue="2"
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ]}
          />
          <label>
            기본 운동 시간(분)
            <input type="number" min={0} name="target_minutes" defaultValue={60} required />
          </label>
          {createState.message && !createState.ok ? (
            <p className="error span-4">{createState.message}</p>
          ) : null}
          <button className="primary-btn" type="submit" disabled={createPending}>
            {createPending ? "등록 중..." : "등록"}
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingMember)}
        title="회원 정보 수정"
        description="이름, 성별, 목표 회차와 기본 운동 시간을 수정할 수 있습니다."
        onClose={() => setEditingId(null)}
        size="lg"
        showDefaultActions={false}
      >
        {editingMember ? (
          <form
            key={`${editingMember.id}-${updateState.ok ? updateState.submittedAt : "edit"}`}
            action={updateAction}
            className="form-grid member-goal-inline"
          >
            <input type="hidden" name="member_id" value={editingMember.id} />
            <label>
              이름
              <input type="text" name="name" required defaultValue={editingMember.name} />
            </label>
            <FormSelectField
              label="성별"
              name="gender"
              defaultValue={editingMember.gender ?? undefined}
              placeholder="선택"
              options={[
                { value: "M", label: "남성" },
                { value: "F", label: "여성" },
              ]}
            />
            <FormSelectField
              label="목표 회차"
              name="target_sessions"
              defaultValue={String(editingMember.targetSessions)}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
              ]}
            />
            <label>
              기본 운동 시간(분)
              <input
                type="number"
                min={0}
                name="target_minutes"
                defaultValue={editingMember.targetMinutes}
                required
              />
            </label>
            {updateState.message && !updateState.ok ? (
              <p className="error span-4">{updateState.message}</p>
            ) : null}
            <button className="primary-btn" type="submit" disabled={updatePending}>
              {updatePending ? "저장 중..." : "저장"}
            </button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={showSuccessModal}
        title="저장 완료"
        description={latestSuccessState?.message ?? "저장이 완료되었습니다."}
        onClose={() => setDismissedAt(latestSuccessState?.submittedAt ?? 0)}
        showDefaultActions={false}
      >
        <div className="modal-actions">
          <button
            className="modal-btn modal-btn-primary"
            type="button"
            onClick={() => setDismissedAt(latestSuccessState?.submittedAt ?? 0)}
          >
            확인
          </button>
        </div>
      </Modal>
    </>
  );
}
