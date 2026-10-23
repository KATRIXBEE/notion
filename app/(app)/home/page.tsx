"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, ArrowRight } from "@phosphor-icons/react";
import {
  SketchBox,
  SketchButtonDark,
  Calendar,
  FlipCounter,
} from "@/components/sketch";
import { useAuth } from "@/lib/context/AuthContext";
import { usePages } from "@/lib/context/PageContext";

interface StatsData {
  totalPages: number;
  todosDone: number;
  wordsWritten: number;
  markedDays: number[];
  recentPages: { pageId: string; title: string; icon: string; updatedAt: string }[];
}

export default function HomePage() {
  const { user } = useAuth();
  const { pages, createPage, setBreadcrumbs } = usePages();

  const [now] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [stats, setStats] = useState<StatsData>({
    totalPages: 0,
    todosDone: 0,
    wordsWritten: 0,
    markedDays: [],
    recentPages: [],
  });
  const [selectedDayPages, setSelectedDayPages] = useState<typeof pages | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: "Home" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // ignore
      }
    }
    loadStats();
  }, [pages]);

  const greeting = (() => {
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const userName = user?.email?.split("@")[0] || "there";

  const handleDayClick = (day: number) => {
    setSelectedDayNumber(day);
    // Find non-deleted pages created on this day
    const matching = pages.filter((p) => {
      if (p.isDeleted || !p.createdAt) return false;
      const d = new Date(p.createdAt);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === day
      );
    });
    setSelectedDayPages(matching);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sketch text-3xl sm:text-4xl font-bold text-ink">
            {greeting}, {userName}.
          </h1>
          <p className="font-sketch text-sm text-ink-soft mt-1">
            Welcome to your NotionLite workspace.
          </p>
        </div>

        <SketchButtonDark seed={80} onClick={() => createPage(null)}>
          <span className="flex items-center gap-1.5 py-0.5">
            <Plus size={16} weight="bold" />
            <span>Create new page</span>
          </span>
        </SketchButtonDark>
      </div>

      {/* 3 FlipCounters */}
      <div className="space-y-2">
        <h2 className="font-sketch text-xs uppercase tracking-widest text-ink-soft">
          Workspace Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SketchBox seed={81} className="p-4 flex flex-col items-center justify-center">
            <FlipCounter
              seed={82}
              value={stats.totalPages}
              digits={2}
              caption="Total Pages"
            />
          </SketchBox>

          <SketchBox seed={83} className="p-4 flex flex-col items-center justify-center">
            <FlipCounter
              seed={84}
              value={stats.todosDone}
              digits={2}
              caption="To-dos Done"
            />
          </SketchBox>

          <SketchBox seed={85} className="p-4 flex flex-col items-center justify-center">
            <FlipCounter
              seed={86}
              value={stats.wordsWritten}
              digits={4}
              caption="Words Written"
            />
          </SketchBox>
        </div>
      </div>

      {/* Main Grid: Calendar + Recent Pages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Calendar (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-sketch text-xs uppercase tracking-widest text-ink-soft">
            Page Activity
          </h2>
          <Calendar
            seed={87}
            year={currentYear}
            month={currentMonth}
            onMonthChange={(y, m) => {
              setCurrentYear(y);
              setCurrentMonth(m);
            }}
            markedDays={stats.markedDays}
            onDayClick={handleDayClick}
          />

          {selectedDayNumber !== null && (
            <SketchBox seed={88} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sketch text-xs font-bold text-ink">
                  Pages on Day {selectedDayNumber}:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDayNumber(null)}
                  className="font-sketch text-xs text-ink-soft hover:text-ink cursor-pointer"
                >
                  Clear
                </button>
              </div>
              {selectedDayPages && selectedDayPages.length > 0 ? (
                <div className="space-y-1">
                  {selectedDayPages.map((p) => (
                    <Link
                      key={p.pageId}
                      href={`/page/${p.pageId}`}
                      className="flex items-center gap-2 p-1.5 font-sketch text-xs text-ink hover:underline"
                    >
                      <span>{p.icon || "📄"}</span>
                      <span className="truncate">{p.title || "Untitled"}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="font-sketch text-xs text-ink-soft italic">
                  No pages created on this day.
                </p>
              )}
            </SketchBox>
          )}
        </div>

        {/* Recent Pages (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <h2 className="font-sketch text-xs uppercase tracking-widest text-ink-soft">
            Recent Pages
          </h2>

          {stats.recentPages && stats.recentPages.length > 0 ? (
            <div className="space-y-2">
              {stats.recentPages.map((p, idx) => (
                <Link
                  key={p.pageId}
                  href={`/page/${p.pageId}`}
                  className="block group"
                >
                  <SketchBox seed={90 + idx} className="p-3 hover:bg-ink/5 transition-colors">
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.icon || "📄"}</span>
                        <div>
                          <p className="font-sketch text-base font-bold text-ink group-hover:underline">
                            {p.title || "Untitled"}
                          </p>
                          <p className="font-sketch text-xs text-ink-soft">
                            Updated {new Date(p.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} weight="bold" className="text-ink-soft group-hover:text-ink" />
                    </div>
                  </SketchBox>
                </Link>
              ))}
            </div>
          ) : (
            <SketchBox seed={98} dashed className="p-8 flex flex-col items-center justify-center gap-2 text-center">
              <FileText size={36} weight="bold" className="relative z-10 text-ink-soft" />
              <p className="relative z-10 font-sketch text-sm text-ink-soft">
                No recent pages yet.
              </p>
              <button
                type="button"
                onClick={() => createPage(null)}
                className="relative z-10 font-sketch text-xs text-ink underline cursor-pointer mt-1"
              >
                Create your first page
              </button>
            </SketchBox>
          )}
        </div>
      </div>
    </div>
  );
}
