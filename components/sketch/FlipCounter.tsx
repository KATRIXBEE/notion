"use client";

import React from "react";
import { SketchBox } from "./SketchBox";

interface FlipCounterProps {
  seed?: number;
  value: number | string;
  caption?: string;
  /** How many digit cards to show (zero-pads left) */
  digits?: number;
  className?: string;
}

/**
 * Each digit in its own tall sketch card, colon separators between groups.
 * Matching the DAYS:HOURS:MINUTES counter in the reference image.
 */
export function FlipCounter({
  seed = 1515,
  value,
  caption,
  digits = 2,
  className = "",
}: FlipCounterProps) {
  const str = String(value).padStart(digits, "0");

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="flex items-center gap-1">
        {str.split("").map((ch, i) => (
          <SketchBox
            key={i}
            seed={seed + i}
            className="inline-flex items-center justify-center"
            style={{ width: 48, height: 64 }}
          >
            <span className="relative z-10 font-sketch text-3xl font-bold text-ink leading-none">
              {ch}
            </span>
          </SketchBox>
        ))}
      </div>
      {caption && (
        <span className="font-sketch text-xs uppercase tracking-widest text-ink-soft">
          {caption}
        </span>
      )}
    </div>
  );
}

interface FlipClockProps {
  seed?: number;
  groups: { value: number | string; digits?: number; caption?: string }[];
  className?: string;
}

/** Multiple FlipCounters with colon separators between groups */
export function FlipClock({ seed = 1600, groups, className = "" }: FlipClockProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {groups.map((g, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="font-sketch text-3xl font-bold text-ink mb-6 leading-none">
              :
            </span>
          )}
          <FlipCounter
            seed={seed + i * 10}
            value={g.value}
            digits={g.digits ?? 2}
            caption={g.caption}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
