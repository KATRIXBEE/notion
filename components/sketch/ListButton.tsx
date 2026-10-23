"use client";

import React from "react";
import { CaretRight } from "@phosphor-icons/react";
import { SketchBox } from "./SketchBox";

interface ListButtonProps {
  seed?: number;
  icon?: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Full-width button with leading icon and trailing chevron or badge.
 * Active state uses a dashed border (selected item style from spec).
 */
export function ListButton({
  seed = 1717,
  icon,
  label,
  badge,
  active = false,
  onClick,
  className = "",
}: ListButtonProps) {
  return (
    <SketchBox seed={seed} dashed={active} className={`w-full ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="relative z-10 flex items-center gap-3 w-full px-3 py-2.5 text-left font-sketch text-sm text-ink min-h-[40px]"
      >
        {icon && <span className="flex-shrink-0 text-ink">{icon}</span>}
        <span className="flex-1">{label}</span>
        {badge != null ? (
          <span className="font-sketch text-xs text-ink-soft">{badge}</span>
        ) : (
          <CaretRight size={14} weight="bold" className="text-ink-soft flex-shrink-0" />
        )}
      </button>
    </SketchBox>
  );
}
