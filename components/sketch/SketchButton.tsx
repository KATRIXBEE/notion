"use client";

import React from "react";
import { SketchBox } from "./SketchBox";

interface ButtonBase extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  seed?: number;
}

/** Outlined sketch button — light background, ink border */
export function SketchButton({
  seed = 101,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonBase) {
  return (
    <SketchBox
      as="button"
      type={type}
      seed={seed}
      className={`relative z-10 px-4 py-2 font-sketch text-ink text-sm leading-none cursor-pointer inline-flex items-center justify-center ${className}`}
      {...rest}
    >
      {children}
    </SketchBox>
  );
}

/** Dark-filled sketch button — ink fill, paper text (SEND / CHECKOUT / New page) */
export function SketchButtonDark({
  seed = 202,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonBase) {
  return (
    <SketchBox
      as="button"
      type={type}
      seed={seed}
      filled
      className={`relative z-10 px-4 py-2 font-sketch text-paper text-sm leading-none cursor-pointer inline-flex items-center justify-center ${className}`}
      {...rest}
    >
      {children}
    </SketchBox>
  );
}
