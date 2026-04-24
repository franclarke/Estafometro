"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 4;

export type EvidenceFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type EvidenceUploadProps = {
  files: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
  disabled?: boolean;
  className?: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return "Solo aceptamos PNG, JPG o WEBP.";
  }
  if (file.size > MAX_BYTES) {
    return `Cada imagen debe pesar menos de ${MAX_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

export function EvidenceUpload({
  files,
  onChange,
  disabled = false,
  className,
}: EvidenceUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    if (!list.length) return;

    const remainingSlots = Math.max(0, MAX_FILES - files.length);
    if (!remainingSlots) {
      setError(`Ya adjuntaste ${MAX_FILES} imágenes.`);
      return;
    }

    const slice = list.slice(0, remainingSlots);
    const accepted: EvidenceFile[] = [];
    let firstError: string | null = null;

    for (const file of slice) {
      const problem = validateFile(file);
      if (problem) {
        firstError ??= problem;
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (list.length > remainingSlots) {
      firstError ??= `Solo podés adjuntar hasta ${MAX_FILES} imágenes.`;
    }

    setError(firstError);
    if (accepted.length) onChange([...files, ...accepted]);
  }

  function removeFile(id: string) {
    const target = files.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(files.filter((item) => item.id !== id));
    setError(null);
  }

  return (
    <div
      className={cn("space-y-3", className)}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        setIsDragging(false);
        addFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors",
            "hover:border-[var(--brand)] hover:text-[var(--brand)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            isDragging && "border-[var(--brand)] bg-[color:color-mix(in_srgb,var(--brand)_8%,transparent)]",
          )}
        >
          <Paperclip aria-hidden="true" className="h-4 w-4" />
          <span>Adjuntar capturas</span>
        </button>
        <p className="text-xs leading-5 text-[var(--muted)]">
          Opcional · Hasta {MAX_FILES} · PNG, JPG o WEBP · Máx. 10 MB c/u
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Imágenes adjuntas">
          {files.map((item) => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-raised)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="h-24 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] leading-4 text-[var(--muted)]">
                <span className="truncate" title={item.file.name}>
                  {item.file.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatSize(item.file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(item.id)}
                aria-label={`Quitar ${item.file.name}`}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)]/80 text-white transition-opacity hover:bg-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
