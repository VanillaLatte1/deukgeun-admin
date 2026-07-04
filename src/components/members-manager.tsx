"use client";

import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";

import { MembersTable } from "@/components/members-table";
import { Button } from "@/components/ui/button";

type MemberRow = {
  id: string;
  name: string;
  genderLabel: string;
  finalGoalStatusLabel: string;
  settlementLabel: string;
  targetSessionsLabel: string;
  targetMinutesLabel: string;
  createdAtLabel: string;
};

type MembersManagerProps = {
  members: MemberRow[];
  settlementPeriodLabel: string;
};

export function MembersManager({ members, settlementPeriodLabel }: MembersManagerProps) {
  return (
    <>
      <section className="panel panel-highlight">
        <div className="section-head members-form-head">
          <h2 className="title-with-icon">
            <UsersRound size={18} /> 회원 및 주간 목표 관리
          </h2>
          <Button
            type="button"
            className="inline-btn"
            nativeButton={false}
            render={<Link href="/members/new" />}
          >
            <Plus size={16} /> 등록
          </Button>
        </div>
      </section>

      <section className="panel">
        <MembersTable members={members} settlementPeriodLabel={settlementPeriodLabel} />
      </section>
    </>
  );
}
