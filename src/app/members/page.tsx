import { MembersManager } from "@/components/members-manager";
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

  const memberRows = members.map((member) => {
    const goal = goalMap.get(member.id);

    return {
      id: member.id,
      name: member.name,
      gender: member.gender,
      genderLabel: genderLabel(member.gender),
      targetSessions: goal?.target_sessions ?? 2,
      targetSessionsLabel: `${goal?.target_sessions ?? 0}회`,
      targetMinutes: goal?.target_minutes ?? 60,
      targetMinutesLabel: `${goal?.target_minutes ?? 0}분`,
      createdAtLabel: new Date(member.created_at).toLocaleDateString("ko-KR"),
    };
  });

  return (
    <div className="page-stack">
      <MembersManager members={memberRows} />
    </div>
  );
}
