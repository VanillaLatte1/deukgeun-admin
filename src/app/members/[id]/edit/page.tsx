import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { notFound } from "next/navigation";

import { updateMemberWithGoal } from "@/app/members/actions";
import { FormSelectField } from "@/components/form-select-field";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { Button } from "@/components/ui/button";
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
          <Button variant="outline" className="inline-btn" render={<Link href="/members" />}>
            <ArrowLeft size={16} /> 목록
          </Button>
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
            label="주간 목표 횟수"
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
              defaultValue={goal?.target_minutes ?? 60}
              required
            />
          </label>
          <label>
            목표 항목
            <input
              type="text"
              name="overall_goal_title"
              defaultValue={member.overall_goal_title ?? ""}
              placeholder="예: 골격근량 증가"
            />
          </label>
          <label>
            목표 수치
            <input
              type="text"
              name="overall_goal_value"
              defaultValue={member.overall_goal_value ?? ""}
              placeholder="예: +2kg"
            />
          </label>
          <label className="span-2">
            목표 메모
            <input
              type="text"
              name="overall_goal_note"
              defaultValue={member.overall_goal_note ?? ""}
              placeholder="예: 6월 말까지 달성"
            />
          </label>
          <FormSelectField
            label="최종 목표 도달 여부"
            name="overall_goal_achieved"
            defaultValue={
              member.overall_goal_achieved === null
                ? ""
                : member.overall_goal_achieved
                  ? "true"
                  : "false"
            }
            placeholder="미설정"
            options={[
              { value: "true", label: "도달" },
              { value: "false", label: "미도달" },
            ]}
            isClearable
          />
          <Button type="submit">수정 저장</Button>
        </form>
      </section>
    </div>
  );
}
