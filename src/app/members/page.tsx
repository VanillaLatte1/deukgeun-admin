import { MembersManager } from "@/components/members-manager";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { listFixedGoals, listMembers } from "@/lib/data";
import { isSupabaseReady } from "@/lib/supabase-server";

function genderLabel(gender: string | null) {
  if (gender === "M") return "남성";
  if (gender === "F") return "여성";
  return "-";
}

function overallGoalLabel(member: {
  overall_goal_title: string | null;
  overall_goal_value: string | null;
  overall_goal_note: string | null;
  overall_goal_achieved: boolean | null;
}) {
  const parts = [member.overall_goal_title, member.overall_goal_value].filter(Boolean);
  const base = parts.join(" / ");
  const status =
    member.overall_goal_achieved === null
      ? null
      : member.overall_goal_achieved
        ? "도달"
        : "미도달";

  const noteParts = [member.overall_goal_note, status].filter(Boolean);

  if (base && noteParts.length > 0) {
    return `${base} (${noteParts.join(" / ")})`;
  }

  return base || noteParts.join(" / ") || "-";
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
      overallGoalTitle: member.overall_goal_title,
      overallGoalValue: member.overall_goal_value,
      overallGoalNote: member.overall_goal_note,
      overallGoalAchieved: member.overall_goal_achieved,
      overallGoalLabel: overallGoalLabel(member),
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
