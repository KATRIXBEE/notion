"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Image as ImageIcon,
  Star,
  Trash,
  X,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  SketchBox,
  IconButton,
  Tabs,
} from "@/components/sketch";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { EmojiPicker } from "@/components/editor/EmojiPicker";
import { usePages } from "@/lib/context/PageContext";
import { NotionLitePageItem } from "@/app/api/pages/route";

export default function PageEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const { refreshPages, setSaveStatus, setBreadcrumbs, pages } = usePages();

  const [page, setPage] = useState<NotionLitePageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Edit");

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📄");
  const [content, setContent] = useState("");
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced auto-save timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Fetch page data
  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch(`/api/pages/${id}`);
        if (!res.ok) {
          router.push("/home");
          return;
        }
        const data = await res.json();
        const p = data.page as NotionLitePageItem;
        setPage(p);
        setTitle(p.title || "");
        setIcon(p.icon || "📄");
        setContent(p.content || "");
        setCoverKey(p.coverKey || null);
        setIsFavorite(!!p.isFavorite);

        // If coverKey exists, fetch presigned GET url
        if (p.coverKey) {
          fetchCoverUrl(p.coverKey);
        }
      } catch {
        router.push("/home");
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, [id, router]);

  // Update breadcrumbs
  useEffect(() => {
    if (!page) return;
    const crumbs: { label: string; href?: string }[] = [
      { label: "Home", href: "/home" },
    ];
    if (page.parentId) {
      const parent = pages.find((p) => p.pageId === page.parentId);
      if (parent) {
        crumbs.push({ label: parent.title || "Untitled", href: `/page/${parent.pageId}` });
      }
    }
    crumbs.push({ label: title || "Untitled" });
    setBreadcrumbs(crumbs);
  }, [page, title, pages, setBreadcrumbs]);

  const fetchCoverUrl = async (key: string) => {
    try {
      const res = await fetch(`/api/uploads/cover?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        setCoverUrl(data.url);
      }
    } catch {
      // ignore
    }
  };

  // Auto-save logic with 800ms debounce
  const triggerAutoSave = useCallback(
    (updates: {
      title?: string;
      icon?: string;
      content?: string;
      coverKey?: string | null;
      isFavorite?: boolean;
    }) => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/pages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });

          if (res.ok) {
            setSaveStatus("saved");
            refreshPages();
            setTimeout(() => {
              setSaveStatus("idle");
            }, 2000);
          } else {
            setSaveStatus("idle");
          }
        } catch {
          setSaveStatus("idle");
        }
      }, 800);
    },
    [id, refreshPages, setSaveStatus]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave({ title: newTitle, icon, content, coverKey, isFavorite });
  };

  const handleIconChange = (newIcon: string) => {
    setIcon(newIcon);
    triggerAutoSave({ title, icon: newIcon, content, coverKey, isFavorite });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave({ title, icon, content: newContent, coverKey, isFavorite });
  };

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    triggerAutoSave({ title, icon, content, coverKey, isFavorite: next });
  };

  const handleDelete = async () => {
    if (!confirm("Move this page to Trash?")) return;
    try {
      await fetch(`/api/pages/${id}`, { method: "DELETE" });
      await refreshPages();
      router.push("/home");
    } catch {
      // ignore
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image must be smaller than 2 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }

    setUploadError("");
    setUploadingCover(true);

    try {
      // 1. Get presigned PUT URL
      const presignRes = await fetch("/api/uploads/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!presignRes.ok) {
        setUploadError("Failed to initiate upload");
        return;
      }

      const { uploadUrl, key } = await presignRes.json();

      // 2. Direct PUT to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        setUploadError("Upload to S3 failed");
        return;
      }

      // 3. Save coverKey to page and fetch signed GET URL
      setCoverKey(key);
      fetchCoverUrl(key);
      triggerAutoSave({ title, icon, content, coverKey: key, isFavorite });
    } catch {
      setUploadError("Upload error occurred");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverKey(null);
    setCoverUrl(null);
    triggerAutoSave({ title, icon, content, coverKey: null, isFavorite });
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-sketch text-ink-soft">
        Loading page…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Cover Area */}
      <div>
        {coverUrl ? (
          <SketchBox seed={10} className="w-full h-48 overflow-hidden relative group">
            <Image
              src={coverUrl}
              alt="Page cover"
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
              unoptimized
            />
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-paper border border-ink px-2.5 py-1 font-sketch text-xs text-ink cursor-pointer flex items-center gap-1 shadow-none"
              >
                <UploadSimple size={12} weight="bold" />
                <span>Change</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveCover}
                className="bg-paper border border-ink p-1 font-sketch text-xs text-ink cursor-pointer shadow-none"
                title="Remove cover"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </SketchBox>
        ) : (
          <SketchBox
            seed={11}
            dashed
            className="w-full h-24 flex items-center justify-center cursor-pointer hover:bg-ink/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="relative z-10 flex items-center gap-2 font-sketch text-xs text-ink-soft">
              <ImageIcon size={18} weight="bold" />
              <span>{uploadingCover ? "Uploading…" : "Add cover image (max 2 MB)"}</span>
            </div>
          </SketchBox>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        {uploadError && (
          <p className="font-sketch text-xs text-ink mt-1">
            ⚠️ {uploadError}
          </p>
        )}
      </div>

      {/* Top action row: Icon picker + Title + Star + Trash */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <EmojiPicker currentIcon={icon} onSelect={handleIconChange} />

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="font-sketch text-3xl sm:text-4xl font-bold text-ink placeholder:text-ink-soft bg-transparent w-full focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-2">
          {/* Favorite button */}
          <IconButton
            seed={12}
            size={36}
            onClick={toggleFavorite}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              size={18}
              weight={isFavorite ? "fill" : "bold"}
              className={isFavorite ? "text-ink" : "text-ink-soft"}
            />
          </IconButton>

          {/* Delete to trash button */}
          <IconButton
            seed={13}
            size={36}
            onClick={handleDelete}
            title="Move to trash"
          >
            <Trash size={18} weight="bold" className="text-ink-soft hover:text-ink" />
          </IconButton>
        </div>
      </div>

      {/* Tabs: Edit | Preview */}
      <Tabs
        seed={14}
        tabs={["Edit", "Preview"]}
        active={activeTab}
        onChange={setActiveTab}
      >
        <div className="min-h-[400px]">
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            editable={activeTab === "Edit"}
          />
        </div>
      </Tabs>
    </div>
  );
}
