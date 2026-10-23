"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotionLitePageItem } from "@/app/api/pages/route";

interface PageContextType {
  pages: NotionLitePageItem[];
  loading: boolean;
  refreshPages: () => Promise<void>;
  createPage: (parentId?: string | null) => Promise<string | null>;
  saveStatus: "idle" | "saving" | "saved";
  setSaveStatus: (status: "idle" | "saving" | "saved") => void;
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (b: { label: string; href?: string }[]) => void;
}

const PageContext = createContext<PageContextType>({
  pages: [],
  loading: true,
  refreshPages: async () => {},
  createPage: async () => null,
  saveStatus: "idle",
  setSaveStatus: () => {},
  breadcrumbs: [],
  setBreadcrumbs: () => {},
});

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<NotionLitePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href?: string }[]>([
    { label: "Home", href: "/home" },
  ]);
  const router = useRouter();

  const refreshPages = useCallback(async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPages();
  }, [refreshPages]);

  const createPage = async (parentId: string | null = null): Promise<string | null> => {
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled",
          parentId: parentId || null,
          icon: "📄",
          content: "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newPage = data.page as NotionLitePageItem;
        await refreshPages();
        router.push(`/page/${newPage.pageId}`);
        return newPage.pageId;
      }
    } catch {
      // ignore
    }
    return null;
  };

  return (
    <PageContext.Provider
      value={{
        pages,
        loading,
        refreshPages,
        createPage,
        saveStatus,
        setSaveStatus,
        breadcrumbs,
        setBreadcrumbs,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

export const usePages = () => useContext(PageContext);
