import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import { createMemberWithGoalAction } from "@/app/members/actions";
import { MemberDetailForm } from "@/components/member-detail-form";
import { SupabaseRequiredPanel } from "@/components/supabase-required-panel";
import { Button } from "@/components/ui/button";
import { getActiveSettlementPeriod } from "@/lib/settlement-period";
import { isSupabaseReady } from "@/lib/supabase-server";

export default async function NewMemberPage() {
  if (!isSupabaseReady()) {
    return <SupabaseRequiredPanel showEnvGuide={false} />;
  }
  const settlementPeriod = getActiveSettlementPeriod();

  return (
    <div className="page-stack">
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <div>
            <h2 className="title-with-icon">
              <UserPlus size={18} /> 회원 등록 및 목표 설정
            </h2>
            <p className="member-page-subcopy">
              새 회원의 기본 정보, 주간 목표, 최종 목표를 한 화면에서 차분하게 설정합니다.
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
          action={createMemberWithGoalAction}
          submitLabel="회원 추가"
          settlementPeriod={settlementPeriod}
        />
      </section>
    </div>
  );
}
