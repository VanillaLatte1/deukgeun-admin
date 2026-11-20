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
          <div>
            <span className="page-eyebrow">Member Directory</span>
            <h2 className="title-with-icon">
              <UsersRound size={18} /> 회원 및 주간 목표 관리
            </h2>
            <p className="member-page-subcopy">총 {members.length}명의 기본 정보와 목표·정산 상태를 관리합니다.</p>
          </div>
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
        <div className="section-head table-section-head">
          <div>
            <h3>전체 회원</h3>
            <p className="weekly-exceptions-subcopy">행을 선택하면 회원 정보를 바로 수정할 수 있습니다.</p>
          </div>
          <span className="result-count">{members.length}명</span>
        </div>
        <MembersTable members={members} settlementPeriodLabel={settlementPeriodLabel} />
      </section>
    </>
  );
}
