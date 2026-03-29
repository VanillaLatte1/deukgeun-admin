import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { notFound } from "next/navigation";

import { updateMemberWithGoal } from "@/app/members/actions";
import { FormSelectField } from "@/components/form-select-field";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { getFixedGoalByMemberId, getMemberById } from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

type EditMemberPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }

  const { id } = await params;
  const [member, goal] = await Promise.all([getMemberById(id), getFixedGoalByMemberId(id)]);

  if (!member) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <h2 className="title-with-icon">
            <PencilLine size={18} /> 회원 정보 수정
          </h2>
          <Link href="/members" className="ghost-btn inline-btn">
            <ArrowLeft size={16} /> 목록
          </Link>
        </div>
      </section>

      <section className="panel">
        <form action={updateMemberWithGoal} className="form-grid member-goal-inline">
          <input type="hidden" name="member_id" value={member.id} />
          <label>
            이름
            <input type="text" name="name" required defaultValue={member.name} />
          </label>
          <FormSelectField
            label="성별"
            name="gender"
            defaultValue={member.gender ?? undefined}
            placeholder="선택"
            options={[
              { value: "M", label: "남성" },
              { value: "F", label: "여성" },
            ]}
          />
          <FormSelectField
            label="목표 회차"
            name="target_sessions"
            defaultValue={String(goal?.target_sessions ?? 2)}
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
              defaultValue={goal?.target_minutes ?? 120}
              required
            />
          </label>
          <button className="primary-btn" type="submit">
            수정 저장
          </button>
        </form>
      </section>
    </div>
  );
}
