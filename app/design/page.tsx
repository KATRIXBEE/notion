"use client";

import React, { useState } from "react";
import {
  House, Star, Trash, MagnifyingGlass, Tray, FolderSimple, FileText,
  GearSix, Bell, Chat, Heart, Camera, Tag,
} from "@phosphor-icons/react";
import {
  SketchBox,
  SketchButton,
  SketchButtonDark,
  IconButton,
  SketchInput,
  SketchSelect,
  SketchTextarea,
  Stepper,
  Toggle,
  Tabs,
  Slider,
  Dial,
  Tooltip,
  Calendar,
  Pagination,
  FlipCounter,
  FlipClock,
  ProfileCard,
  ListButton,
  ProgressDots,
  Skeleton,
} from "@/components/sketch";

export default function DesignPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tab, setTab] = useState("Tab 1");
  const [toggleOn, setToggleOn] = useState(false);
  const [sliderH, setSliderH] = useState(50);
  const [sliderV, setSliderV] = useState(50);
  const [stepper, setStepper] = useState(2);
  const [selectVal, setSelectVal] = useState("Category");
  const [dark, setDark] = useState(false);

  // Toggle dark mode on html
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-sketch text-3xl font-bold text-ink">
            NotionLite — Design System
          </h1>
          <div className="flex items-center gap-2">
            <span className="font-sketch text-sm text-ink-soft">Dark mode</span>
            <Toggle seed={1} checked={dark} onChange={setDark} />
          </div>
        </div>

        {/* ── Row 1: ProfileCard + Calendar + FlipClock ── */}
        <div className="grid grid-cols-3 gap-8">
          {/* ProfileCard */}
          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">ProfileCard</p>
            <SketchBox seed={10} className="p-6 flex justify-center">
              <ProfileCard
                seed={11}
                name="James Mellnick"
                subtitle="1,327 followers"
              />
            </SketchBox>
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Calendar</p>
            <Calendar
              seed={20}
              year={year}
              month={month}
              onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
              markedDays={[3, 7, 14, 21]}
              onDayClick={(d) => alert(`Day ${d}`)}
            />
          </div>

          {/* FlipClock */}
          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">FlipClock</p>
            <SketchBox seed={30} className="p-4 flex justify-center">
              <FlipClock
                seed={31}
                groups={[
                  { value: 1, digits: 2, caption: "DAYS" },
                  { value: 23, digits: 2, caption: "HOURS" },
                  { value: 45, digits: 2, caption: "MINUTES" },
                ]}
              />
            </SketchBox>
          </div>
        </div>

        {/* ── Row 2: Buttons ── */}
        <div className="space-y-2">
          <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Buttons</p>
          <div className="flex items-center gap-4 flex-wrap">
            <SketchButton seed={100}>VIEW CART</SketchButton>
            <SketchButtonDark seed={101}>CHECKOUT</SketchButtonDark>
            <SketchButtonDark seed={102}>SEND</SketchButtonDark>
            <IconButton seed={103} size={40}>
              <GearSix size={18} weight="bold" />
            </IconButton>
            <IconButton seed={104} size={40}>
              <Bell size={18} weight="bold" />
            </IconButton>
            <Tooltip content="Saved!" seed={105}>
              <SketchButton seed={106}>Hover me</SketchButton>
            </Tooltip>
          </div>
        </div>

        {/* ── Row 3: Inputs ── */}
        <div className="space-y-2">
          <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Inputs</p>
          <div className="flex gap-4 flex-wrap items-start">
            <SketchInput seed={200} placeholder="Search…" showIcon className="w-48" />
            <SketchInput seed={201} label="Email" placeholder="you@example.com" className="w-48" />
            <SketchSelect
              seed={202}
              options={["Name", "Date", "Popularity"]}
              value={selectVal}
              onChange={setSelectVal}
              placeholder="Category"
            />
            <SketchTextarea seed={203} placeholder="Message" className="w-64" />
          </div>
        </div>

        {/* ── Row 4: Controls ── */}
        <div className="space-y-2">
          <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Controls</p>
          <div className="flex items-end gap-8 flex-wrap">
            <div className="space-y-1">
              <span className="font-sketch text-xs text-ink-soft">Stepper</span>
              <Stepper seed={300} value={stepper} onChange={setStepper} />
            </div>
            <div className="space-y-1">
              <span className="font-sketch text-xs text-ink-soft">Toggle</span>
              <Toggle seed={301} checked={toggleOn} onChange={setToggleOn} />
            </div>
            <div className="w-48 space-y-1">
              <span className="font-sketch text-xs text-ink-soft">Slider (H)</span>
              <Slider seed={302} value={sliderH} onChange={setSliderH} label="Text size" />
            </div>
            <Slider
              seed={303}
              value={sliderV}
              onChange={setSliderV}
              orientation="vertical"
              label="Vol"
            />
            <Dial seed={304} value={sliderH} label="Sharpness" size={80} />
          </div>
        </div>

        {/* ── Row 5: Tabs ── */}
        <div className="space-y-2">
          <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Tabs</p>
          <div className="max-w-sm">
            <Tabs seed={400} tabs={["Tab 1", "Tab 2", "Tab 3"]} active={tab} onChange={setTab}>
              <p className="font-sketch text-sm text-ink-soft">
                I think they tried to bless each place with they need
              </p>
            </Tabs>
          </div>
        </div>

        {/* ── Row 6: List buttons + Pagination ── */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">ListButtons</p>
            <div className="space-y-1 max-w-xs">
              <ListButton seed={500} icon={<Tray size={18} weight="bold" />} label="Inbox" badge={3} />
              <ListButton seed={501} icon={<FolderSimple size={18} weight="bold" />} label="Shop" active />
              <ListButton seed={502} icon={<FileText size={18} weight="bold" />} label="My files" />
              <ListButton seed={503} icon={<House size={18} weight="bold" />} label="Home" />
              <ListButton seed={504} icon={<Star size={18} weight="bold" />} label="Favorites" />
              <ListButton seed={505} icon={<Trash size={18} weight="bold" />} label="Trash" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Pagination</p>
            <Pagination
              seed={600}
              page={page}
              totalPages={5}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />

            <div className="mt-6 space-y-1">
              <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">ProgressDots</p>
              <ProgressDots total={5} active={2} />
            </div>
          </div>
        </div>

        {/* ── Row 7: FlipCounter single + Skeleton + Icon grid ── */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">FlipCounter</p>
            <div className="flex gap-4">
              <FlipCounter seed={700} value={42} digits={2} caption="PAGES" />
              <FlipCounter seed={710} value={7} digits={2} caption="TODO" />
              <FlipCounter seed={720} value={1337} digits={4} caption="WORDS" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Skeleton</p>
            <div className="space-y-2 max-w-xs">
              <Skeleton seed={800} height={32} />
              <Skeleton seed={801} height={32} width="75%" />
              <Skeleton seed={802} height={32} width="50%" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Icon grid (Phosphor bold)</p>
            <div className="grid grid-cols-6 gap-3">
              {[House, Star, Trash, MagnifyingGlass, GearSix, Bell, Chat, Heart, Camera, Tag, Tray, FolderSimple].map(
                (Icon, i) => (
                  <Icon key={i} size={24} weight="bold" className="text-ink" />
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Row 8: Empty state ── */}
        <div className="space-y-2">
          <p className="font-sketch text-xs text-ink-soft uppercase tracking-widest">Empty state</p>
          <SketchBox seed={900} dashed className="flex flex-col items-center justify-center gap-3 p-12">
            <FileText size={40} weight="bold" className="relative z-10 text-ink-soft" />
            <p className="relative z-10 font-sketch text-ink-soft text-sm">
              Nothing here yet — create your first page!
            </p>
          </SketchBox>
        </div>

      </div>
    </div>
  );
}
