import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".local-data");
const DATA_FILE = path.join(DATA_DIR, "pages.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), "utf-8");
  }
}

function readAll(): any[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(items: any[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export const localStore = {
  query(userId: string, options?: { isDeleted?: boolean; isFavorite?: boolean; search?: string }) {
    const all = readAll();
    return all.filter((item) => {
      if (item.userId !== userId) return false;
      if (options?.isDeleted !== undefined && item.isDeleted !== options.isDeleted) return false;
      if (options?.isFavorite !== undefined && item.isFavorite !== options.isFavorite) return false;
      if (options?.search && !item.title.toLowerCase().includes(options.search.toLowerCase())) return false;
      return true;
    });
  },

  get(userId: string, pageId: string) {
    const all = readAll();
    return all.find((item) => item.userId === userId && item.pageId === pageId) || null;
  },

  put(item: any) {
    const all = readAll();
    const idx = all.findIndex((i) => i.userId === item.userId && i.pageId === item.pageId);
    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.push(item);
    }
    writeAll(all);
    return item;
  },

  update(userId: string, pageId: string, updates: Record<string, any>) {
    const all = readAll();
    const idx = all.findIndex((i) => i.userId === userId && i.pageId === pageId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
      writeAll(all);
      return all[idx];
    }
    return null;
  },

  delete(userId: string, pageId: string) {
    const all = readAll();
    const filtered = all.filter((i) => !(i.userId === userId && i.pageId === pageId));
    writeAll(filtered);
    return true;
  },
};
