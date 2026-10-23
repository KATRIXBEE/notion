"use client";

import React, { useRef, useEffect, useCallback } from "react";
import rough from "roughjs";

interface DialProps {
  seed?: number;
  value: number;
  min?: number;
  max?: number;
  onChange?: (v: number) => void;
  size?: number;
  label?: string;
  className?: string;
}

/** Circular dial knob — drawn with rough.js on a canvas */
export function Dial({
  seed = 1111,
  value,
  min = 0,
  max = 100,
  onChange,
  size = 80,
  label,
  className = "",
}: DialProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const ink = getComputedStyle(document.documentElement)
      .getPropertyValue("--ink")
      .trim() || "#3a2f30";

    const rc = rough.canvas(canvas);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;

    // Outer circle
    rc.circle(cx, cy, r * 2, {
      seed,
      roughness: 1,
      stroke: ink,
      strokeWidth: 2,
      fill: "none",
    });

    // Knob indicator line
    const pct = (value - min) / (max - min);
    const angle = Math.PI * 0.75 + pct * Math.PI * 1.5;
    const x2 = cx + Math.cos(angle) * (r - 6);
    const y2 = cy + Math.sin(angle) * (r - 6);

    rc.line(cx, cy, x2, y2, {
      seed: seed + 1,
      roughness: 0.5,
      stroke: ink,
      strokeWidth: 2.5,
    });

    // Center dot
    rc.circle(cx, cy, 8, {
      seed: seed + 2,
      roughness: 0.5,
      stroke: ink,
      fill: ink,
      fillStyle: "solid",
      strokeWidth: 1,
    });
  }, [seed, value, min, max, size]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      {label && <span className="font-sketch text-xs text-ink-soft">{label}</span>}
    </div>
  );
}
