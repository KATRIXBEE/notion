"use client";

import React from "react";

interface ProgressDotsProps {
  seed?: number;
  total: number;
  active: number;
  className?: string;
}

export function ProgressDots({ total, active, className = "" }: ProgressDotsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`inline-block rounded-full transition-all ${
            i === active
              ? "w-3 h-3 bg-ink"
              : "w-2 h-2 bg-ink-soft"
          }`}
        />
      ))}
    </div>
  );
}
