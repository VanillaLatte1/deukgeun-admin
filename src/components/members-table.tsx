"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

type MembersTableProps = {
  members: MemberRow[];
  settlementPeriodLabel: string;
};

export function MembersTable({ members, settlementPeriodLabel }: MembersTableProps) {
  const router = useRouter();

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>이름</th>
            <th>성별</th>
            <th>최종 목표</th>
            <th>{settlementPeriodLabel} 정산</th>
            <th>주간 목표 횟수</th>
            <th>기본 운동 시간(분)</th>
            <th>등록일</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="clickable-row"
              onClick={() => router.push(`/members/${member.id}/edit`)}
            >
              <td>{member.name}</td>
              <td>{member.genderLabel}</td>
              <td>{member.finalGoalStatusLabel}</td>
              <td>{member.settlementLabel}</td>
              <td>{member.targetSessionsLabel}</td>
              <td>{member.targetMinutesLabel}</td>
              <td>{member.createdAtLabel}</td>
              <td onClick={(event) => event.stopPropagation()}>
                <div className="row-actions">
                  <Button
                    variant="outline"
                    className="table-action-button"
                    nativeButton={false}
                    render={<Link href={`/penalty-documents?member=${member.id}`} />}
                  >
                    문서 출력
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
