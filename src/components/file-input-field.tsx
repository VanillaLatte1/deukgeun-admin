"use client";

import { useId, useRef, useState } from "react";

type FileInputFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  onFileChange?: (file: File | null) => void;
};

export function FileInputField({
  label,
  name,
  required,
  onFileChange,
}: FileInputFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("선택된 파일 없음");
  const [isDragging, setIsDragging] = useState(false);
  const hasFile = fileName !== "선택된 파일 없음";

  const syncFile = (file: File | null) => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if (!file) {
      input.value = "";
      setFileName("선택된 파일 없음");
      onFileChange?.(null);
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    setFileName(file.name);
    onFileChange?.(file);
  };

  return (
    <label
      htmlFor={id}
      className={`file-field${isDragging ? " is-dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }

        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        syncFile(event.dataTransfer.files?.[0] ?? null);
      }}
    >
      {label}
      <input
        id={id}
        ref={inputRef}
        className="file-native"
        type="file"
        name={name}
        accept="image/*"
        required={required}
        onChange={(event) => {
          syncFile(event.target.files?.[0] ?? null);
        }}
      />
      <span className="file-control" aria-hidden="true">
        <span className={`file-name${hasFile ? " has-file" : ""}`}>{fileName}</span>
        <span className="file-title">이미지를 드래그해 놓거나 클릭해서 업로드</span>
      </span>
    </label>
  );
}
