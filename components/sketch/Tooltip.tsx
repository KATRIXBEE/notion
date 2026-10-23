"use client";

import React, { useState } from "react";
import { SketchBox } from "./SketchBox";

interface TooltipProps {
  seed?: number;
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  seed = 1212,
  content,
  children,
  side = "top",
  className = "",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div className={`absolute z-50 pointer-events-none ${positionClass}`}>
          <SketchBox seed={seed} filled className="px-2 py-1 whitespace-nowrap">
            <span className="relative z-10 font-sketch text-xs text-paper">
              {content}
            </span>
          </SketchBox>
        </div>
      )}
    </div>
  );
}
