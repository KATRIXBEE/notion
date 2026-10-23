"use client";

import React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { SketchBox } from "./SketchBox";
import { IconButton } from "./IconButton";

interface CalendarProps {
  seed?: number;
  year: number;
  month: number; // 0-based
  onMonthChange: (year: number, month: number) => void;
  /** Days that have a dot (pages created on that day) */
  markedDays?: number[];
  /** Clicking a day */
  onDayClick?: (day: number) => void;
  className?: string;
}

const DAYS_OF_WEEK = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function Calendar({
  seed = 1313,
  year,
  month,
  onMonthChange,
  markedDays = [],
  onDayClick,
  className = "",
}: CalendarProps) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };
  const next = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  // Build grid cells: null = empty padding
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <SketchBox seed={seed} className={`p-3 ${className}`}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <IconButton seed={seed + 1} size={28} onClick={prev} aria-label="Previous month">
          <CaretLeft size={14} weight="bold" />
        </IconButton>
        <span className="font-sketch text-sm font-bold text-ink">
          {MONTHS[month]} {year}
        </span>
        <IconButton seed={seed + 2} size={28} onClick={next} aria-label="Next month">
          <CaretRight size={14} weight="bold" />
        </IconButton>
      </div>

      {/* Day-of-week headers */}
      <div className="relative z-10 grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <span key={d} className="text-center font-sketch text-xs text-ink-soft py-0.5">
            {d}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="relative z-10 grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const isToday = day === todayDate;
          const isMarked = markedDays.includes(day);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={`relative flex flex-col items-center justify-center py-0.5 font-sketch text-xs cursor-pointer ${
                isToday ? "text-paper" : "text-ink"
              }`}
            >
              {/* Today = filled dark square */}
              {isToday && (
                <span className="absolute inset-0.5 bg-ink rounded-none" />
              )}
              <span className="relative z-10">{day}</span>
              {isMarked && !isToday && (
                <span className="relative z-10 w-1 h-1 rounded-full bg-ink-soft mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </SketchBox>
  );
}
