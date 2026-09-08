import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

const KEY = "helix-org-os";

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { name: string; value: string } | null = null;

export const idbStorage: StateStorage = {
  getItem: async (name) => {
    const v = await get<string>(name);
    return v ?? null;
  },
  setItem: async (name, value) => {
    pending = { name, value };
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      const job = pending;
      pending = null;
      if (job) void set(job.name, job.value);
    }, 2000);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

export const PERSIST_KEY = KEY;
