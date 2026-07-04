"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import type { MemberActionState } from "@/app/members/actions";
import { FormSelectField } from "@/components/form-select-field";
import { MemberGoalSettlementFields } from "@/components/member-goal-settlement-fields";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import type { SettlementPeriod } from "@/lib/settlement-period";

type MemberDetailFormProps = {
  action: (prevState: MemberActionState, formData: FormData) => Promise<MemberActionState>;
  submitLabel: string;
  settlementPeriod: SettlementPeriod;
  member?: {
    id: string;
    name: string;
    gender: string | null;
    overall_goal_title: string | null;
    overall_goal_value: string | null;
    overall_goal_achieved: boolean | null;
    penalty_amount: number;
    june_goal_proof_achieved: boolean;
    june_goal_proof_date: string | null;
    june_goal_proof_note: string | null;
  } | null;
  goal?: {
    target_sessions: number;
    target_minutes: number;
  } | null;
};

const initialMemberActionState: MemberActionState = {
  ok: false,
  message: "",
  submittedAt: 0,
};

export function MemberDetailForm({
  action,
  submitLabel,
  settlementPeriod,
  member,
  goal,
}: MemberDetailFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialMemberActionState);
  const [dismissedAt, setDismissedAt] = useState(0);
  const showFeedback = state.submittedAt > 0 && state.submittedAt !== dismissedAt;

  const closeFeedback = () => {
    setDismissedAt(state.submittedAt);

    if (state.ok) {
      router.push("/members");
    }
  };

  return (
    <>
      <form action={formAction} className="member-detail-form">
        {member ? <input type="hidden" name="member_id" value={member.id} /> : null}

        <div className="member-form-notice">
          <strong>운영자가 확인 가능한 정보만 입력합니다.</strong>
          <span>기본 정보, 주간 목표, 최종 목표 판정, 필요한 정산 정보만 순서대로 저장하세요.</span>
        </div>

        <section className="member-form-section">
          <div className="member-form-section-head">
            <div className="member-form-section-title-row">
              <h3>기본 정보</h3>
              <span className="member-form-step">1</span>
            </div>
            <p>회원명과 성별 같은 기본 프로필을 입력합니다.</p>
          </div>

          <div className="member-form-grid member-form-grid-basic">
            <label>
              이름
              <input type="text" name="name" required defaultValue={member?.name ?? ""} />
            </label>
            <FormSelectField
              label="성별"
              name="gender"
              defaultValue={member?.gender ?? undefined}
              placeholder="선택"
              options={[
                { value: "M", label: "남성" },
                { value: "F", label: "여성" },
              ]}
            />
          </div>
        </section>

        <section className="member-form-section">
          <div className="member-form-section-head">
            <div className="member-form-section-title-row">
              <h3>주간 목표</h3>
              <span className="member-form-step">2</span>
            </div>
            <p>운영 기준이 되는 주간 운동 횟수와 기본 운동 시간을 설정합니다.</p>
          </div>

          <div className="member-form-grid member-form-grid-weekly">
            <FormSelectField
              label="주간 목표 횟수"
              name="target_sessions"
              defaultValue={String(goal?.target_sessions ?? 2)}
              options={[
                { value: "1", label: "1회" },
                { value: "2", label: "2회" },
                { value: "3", label: "3회" },
                { value: "4", label: "4회" },
                { value: "5", label: "5회" },
              ]}
            />
            <label>
              기본 운동 시간(분)
              <input
                type="number"
                min={0}
                name="target_minutes"
                defaultValue={goal?.target_minutes ?? 60}
                required
              />
            </label>
          </div>
        </section>

        <MemberGoalSettlementFields settlementPeriod={settlementPeriod} member={member} />

        <div className="member-form-actions">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "저장 중..." : submitLabel}
          </Button>
        </div>
      </form>

      <Modal
        open={showFeedback}
        title={state.ok ? "저장했습니다" : "저장하지 못했습니다"}
        description={state.message || (state.ok ? "변경사항이 저장되었습니다." : "다시 시도해 주세요.")}
        onClose={closeFeedback}
        showDefaultActions={false}
      >
        <div className="modal-actions">
          <Button type="button" onClick={closeFeedback}>
            확인
          </Button>
        </div>
      </Modal>
    </>
  );
}
