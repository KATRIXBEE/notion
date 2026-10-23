"use client";

import React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { SketchBox } from "./SketchBox";
import { SketchSelect } from "./SketchSelect";

interface PaginationProps {
  seed?: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  pageSize?: number;
  pageSizeOptions?: string[];
  onPageSizeChange?: (s: number) => void;
  className?: string;
}

export function Pagination({
  seed = 1414,
  page,
  totalPages,
  onPageChange,
  pageSize = 10,
  pageSizeOptions = ["5", "10", "20", "50"],
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Prev arrow */}
      <SketchBox seed={seed} className="inline-flex">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="relative z-10 w-8 h-8 flex items-center justify-center text-ink disabled:opacity-30 cursor-pointer"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
      </SketchBox>

      {/* Page numbers */}
      {pages.map((p) => {
        const isActive = p === page;
        return (
          <SketchBox
            key={p}
            seed={seed + p}
            filled={isActive}
            className="inline-flex"
          >
            <button
              type="button"
              onClick={() => onPageChange(p)}
              className={`relative z-10 font-sketch text-sm cursor-pointer ${
                isActive
                  ? "text-paper w-9 h-9"
                  : "text-ink w-7 h-7"
              } flex items-center justify-center`}
            >
              {p}
            </button>
          </SketchBox>
        );
      })}

      {/* Next arrow */}
      <SketchBox seed={seed + 100} className="inline-flex">
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="relative z-10 w-8 h-8 flex items-center justify-center text-ink disabled:opacity-30 cursor-pointer"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </SketchBox>

      {/* Per-page select */}
      {onPageSizeChange && (
        <SketchSelect
          seed={seed + 200}
          options={pageSizeOptions}
          value={`${pageSize} per page`}
          onChange={(v) => onPageSizeChange(parseInt(v))}
        />
      )}
    </div>
  );
}
