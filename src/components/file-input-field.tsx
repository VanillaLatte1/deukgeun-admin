"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type FileInputFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  onFileChange?: (file: File | null) => void;
};

const EMPTY_FILE_TEXT = "선택된 파일 없음";

export function FileInputField({
  label,
  name,
  required,
  onFileChange,
}: FileInputFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState(EMPTY_FILE_TEXT);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasFile = fileName !== EMPTY_FILE_TEXT;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = () => {
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  };

  const syncFile = (file: File | null) => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if (!file) {
      input.value = "";
      setFileName(EMPTY_FILE_TEXT);
      clearPreview();
      onFileChange?.(null);
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    setFileName(file.name);
    clearPreview();
    setPreviewUrl(URL.createObjectURL(file));
    onFileChange?.(file);
  };

  return (
    <div
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
      <div className="file-label-row">
        <label htmlFor={id}>{label}</label>
        {hasFile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${label} 파일 제거`}
            onClick={() => syncFile(null)}
          >
            <X size={16} />
          </Button>
        ) : null}
      </div>

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

      <label htmlFor={id} className="file-control">
        {previewUrl ? (
          <img className="file-preview" src={previewUrl} alt={`${label} 미리보기`} />
        ) : (
          <span className="file-placeholder-icon" aria-hidden="true">
            <ImagePlus size={22} />
          </span>
        )}
        <span className={`file-name${hasFile ? " has-file" : ""}`}>{fileName}</span>
        <span className="file-title">이미지를 드래그하거나 클릭해서 업로드</span>
      </label>
    </div>
  );
}
