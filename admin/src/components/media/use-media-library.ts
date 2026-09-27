"use client";

import { useEffect, useRef, useState } from "react";
import { kindsFromAccept, listMedia, MEDIA_PAGE_SIZE, type MediaAsset, type MediaKind } from "@/lib/data/media";
import { getBrowserClient } from "@/lib/supabase/client";

export type MediaLibraryState = {
  assets: MediaAsset[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  query: string;
  kind: MediaKind | "all";
  allowed: MediaKind[];
  hasMore: boolean;
};

/** Browser-side paging of the media library, as the signed-in user. */
export function useMediaLibrary(accept?: string) {
  const allowedKey = kindsFromAccept(accept).join(",");
  const allowed = allowedKey ? (allowedKey.split(",") as MediaKind[]) : [];
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MediaKind | "all">("all");
  // Answers that arrive after a newer request started are ignored.
  const requestId = useRef(0);

  async function load(offset: number) {
    const id = ++requestId.current;
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const result = await listMedia(getBrowserClient(), { q: query, kind, allowed, offset });
      if (id !== requestId.current) return;
      setAssets((current) => (offset === 0 ? result.assets : [...current, ...result.assets]));
      setTotal(result.total);
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : "Could not load the media library.");
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(0), query ? 250 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when the filters change
  }, [query, kind, allowedKey]);

  const state: MediaLibraryState = {
    assets,
    total,
    loading,
    loadingMore,
    error,
    query,
    kind,
    allowed,
    hasMore: assets.length < total && assets.length % MEDIA_PAGE_SIZE === 0,
  };

  return {
    state,
    setQuery,
    setKind,
    loadMore: () => void load(assets.length),
    refresh: () => void load(0),
    prepend(asset: MediaAsset) {
      setAssets((current) => [asset, ...current.filter((entry) => entry.id !== asset.id)]);
      setTotal((count) => count + 1);
    },
    replace(asset: MediaAsset) {
      setAssets((current) => current.map((entry) => (entry.id === asset.id ? asset : entry)));
    },
    remove(id: string) {
      setAssets((current) => current.filter((entry) => entry.id !== id));
      setTotal((count) => Math.max(0, count - 1));
    },
  };
}
