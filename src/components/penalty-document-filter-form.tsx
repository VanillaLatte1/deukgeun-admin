"use client";

import { PrintButton } from "@/components/print-button";

type HalfYearKey = "1" | "2";

type PenaltyDocumentFilterFormProps = {
  years: number[];
  selectedYear: number;
  selectedHalf: HalfYearKey;
  weekStarts: string[];
  selectedWeekStart: string;
  members: Array<{
    id: string;
    name: string;
  }>;
  selectedMemberId: string;
  selectedAccount: string;
};

export function PenaltyDocumentFilterForm({
  years,
  selectedYear,
  selectedHalf,
  weekStarts,
  selectedWeekStart,
  members,
  selectedMemberId,
  selectedAccount,
}: PenaltyDocumentFilterFormProps) {
  const submitOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form method="get" className="form-grid penalty-filter-form">
      <label>
        회원 선택
        <select name="member" defaultValue={selectedMemberId} onChange={submitOnChange}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        기준 연도
        <select name="year" defaultValue={String(selectedYear)} onChange={submitOnChange}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
      </label>

      <label>
        반기
        <select name="half" defaultValue={selectedHalf} onChange={submitOnChange}>
          <option value="1">상반기</option>
          <option value="2">하반기</option>
        </select>
      </label>

      <label>
        기준 주차
        <select name="weekStart" defaultValue={selectedWeekStart} onChange={submitOnChange}>
          {weekStarts.map((weekStart) => (
            <option key={weekStart} value={weekStart}>
              {weekStart}
            </option>
          ))}
        </select>
      </label>

      <label className="span-3 penalty-account-field">
        입금 계좌
        <input type="text" name="account" value={selectedAccount} readOnly />
      </label>

      <div className="penalty-filter-actions">
        <PrintButton />
      </div>
    </form>
  );
}
