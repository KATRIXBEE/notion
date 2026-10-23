"use client";

import React from "react";
import { SketchBox } from "./SketchBox";

interface SkeletonProps {
  seed?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/** Dashed sketch box placeholder for loading states */
export function Skeleton({ seed = 1818, width = "100%", height = 40, className = "" }: SkeletonProps) {
  return (
    <SketchBox
      seed={seed}
      dashed
      className={`animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}
