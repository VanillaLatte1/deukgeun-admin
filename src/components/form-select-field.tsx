"use client";

import { useMemo, useState } from "react";
import Select from "react-select";

import { selectStyles, type SelectOption } from "@/components/select-styles";

type FormSelectFieldProps = {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
};

export function FormSelectField({
  label,
  name,
  options,
  defaultValue,
  placeholder = "선택",
  isSearchable = false,
  isClearable = false,
}: FormSelectFieldProps) {
  const defaultOption = useMemo(
    () => options.find((option) => option.value === defaultValue) ?? null,
    [defaultValue, options],
  );
  const [selected, setSelected] = useState<SelectOption | null>(defaultOption);

  return (
    <label>
      {label}
      <Select
        classNamePrefix="form-select"
        options={options}
        value={selected}
        onChange={(option) => setSelected(option)}
        placeholder={placeholder}
        noOptionsMessage={() => "검색 결과 없음"}
        isSearchable={isSearchable}
        isClearable={isClearable}
        styles={selectStyles}
      />
      <input type="hidden" name={name} value={selected?.value ?? ""} />
    </label>
  );
}
