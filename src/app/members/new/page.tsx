import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import { createMemberWithGoal } from "@/app/members/actions";
import { FormSelectField } from "@/components/form-select-field";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
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
          <Link href="/members" className="ghost-btn inline-btn">
            <ArrowLeft size={16} /> 목록
          </Link>
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
            목표 시간(분)
            <input
              type="number"
              min={0}
              name="target_minutes"
              defaultValue={120}
              required
            />
          </label>
          <button className="primary-btn" type="submit">
            회원 추가
          </button>
        </form>
      </section>
    </div>
  );
}
