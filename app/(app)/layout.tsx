"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  List,
  House,
  Star,
  Trash,
  Plus,
  GearSix,
  Check,
  CircleNotch,
  CaretRight,
  CaretDown,
  SignOut,
} from "@phosphor-icons/react";
import {
  SketchBox,
  SketchButtonDark,
  IconButton,
  SketchInput,
  Toggle,
  Slider,
  Tooltip,
  ProfileCard,
  ListButton,
} from "@/components/sketch";
import { useAuth } from "@/lib/context/AuthContext";
import { useSettings } from "@/lib/context/SettingsContext";
import { PageProvider, usePages } from "@/lib/context/PageContext";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { textSize, setTextSize, pageWidth, setPageWidth, darkMode, setDarkMode } = useSettings();
  const { pages, createPage, saveStatus, breadcrumbs } = usePages();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Build tree structure (root pages and their 1-level children)
  const { rootPages, childPagesMap } = useMemo(() => {
    const nonDeleted = pages.filter((p) => !p.isDeleted);
    const roots = nonDeleted.filter((p) => !p.parentId);
    const map: Record<string, typeof nonDeleted> = {};

    for (const p of nonDeleted) {
      if (p.parentId) {
        if (!map[p.parentId]) map[p.parentId] = [];
        map[p.parentId].push(p);
      }
    }
    return { rootPages: roots, childPagesMap: map };
  }, [pages]);

  // Filtered pages for search
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return pages.filter(
      (p) => !p.isDeleted && p.title.toLowerCase().includes(q)
    );
  }, [pages, searchQuery]);

  const toggleExpand = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPages((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const handleCreateRoot = async () => {
    await createPage(null);
  };

  const handleCreateChild = async (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPages((prev) => ({ ...prev, [parentId]: true }));
    await createPage(parentId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-sketch text-ink text-xl">
        Loading NotionLite…
      </div>
    );
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="pt-2">
          <ProfileCard
            seed={10}
            name={user?.email?.split("@")[0] || "User"}
            subtitle={`${pages.filter((p) => !p.isDeleted).length} pages`}
          />
        </div>

        {/* Search Input */}
        <div>
          <SketchInput
            seed={20}
            showIcon
            placeholder="Search pages…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Navigation list buttons */}
        <div className="space-y-1">
          <ListButton
            seed={30}
            icon={<House size={18} weight="bold" />}
            label="Home"
            active={pathname === "/home"}
            onClick={() => {
              router.push("/home");
              setMobileDrawerOpen(false);
            }}
          />
          <ListButton
            seed={31}
            icon={<Star size={18} weight="bold" />}
            label="Favorites"
            active={pathname === "/favorites"}
            onClick={() => {
              router.push("/favorites");
              setMobileDrawerOpen(false);
            }}
          />
          <ListButton
            seed={32}
            icon={<Trash size={18} weight="bold" />}
            label="Trash"
            active={pathname === "/trash"}
            onClick={() => {
              router.push("/trash");
              setMobileDrawerOpen(false);
            }}
          />
        </div>

        {/* Pages Header */}
        <div className="pt-2 border-t border-ink/20 flex items-center justify-between">
          <span className="font-sketch text-xs text-ink-soft uppercase tracking-wider">
            Pages
          </span>
          <button
            type="button"
            onClick={handleCreateRoot}
            title="Create page"
            className="cursor-pointer text-ink hover:text-ink-soft p-1"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>

        {/* Page Tree or Search Results */}
        <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
          {filteredPages ? (
            filteredPages.length === 0 ? (
              <p className="font-sketch text-xs text-ink-soft italic p-2">
                No matching pages
              </p>
            ) : (
              filteredPages.map((p, idx) => {
                const isActive = pathname === `/page/${p.pageId}`;
                return (
                  <div key={p.pageId}>
                    <SketchBox seed={50 + idx} dashed={isActive}>
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/page/${p.pageId}`);
                          setMobileDrawerOpen(false);
                        }}
                        className="relative z-10 w-full px-3 py-2 text-left flex items-center gap-2 font-sketch text-sm text-ink min-h-[40px]"
                      >
                        <span>{p.icon || "📄"}</span>
                        <span className="truncate flex-1">{p.title || "Untitled"}</span>
                      </button>
                    </SketchBox>
                  </div>
                );
              })
            )
          ) : rootPages.length === 0 ? (
            <p className="font-sketch text-xs text-ink-soft italic p-2">
              No pages yet. Click &quot;+&quot; or &quot;New page&quot; below.
            </p>
          ) : (
            rootPages.map((p, idx) => {
              const children = childPagesMap[p.pageId] || [];
              const hasChildren = children.length > 0;
              const isExpanded = !!expandedPages[p.pageId];
              const isActive = pathname === `/page/${p.pageId}`;

              return (
                <div key={p.pageId} className="space-y-1">
                  <SketchBox seed={60 + idx} dashed={isActive}>
                    <div className="relative z-10 flex items-center px-2 py-1.5 min-h-[40px] group">
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(p.pageId, e)}
                          className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                        >
                          {isExpanded ? (
                            <CaretDown size={14} weight="bold" />
                          ) : (
                            <CaretRight size={14} weight="bold" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/page/${p.pageId}`);
                          setMobileDrawerOpen(false);
                        }}
                        className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer font-sketch text-sm text-ink"
                      >
                        <span>{p.icon || "📄"}</span>
                        <span className="truncate">{p.title || "Untitled"}</span>
                      </button>

                      {/* Add sub-page button (one sub-level per spec) */}
                      <button
                        type="button"
                        onClick={(e) => handleCreateChild(p.pageId, e)}
                        title="Add sub-page"
                        className="opacity-0 group-hover:opacity-100 p-1 text-ink-soft hover:text-ink cursor-pointer"
                      >
                        <Plus size={14} weight="bold" />
                      </button>
                    </div>
                  </SketchBox>

                  {/* Sub-level child pages */}
                  {isExpanded &&
                    children.map((child, cIdx) => {
                      const isChildActive = pathname === `/page/${child.pageId}`;
                      return (
                        <div key={child.pageId} className="pl-6">
                          <SketchBox seed={200 + idx * 10 + cIdx} dashed={isChildActive}>
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/page/${child.pageId}`);
                                setMobileDrawerOpen(false);
                              }}
                              className="relative z-10 w-full px-2 py-1.5 text-left flex items-center gap-2 font-sketch text-sm text-ink min-h-[38px] truncate"
                            >
                              <span>{child.icon || "📄"}</span>
                              <span className="truncate flex-1">
                                {child.title || "Untitled"}
                              </span>
                            </button>
                          </SketchBox>
                        </div>
                      );
                    })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New page button */}
      <div className="pt-4 border-t border-ink/20">
        <SketchButtonDark
          seed={99}
          className="w-full justify-center"
          onClick={handleCreateRoot}
        >
          <span className="flex items-center justify-center gap-2 w-full py-1">
            <Plus size={16} weight="bold" />
            <span>New page</span>
          </span>
        </SketchButtonDark>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Desktop Sidebar (260px) */}
      {sidebarOpen && (
        <aside className="hidden md:block w-[260px] flex-shrink-0 border-r-2 border-ink h-screen sticky top-0 bg-paper">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-[280px] max-w-[85%] bg-paper border-r-2 border-ink h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b-2 border-ink flex items-center justify-between px-4 bg-paper sticky top-0 z-30">
          {/* Left: Sidebar toggle + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <IconButton
              seed={1}
              size={34}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDrawerOpen(true);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              aria-label="Toggle sidebar"
            >
              <List size={18} weight="bold" />
            </IconButton>

            {/* Breadcrumb trail */}
            <nav className="flex items-center gap-1.5 font-sketch text-sm text-ink">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-ink-soft">/</span>}
                  {b.href ? (
                    <Link
                      href={b.href}
                      className="hover:underline text-ink-soft hover:text-ink truncate max-w-[140px]"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-bold truncate max-w-[180px]">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Saving Indicator + Dark Mode + Settings */}
          <div className="flex items-center gap-3">
            {/* Saving / Saved Indicator with Tooltip */}
            {saveStatus !== "idle" && (
              <Tooltip
                seed={2}
                content={saveStatus === "saving" ? "Saving changes…" : "All changes saved"}
              >
                <div className="flex items-center gap-1 font-sketch text-xs text-ink-soft px-2 py-1">
                  {saveStatus === "saving" ? (
                    <>
                      <CircleNotch size={14} weight="bold" className="animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} weight="bold" />
                      <span>Saved</span>
                    </>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Dark mode Toggle */}
            <div className="flex items-center gap-1.5">
              <Toggle seed={3} checked={darkMode} onChange={setDarkMode} />
            </div>

            {/* Settings Popover */}
            <div className="relative">
              <IconButton
                seed={4}
                size={34}
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-label="Settings"
              >
                <GearSix size={18} weight="bold" />
              </IconButton>

              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 z-50">
                  <SketchBox seed={5} className="p-4 space-y-4 bg-paper">
                    <div className="flex items-center justify-between border-b border-ink/20 pb-2">
                      <span className="font-sketch text-sm font-bold text-ink">
                        Settings
                      </span>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(false)}
                        className="font-sketch text-xs text-ink-soft cursor-pointer hover:text-ink"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Text Size Slider */}
                    <div>
                      <Slider
                        seed={6}
                        min={12}
                        max={24}
                        step={1}
                        value={textSize}
                        onChange={setTextSize}
                        label={`Text size (${textSize}px)`}
                      />
                    </div>

                    {/* Page Width Slider */}
                    <div>
                      <Slider
                        seed={7}
                        min={600}
                        max={1200}
                        step={50}
                        value={pageWidth}
                        onChange={setPageWidth}
                        label={`Page width (${pageWidth}px)`}
                      />
                    </div>

                    {/* Logout Button */}
                    <div className="pt-2 border-t border-ink/20 flex justify-end">
                      <button
                        type="button"
                        onClick={logout}
                        className="flex items-center gap-1.5 font-sketch text-xs text-ink hover:underline cursor-pointer"
                      >
                        <SignOut size={14} weight="bold" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </SketchBox>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main
          className="flex-1 p-6 mx-auto w-full"
          style={{
            maxWidth: `${pageWidth}px`,
            fontSize: `${textSize}px`,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageProvider>
      <AppShellContent>{children}</AppShellContent>
    </PageProvider>
  );
}
