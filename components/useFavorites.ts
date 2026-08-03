"use client";

import { useEffect, useState, useCallback } from "react";

const KEY = "mooihuus:favs";
const EVT = "mooihuus:favs-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* private mode / storage vol — stil negeren */
  }
  window.dispatchEvent(new Event(EVT));
}

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    setFavs(read());
    const sync = () => setFavs(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync); // andere tab
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(next);
    setFavs(next);
  }, []);

  const isFav = useCallback((id: string) => favs.includes(id), [favs]);

  return { favs, toggle, isFav };
}
