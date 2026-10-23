"use client";

import React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { SketchBox } from "./SketchBox";

interface SketchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  seed?: number;
  showIcon?: boolean;
  label?: string;
}

export function SketchInput({
  seed = 404,
  showIcon = false,
  label,
  className = "",
  ...rest
}: SketchInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="font-sketch text-sm text-ink-soft">{label}</span>
      )}
      <SketchBox seed={seed} className="inline-flex items-center">
        {showIcon && (
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="relative z-10 ml-3 text-ink-soft flex-shrink-0"
          />
        )}
        <input
          className={`relative z-10 py-2 font-sketch text-sm text-ink placeholder:text-ink-soft bg-transparent w-full focus:outline-none ${
            showIcon ? "pl-2 pr-3" : "px-3"
          }`}
          {...rest}
        />
      </SketchBox>
    </div>
  );
}
