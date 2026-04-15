import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import { createMemberWithGoal } from "@/app/members/actions";
import { FormSelectField } from "@/components/form-select-field";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { Button } from "@/components/ui/button";
import { isSupabaseReady } from "@/lib/supabase-server";

export default async function NewMemberPage() {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <h2 className="title-with-icon">
            <UserPlus size={18} /> 회원 등록 및 목표 설정
          </h2>
          <Button variant="outline" className="inline-btn" render={<Link href="/members" />}>
            <ArrowLeft size={16} /> 목록
          </Button>
        </div>
      </section>

      <section className="panel">
        <form action={createMemberWithGoal} className="form-grid member-goal-inline">
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
            label="주간 목표 횟수"
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
          <label>
            목표 항목
            <input type="text" name="overall_goal_title" placeholder="예: 체지방량 감량" />
          </label>
          <label>
            목표 수치
            <input type="text" name="overall_goal_value" placeholder="예: -3kg" />
          </label>
          <label className="span-2">
            목표 메모
            <input type="text" name="overall_goal_note" placeholder="예: 8주 내 달성" />
          </label>
          <FormSelectField
            label="최종 목표 도달 여부"
            name="overall_goal_achieved"
            placeholder="미설정"
            options={[
              { value: "true", label: "도달" },
              { value: "false", label: "미도달" },
            ]}
            isClearable
          />
          <Button type="submit">회원 추가</Button>
        </form>
      </section>
    </div>
  );
}
