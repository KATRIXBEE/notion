"use client";

import React, { useState, useRef, useEffect } from "react";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { SketchBox } from "./SketchBox";

interface SketchSelectProps {
  seed?: number;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SketchSelect({
  seed = 505,
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
}: SketchSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <SketchBox seed={seed} className="inline-flex items-center cursor-pointer">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative z-10 flex items-center gap-2 px-3 py-2 font-sketch text-sm text-ink"
        >
          <span>{value || placeholder}</span>
          <span className="flex flex-col leading-none">
            <CaretUp size={10} weight="bold" />
            <CaretDown size={10} weight="bold" />
          </span>
        </button>
      </SketchBox>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-full">
          <SketchBox seed={seed + 1} className="flex flex-col">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`relative z-10 px-3 py-2 text-left font-sketch text-sm hover:bg-ink hover:text-paper transition-colors ${
                  opt === value ? "font-bold" : ""
                }`}
              >
                {opt}
              </button>
            ))}
          </SketchBox>
        </div>
      )}
    </div>
  );
}
