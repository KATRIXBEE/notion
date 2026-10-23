"use client";

import React from "react";
import { SketchBox } from "./SketchBox";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  seed?: number;
  size?: number;
}

/** Small sketch square button for icons (sidebar collapse, settings, etc.) */
export function IconButton({
  seed = 303,
  size = 36,
  className = "",
  type = "button",
  children,
  style,
  ...rest
}: IconButtonProps) {
  return (
    <SketchBox
      as="button"
      type={type}
      seed={seed}
      className={`relative z-10 inline-flex items-center justify-center flex-shrink-0 cursor-pointer text-ink p-0 ${className}`}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {children}
    </SketchBox>
  );
}
