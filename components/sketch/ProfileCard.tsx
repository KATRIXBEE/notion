"use client";

import React from "react";
import { useRoughBox } from "./useRoughBox";
import { SketchBox } from "./SketchBox";

interface ProfileCardProps {
  seed?: number;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  /** Initials fallback */
  initials?: string;
  className?: string;
}

/** Circular sketch avatar + name + subtitle line */
export function ProfileCard({
  seed = 1616,
  name,
  subtitle,
  avatarUrl,
  initials,
  className = "",
}: ProfileCardProps) {
  // The circle border uses a rough.js ellipse drawn on canvas
  const circleRef = useRoughBox({ seed, strokeWidth: 2, roughness: 1, bowing: 0.5 });

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Circular avatar */}
      <div
        ref={circleRef as React.Ref<HTMLDivElement>}
        className="relative overflow-hidden flex items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: "50%" }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="relative z-10 w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="relative z-10 font-sketch text-lg font-bold text-ink">
            {initials ?? name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <span className="font-sketch text-sm font-bold text-ink">{name}</span>
      {subtitle && (
        <span className="font-sketch text-xs text-ink-soft">{subtitle}</span>
      )}
    </div>
  );
}
