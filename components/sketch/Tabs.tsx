"use client";

import React from "react";
import { SketchBox } from "./SketchBox";

interface TabsProps {
  seed?: number;
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Tabs: active tab merges with the panel below (no bottom border on active tab).
 * Inactive tabs sit above with a full border.
 */
export function Tabs({
  seed = 909,
  tabs,
  active,
  onChange,
  children,
  className = "",
}: TabsProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tab row */}
      <div className="flex items-end">
        {tabs.map((tab, i) => {
          const isActive = tab === active;
          return (
            <SketchBox
              key={tab}
              seed={seed + i}
              className={`inline-flex cursor-pointer ${
                isActive ? "z-10 mb-[-2px]" : "opacity-60"
              }`}
            >
              <button
                type="button"
                onClick={() => onChange(tab)}
                className="relative z-10 px-4 py-2 font-sketch text-sm text-ink"
              >
                {tab}
              </button>
            </SketchBox>
          );
        })}
      </div>

      {/* Panel */}
      <SketchBox seed={seed + 100} className="p-4">
        {children}
      </SketchBox>
    </div>
  );
}
