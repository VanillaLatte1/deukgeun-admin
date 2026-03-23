import { type StylesConfig } from "react-select";

export type SelectOption = {
  value: string;
  label: string;
  isDisabled?: boolean;
};

export const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 10,
    borderColor: state.isFocused ? "#8dd6a8" : "#67b783",
    boxShadow: state.isFocused ? "0 0 0 2px #8dd6a8" : "none",
    backgroundColor: "#fff",
    ":hover": {
      borderColor: "#67b783",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 10px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#647469",
    fontWeight: 400,
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1d1c17",
    fontWeight: 400,
  }),
  menu: (base) => ({
    ...base,
    border: "1px solid #67b783",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(25, 32, 48, 0.14)",
  }),
  menuList: (base) => ({
    ...base,
    padding: 0,
    maxHeight: 260,
  }),
  option: (base, state) => ({
    ...base,
    fontWeight: 400,
    color: state.isDisabled ? "#97a39b" : "#1d1c17",
    backgroundColor: state.isSelected ? "#d7f0e0" : state.isFocused ? "#eef8f1" : "#fff",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#3e7e5a",
    paddingRight: 10,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

