"use client";

import { useMemo, useState } from "react";
import Select from "react-select";

import { selectStyles, type SelectOption } from "@/components/select-styles";

type MemberOption = {
  id: string;
  name: string;
  gender?: string | null;
};

type MemberSearchSelectProps = {
  members: MemberOption[];
  name?: string;
  label?: string;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
};

export function MemberSearchSelect({
  members,
  name = "member_id",
  label = "회원",
  selectedValue,
  onValueChange,
}: MemberSearchSelectProps) {
  const [internalSelected, setInternalSelected] = useState<SelectOption | null>(null);

  const options = useMemo<SelectOption[]>(
    () => members.map((member) => ({ value: member.id, label: member.name })),
    [members],
  );

  const selected = useMemo(() => {
    if (selectedValue !== undefined) {
      return options.find((option) => option.value === selectedValue) ?? null;
    }

    return internalSelected;
  }, [internalSelected, options, selectedValue]);

  return (
    <label>
      {label}
      <Select
        classNamePrefix="member-select"
        options={options}
        value={selected}
        onChange={(option) => {
          if (selectedValue === undefined) {
            setInternalSelected(option);
          }
          onValueChange?.(option?.value ?? "");
        }}
        placeholder="회원 검색"
        noOptionsMessage={() => "검색 결과 없음"}
        isClearable
        isSearchable
        styles={selectStyles}
      />
      <input type="hidden" name={name} value={selected?.value ?? ""} />
    </label>
  );
}
