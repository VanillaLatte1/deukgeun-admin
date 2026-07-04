import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { notFound } from "next/navigation";

import { updateMemberWithGoalAction } from "@/app/members/actions";
import { MemberDetailForm } from "@/components/member-detail-form";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { Button } from "@/components/ui/button";
import { getFixedGoalByMemberId, getMemberById } from "@/lib/data";
import { getActiveSettlementPeriod } from "@/lib/settlement-period";
import { isSupabaseReady } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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
  const settlementPeriod = getActiveSettlementPeriod();
  const [member, goal] = await Promise.all([getMemberById(id), getFixedGoalByMemberId(id)]);

  if (!member) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <PencilLine size={18} /> 회원 정보 수정
            </h2>
            <p className="member-page-subcopy">
              {member.name} 회원의 목표 구조와 정산 정보를 보기 좋게 정리해서 수정합니다.
            </p>
          </div>
          <Button
            variant="outline"
            className="inline-btn"
            nativeButton={false}
            render={<Link href="/members" />}
          >
            <ArrowLeft size={16} /> 목록
          </Button>
        </div>
      </section>

      <section className="panel member-detail-panel">
        <MemberDetailForm
          action={updateMemberWithGoalAction}
          submitLabel="수정 저장"
          settlementPeriod={settlementPeriod}
          member={member}
          goal={goal}
        />
      </section>
    </div>
  );
}
