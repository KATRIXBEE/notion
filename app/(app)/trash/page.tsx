"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash, ArrowCounterClockwise, Warning } from "@phosphor-icons/react";
import {
  SketchBox,
  SketchButton,
  SketchButtonDark,
  Pagination,
} from "@/components/sketch";
import { usePages } from "@/lib/context/PageContext";
import { NotionLitePageItem } from "@/app/api/pages/route";

export default function TrashPage() {
  const { refreshPages, setBreadcrumbs } = usePages();

  const [trashPages, setTrashPages] = useState<NotionLitePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", href: "/home" },
      { label: "Trash" },
    ]);
  }, [setBreadcrumbs]);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pages?trash=true");
      if (res.ok) {
        const data = await res.json();
        setTrashPages(data.pages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (pageId: string) => {
    setActionId(pageId);
    try {
      const res = await fetch(`/api/pages/${pageId}/restore`, { method: "POST" });
      if (res.ok) {
        await loadTrash();
        await refreshPages();
      }
    } finally {
      setActionId(null);
    }
  };

  const handleDeletePermanent = async (pageId: string) => {
    if (!confirm("Delete this page permanently? This cannot be undone.")) return;
    setActionId(pageId);
    try {
      const res = await fetch(`/api/pages/${pageId}?permanent=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadTrash();
        await refreshPages();
      }
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(trashPages.length / pageSize));
  const displayedPages = trashPages.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trash size={28} weight="bold" className="text-ink" />
          <h1 className="font-sketch text-3xl font-bold text-ink">Trash</h1>
        </div>
        <span className="font-sketch text-xs text-ink-soft">
          {trashPages.length} items in trash
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center font-sketch text-ink-soft">
          Loading trash…
        </div>
      ) : trashPages.length === 0 ? (
        <SketchBox seed={140} dashed className="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Trash size={40} weight="bold" className="relative z-10 text-ink-soft" />
          <p className="relative z-10 font-sketch text-base text-ink-soft">
            Trash is empty.
          </p>
          <p className="relative z-10 font-sketch text-xs text-ink-soft">
            Pages you delete will appear here before being permanently removed.
          </p>
        </SketchBox>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {displayedPages.map((p, idx) => (
              <SketchBox key={p.pageId} seed={141 + idx} className="p-3">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{p.icon || "📄"}</span>
                    <div className="truncate">
                      <p className="font-sketch text-base font-bold text-ink truncate">
                        {p.title || "Untitled"}
                      </p>
                      <p className="font-sketch text-xs text-ink-soft">
                        Deleted {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Restore button (outlined) */}
                    <SketchButton
                      seed={150 + idx}
                      disabled={actionId === p.pageId}
                      onClick={() => handleRestore(p.pageId)}
                    >
                      <span className="flex items-center gap-1.5 py-0.5">
                        <ArrowCounterClockwise size={14} weight="bold" />
                        <span>Restore</span>
                      </span>
                    </SketchButton>

                    {/* Delete forever button (dark filled) */}
                    <SketchButtonDark
                      seed={160 + idx}
                      disabled={actionId === p.pageId}
                      onClick={() => handleDeletePermanent(p.pageId)}
                    >
                      <span className="flex items-center gap-1.5 py-0.5">
                        <Warning size={14} weight="bold" />
                        <span>Delete forever</span>
                      </span>
                    </SketchButtonDark>
                  </div>
                </div>
              </SketchBox>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="pt-4 border-t border-ink/20 flex justify-between items-center flex-wrap gap-4">
            <Pagination
              seed={170}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              pageSizeOptions={["5", "10", "20"]}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
