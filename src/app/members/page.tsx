import { MembersManager } from "@/components/members-manager";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { listFixedGoals, listMembers } from "@/lib/data";
import { getActiveSettlementPeriod } from "@/lib/settlement-period";
import { isSupabaseReady } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function genderLabel(gender: string | null) {
  if (gender === "M") return "남성";
  if (gender === "F") return "여성";
  return "-";
}

function finalGoalStatusLabel(member: {
  overall_goal_achieved: boolean | null;
}) {
  if (member.overall_goal_achieved === null) {
    return "미달성";
  }

  return member.overall_goal_achieved ? "달성" : "미달성";
}

function settlementLabel(member: {
  overall_goal_achieved: boolean | null;
  penalty_amount: number;
  june_goal_proof_achieved: boolean;
  june_goal_proof_date: string | null;
}) {
  const amount = `${member.penalty_amount.toLocaleString("ko-KR")}원`;

  if (member.overall_goal_achieved) {
    return `${amount} / 벌금 없음`;
  }

  if (member.june_goal_proof_achieved && member.june_goal_proof_date) {
    return `${amount} / 50%`;
  }

  return `${amount} / 100%`;
}

export default async function MembersPage() {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }

  const settlementPeriod = getActiveSettlementPeriod();
  const [members, goals] = await Promise.all([listMembers(), listFixedGoals()]);
  const goalMap = new Map(goals.map((goal) => [goal.member_id, goal]));

  const memberRows = members.map((member) => {
    const goal = goalMap.get(member.id);

    return {
      id: member.id,
      name: member.name,
      genderLabel: genderLabel(member.gender),
      finalGoalStatusLabel: finalGoalStatusLabel(member),
      settlementLabel: settlementLabel(member),
      targetSessionsLabel: `${goal?.target_sessions ?? 0}회`,
      targetMinutesLabel: `${goal?.target_minutes ?? 0}분`,
      createdAtLabel: new Date(member.created_at).toLocaleDateString("ko-KR"),
    };
  });

  return (
    <div className="page-stack">
      <MembersManager
        members={memberRows}
        settlementPeriodLabel={settlementPeriod.shortLabel}
      />
    </div>
  );
}
