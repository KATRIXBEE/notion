"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Star, ArrowRight } from "@phosphor-icons/react";
import { SketchBox } from "@/components/sketch";
import { usePages } from "@/lib/context/PageContext";

export default function FavoritesPage() {
  const { pages, setBreadcrumbs } = usePages();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", href: "/home" },
      { label: "Favorites" },
    ]);
  }, [setBreadcrumbs]);

  const favoritePages = pages.filter((p) => p.isFavorite && !p.isDeleted);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star size={28} weight="bold" className="text-ink" />
        <h1 className="font-sketch text-3xl font-bold text-ink">Favorites</h1>
      </div>

      {favoritePages.length > 0 ? (
        <div className="space-y-3">
          {favoritePages.map((p, idx) => (
            <Link
              key={p.pageId}
              href={`/page/${p.pageId}`}
              className="block group"
            >
              <SketchBox seed={120 + idx} className="p-4 hover:bg-ink/5 transition-colors">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon || "📄"}</span>
                    <div>
                      <p className="font-sketch text-lg font-bold text-ink group-hover:underline">
                        {p.title || "Untitled"}
                      </p>
                      <p className="font-sketch text-xs text-ink-soft">
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} weight="bold" className="text-ink-soft group-hover:text-ink" />
                </div>
              </SketchBox>
            </Link>
          ))}
        </div>
      ) : (
        <SketchBox seed={129} dashed className="p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Star size={40} weight="bold" className="relative z-10 text-ink-soft" />
          <p className="relative z-10 font-sketch text-base text-ink-soft">
            No favorite pages yet.
          </p>
          <p className="relative z-10 font-sketch text-xs text-ink-soft">
            Click the star icon in any page editor to bookmark it here.
          </p>
        </SketchBox>
      )}
    </div>
  );
}
