"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type MemberRow = {
  id: string;
  name: string;
  genderLabel: string;
  overallGoalLabel: string;
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
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>이름</th>
            <th>성별</th>
            <th>전체 목표</th>
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
              onClick={() =>
                onSelectMember ? onSelectMember(member.id) : router.push(`/members/${member.id}/edit`)
              }
            >
              <td>{member.name}</td>
              <td>{member.genderLabel}</td>
              <td>{member.overallGoalLabel}</td>
              <td>{member.targetSessionsLabel}</td>
              <td>{member.targetMinutesLabel}</td>
              <td>{member.createdAtLabel}</td>
              <td onClick={(event) => event.stopPropagation()}>
                <div className="row-actions">
                  <Link href={`/penalty-documents?member=${member.id}`} className="sort-chip">
                    문서 출력
                  </Link>
                  <button
                    type="button"
                    className="sort-chip"
                    onClick={() =>
                      onSelectMember
                        ? onSelectMember(member.id)
                        : router.push(`/members/${member.id}/edit`)
                    }
                  >
                    수정
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
