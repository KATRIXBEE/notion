"use client";

import React from "react";
import { Plus, Minus } from "@phosphor-icons/react";
import { SketchBox } from "./SketchBox";

interface StepperProps {
  seed?: number;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  className?: string;
}

export function Stepper({
  seed = 707,
  value,
  min = 0,
  max = 99,
  onChange,
  className = "",
}: StepperProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <SketchBox seed={seed} className="inline-flex">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="relative z-10 w-8 h-8 flex items-center justify-center text-ink cursor-pointer"
          aria-label="Decrease"
        >
          <Minus size={14} weight="bold" />
        </button>
      </SketchBox>

      <SketchBox seed={seed + 1} className="inline-flex">
        <span className="relative z-10 w-10 h-8 flex items-center justify-center font-sketch text-sm text-ink">
          {value}
        </span>
      </SketchBox>

      <SketchBox seed={seed + 2} className="inline-flex">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="relative z-10 w-8 h-8 flex items-center justify-center text-ink cursor-pointer"
          aria-label="Increase"
        >
          <Plus size={14} weight="bold" />
        </button>
      </SketchBox>
    </div>
  );
}
