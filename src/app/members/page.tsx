import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";

import { MembersTable } from "@/components/members-table";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { listFixedGoals, listMembers } from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

function genderLabel(gender: string | null) {
  if (gender === "M") return "남성";
  if (gender === "F") return "여성";
  return "-";
}

export default async function MembersPage() {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }

  const [members, goals] = await Promise.all([listMembers(), listFixedGoals()]);

  const goalMap = new Map(goals.map((goal) => [goal.member_id, goal]));

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <h2 className="title-with-icon">
            <UsersRound size={18} /> 회원 및 주간 목표 관리
          </h2>
          <Link href="/members/new" className="primary-btn inline-btn">
            <Plus size={16} /> 등록
          </Link>
        </div>
      </section>

      <section className="panel">
        <MembersTable
          members={members.map((member) => {
            const goal = goalMap.get(member.id);

            return {
              id: member.id,
              name: member.name,
              genderLabel: genderLabel(member.gender),
              targetSessionsLabel: `${goal?.target_sessions ?? 0}회`,
              targetMinutesLabel: `${goal?.target_minutes ?? 0}분`,
              createdAtLabel: new Date(member.created_at).toLocaleDateString("ko-KR"),
            };
          })}
        />
      </section>
    </div>
  );
}
