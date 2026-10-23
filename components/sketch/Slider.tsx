"use client";

import React, { useRef, useCallback } from "react";
import { SketchBox } from "./SketchBox";

interface SliderProps {
  seed?: number;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  orientation?: "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export function Slider({
  seed = 1010,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  orientation = "horizontal",
  label,
  className = "",
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      let ratio: number;
      if (orientation === "horizontal") {
        ratio = (e.clientX - rect.left) / rect.width;
      } else {
        ratio = 1 - (e.clientY - rect.top) / rect.height;
      }
      ratio = Math.max(0, Math.min(1, ratio));
      const newVal = Math.round((min + ratio * (max - min)) / step) * step;
      onChange(newVal);
    },
    [min, max, step, orientation, onChange]
  );

  if (orientation === "vertical") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        {label && <span className="font-sketch text-xs text-ink-soft">{label}</span>}
        <div
          ref={trackRef}
          onClick={handleClick}
          className="relative cursor-pointer"
          style={{ width: 20, height: 100 }}
        >
          {/* Track */}
          <SketchBox seed={seed} className="absolute inset-x-1/2 -translate-x-1/2 h-full" style={{ width: 4 }} />
          {/* Knob */}
          <SketchBox
            seed={seed + 1}
            className="absolute left-0 right-0 mx-auto"
            style={{
              width: 20,
              height: 20,
              bottom: `calc(${pct}% - 10px)`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="font-sketch text-xs text-ink-soft">{label}</span>}
      <div
        ref={trackRef}
        onClick={handleClick}
        className="relative cursor-pointer"
        style={{ height: 20, width: "100%" }}
      >
        {/* Track */}
        <SketchBox
          seed={seed}
          className="absolute top-1/2 -translate-y-1/2 w-full"
          style={{ height: 4 }}
        />
        {/* Knob */}
        <SketchBox
          seed={seed + 1}
          className="absolute top-1/2 -translate-y-1/2"
          style={{ width: 20, height: 20, left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}
