"use client";

import React, { useState, useRef, useEffect } from "react";
import { SketchBox } from "@/components/sketch";

const COMMON_EMOJIS = [
  "📄", "📝", "💡", "🎯", "🚀", "💻", "🎨", "📚",
  "☕", "🌟", "🔥", "📌", "📅", "🏷️", "🛠️", "📊",
  "✅", "🧠", "📦", "🍕", "🌱", "🔑", "🔍", "📈",
];

interface EmojiPickerProps {
  currentIcon: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ currentIcon, onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-12 h-12 flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-pointer"
        title="Change icon"
      >
        {currentIcon || "📄"}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-56">
          <SketchBox seed={45} className="p-2 bg-paper grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-ink/10 cursor-pointer rounded-none"
              >
                {emoji}
              </button>
            ))}
          </SketchBox>
        </div>
      )}
    </div>
  );
}
