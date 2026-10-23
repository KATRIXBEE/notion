"use client";

import { useEffect, useRef, useCallback } from "react";
import rough from "roughjs";

export interface RoughBoxOptions {
  /** Stable numeric seed — derive from component identity, not Math.random() */
  seed: number;
  /** Draw with dashed strokes (empty states, selected items) */
  dashed?: boolean;
  /** Fill with ink (primary dark buttons) */
  filled?: boolean;
  /** Roughness 0–2, default 1 */
  roughness?: number;
  /** Bowing 0–2, default 1 */
  bowing?: number;
  /** Stroke width, default 2 */
  strokeWidth?: number;
  /** Padding inside the SVG so the strokes aren't clipped */
  padding?: number;
}

/**
 * Draws a rough.js rectangle SVG that exactly fills its container element.
 * The SVG is absolutely positioned as an inert overlay (pointer-events: none).
 * A ResizeObserver keeps it in sync with the container.
 */
export function useRoughBox(options: RoughBoxOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const {
    seed,
    dashed = false,
    filled = false,
    roughness = 1,
    bowing = 1,
    strokeWidth = 2,
    padding = 3,
  } = options;

  const draw = useCallback(
    (width: number, height: number) => {
      const svg = svgRef.current;
      if (!svg || width < 1 || height < 1) return;

      // Clear previous drawings
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const rc = rough.svg(svg);

      const x = padding;
      const y = padding;
      const w = width - padding * 2;
      const h = height - padding * 2;

      const strokeColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--ink")
        .trim() || "#3a2f30";

      const node = rc.rectangle(x, y, w, h, {
        seed,
        roughness,
        bowing,
        stroke: strokeColor,
        strokeWidth,
        fill: filled ? strokeColor : "none",
        fillStyle: filled ? "solid" : "none",
        strokeLineDash: dashed ? [8, 6] : [],
      });

      svg.appendChild(node);
    },
    [seed, dashed, filled, roughness, bowing, strokeWidth, padding]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create and inject SVG overlay
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;";
    container.appendChild(svg);
    svgRef.current = svg;

    // Initial draw
    const { width, height } = container.getBoundingClientRect();
    draw(width, height);

    // Keep in sync on resize
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        draw(width, height);
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (svg.parentNode) svg.parentNode.removeChild(svg);
    };
  }, [draw]);

  // Re-draw when options change (dark mode token swap)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    draw(width, height);
  }, [draw]);

  return containerRef;
}
