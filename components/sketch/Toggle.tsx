"use client";

import React from "react";
import { useRoughBox } from "./useRoughBox";

interface ToggleProps {
  seed?: number;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

/**
 * Pill toggle with OFF | ON text labels.
 * The active side is filled with ink; the pill border is rough.js.
 */
export function Toggle({ seed = 808, checked, onChange, className = "" }: ToggleProps) {
  // Two seeds for the two halves
  const offRef = useRoughBox({ seed, filled: !checked, strokeWidth: 1.5 });
  const onRef = useRoughBox({ seed: seed + 1, filled: checked, strokeWidth: 1.5 });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center cursor-pointer ${className}`}
    >
      {/* OFF side */}
      <span
        ref={offRef as React.Ref<HTMLSpanElement>}
        className="relative inline-flex items-center justify-center w-10 h-7"
      >
        <span
          className={`relative z-10 font-sketch text-xs font-bold ${
            !checked ? "text-paper" : "text-ink"
          }`}
        >
          OFF
        </span>
      </span>

      {/* ON side */}
      <span
        ref={onRef as React.Ref<HTMLSpanElement>}
        className="relative inline-flex items-center justify-center w-10 h-7"
      >
        <span
          className={`relative z-10 font-sketch text-xs font-bold ${
            checked ? "text-paper" : "text-ink"
          }`}
        >
          ON
        </span>
      </span>
    </button>
  );
}
