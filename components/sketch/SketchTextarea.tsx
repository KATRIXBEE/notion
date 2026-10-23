"use client";

import React from "react";
import { SketchBox } from "./SketchBox";

interface SketchTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  seed?: number;
  label?: string;
}

export function SketchTextarea({
  seed = 606,
  label,
  className = "",
  ...rest
}: SketchTextareaProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="font-sketch text-sm text-ink-soft">{label}</span>
      )}
      <SketchBox seed={seed}>
        <textarea
          className="relative z-10 px-3 py-2 font-sketch text-sm text-ink placeholder:text-ink-soft bg-transparent w-full focus:outline-none resize-none"
          rows={4}
          {...rest}
        />
      </SketchBox>
    </div>
  );
}
