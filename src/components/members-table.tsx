"use client";

import { useRouter } from "next/navigation";

type MemberRow = {
  id: string;
  name: string;
  genderLabel: string;
  targetSessionsLabel: string;
  targetMinutesLabel: string;
  createdAtLabel: string;
};

type MembersTableProps = {
  members: MemberRow[];
  onSelectMember?: (memberId: string) => void;
};

export function MembersTable({ members, onSelectMember }: MembersTableProps) {
  const router = useRouter();

  return (
    <table className="table">
      <thead>
        <tr>
          <th>이름</th>
          <th>성별</th>
          <th>목표 회차</th>
          <th>기본 운동 시간(분)</th>
          <th>등록일</th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr
            key={member.id}
            className="clickable-row"
            onClick={() =>
              onSelectMember ? onSelectMember(member.id) : router.push(`/members/${member.id}/edit`)
            }
          >
            <td>{member.name}</td>
            <td>{member.genderLabel}</td>
            <td>{member.targetSessionsLabel}</td>
            <td>{member.targetMinutesLabel}</td>
            <td>{member.createdAtLabel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
