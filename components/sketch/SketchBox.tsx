"use client";

import React from "react";
import { useRoughBox } from "./useRoughBox";

export interface SketchBoxProps extends React.HTMLAttributes<HTMLElement> {
  seed?: number;
  dashed?: boolean;
  filled?: boolean;
  strokeWidth?: number;
  padding?: number;
  as?: React.ElementType;
  type?: "button" | "submit" | "reset" | string;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * Base container with a rough.js wobbly border.
 * All other sketch components are built on top of this.
 */
export function SketchBox({
  seed = 42,
  dashed = false,
  filled = false,
  strokeWidth = 2,
  padding = 3,
  as: Tag = "div",
  className = "",
  style,
  children,
  ...rest
}: SketchBoxProps) {
  const ref = useRoughBox({ seed, dashed, filled, strokeWidth, padding });
  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={`relative ${className}`}
      style={{ position: "relative", ...style }}
      {...rest}
    >
      {children}
    </Component>
  );
}
