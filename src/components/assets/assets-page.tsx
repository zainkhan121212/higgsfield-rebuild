"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Film, FolderPlus, Heart, ImageIcon, LayoutGrid, Music, Search, Sparkles, Trash2, ChevronDown, Folder } from "lucide-react";
import type { GenerationDTO } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/shell/session";
import { GenerationCard } from "@/components/studio/generation-card";
import { toast } from "@/components/ui/toast";

type FolderDTO = { id: string; name: string; count: number };
type Filter = { kind: "all" } | { kind: "favorites" } | { kind: "image" } | { kind: "video" } | { kind: "audio" } | { kind: "folder"; id: string };

export function AssetsPage({ initialFilter }: { initialFilter: string }) {
  const { user } = useSession();
  const [items, setItems] = useState<GenerationDTO[]>([]);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [size, setSize] = useState(3);
  const [filter, setFilter] = useState<Filter>(() => parseFilter(initialFilter));

  useEffect(() => {
    Promise.all([
      fetch("/api/generations?take=100", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/folders", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([g, f]) => {
      setItems(g.generations);
      setFolders(f.folders);
      setLoaded(true);
    });
  }, []);

  const counts = useMemo(
    () => ({
      all: items.length,
      favorites: items.filter((i) => i.isFavorite).length,
      image: items.filter((i) => i.kind === "image").length,
      video: items.filter((i) => i.kind === "video").length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    let xs = items;
    if (filter.kind === "favorites") xs = xs.filter((i) => i.isFavorite);
    else if (filter.kind === "image" || filter.kind === "video") xs = xs.filter((i) => i.kind === filter.kind);
    else if (filter.kind === "audio") xs = [];
    else if (filter.kind === "folder") xs = xs.filter((i) => i.folderId === filter.id);
    const s = q.trim().toLowerCase();
    if (s) xs = xs.filter((i) => i.prompt.toLowerCase().includes(s) || i.modelId.includes(s));
    return xs;
  }, [items, filter, q]);

  async function patch(id: string, body: Partial<Pick<GenerationDTO, "isFavorite" | "folderId">>) {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...body } : x)));
    await fetch(`/api/generations/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }
  async function remove(id: string) {
    setItems((xs) => xs.filter((x) => x.id !== id));
    await fetch(`/api/generations/${id}`, { method: "DELETE" });
  }
  async function createFolder() {
    const name = prompt("Folder name");
    if (!name?.trim()) return;
    const res = await fetch("/api/folders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    const { folder } = await res.json();
    setFolders((fs) => [...fs, { ...folder, count: 0 }]);
    setFilter({ kind: "folder", id: folder.id });
  }

  const title =
    filter.kind === "all" ? "All assets" : filter.kind === "favorites" ? "Favorites" : filter.kind === "folder" ? folders.find((f) => f.id === filter.id)?.name ?? "Folder" : `${filter.kind[0].toUpperCase()}${filter.kind.slice(1)}`;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="w-full shrink-0 border-b border-line bg-bg-elev p-3 lg:h-[var(--studio-h)] lg:w-[260px] lg:border-b-0 lg:border-r">
        <div className="flex h-9 items-center gap-2 rounded-lg bg-card px-3">
          <Search className="h-3.5 w-3.5 text-fg-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full bg-transparent text-[13px] outline-none placeholder:text-fg-3" />
        </div>
        <nav className="mt-3 flex flex-col gap-0.5">
          <SideItem icon={<LayoutGrid className="h-4 w-4" />} label="All Assets" count={counts.all} active={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })} />
          <SideItem icon={<Heart className="h-4 w-4" />} label="Favorites" count={counts.favorites} active={filter.kind === "favorites"} onClick={() => setFilter({ kind: "favorites" })} />
        </nav>
        <div className="mt-4 px-2 text-[11px] font-medium text-fg-3">Tools</div>
        <nav className="mt-1 flex flex-col gap-0.5">
          <SideItem icon={<ImageIcon className="h-4 w-4" />} label="Image" count={counts.image} active={filter.kind === "image"} onClick={() => setFilter({ kind: "image" })} />
          <SideItem icon={<Film className="h-4 w-4" />} label="Video" count={counts.video} active={filter.kind === "video"} onClick={() => setFilter({ kind: "video" })} />
          <SideItem icon={<Music className="h-4 w-4" />} label="Audio" count={0} active={filter.kind === "audio"} onClick={() => setFilter({ kind: "audio" })} />
        </nav>
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            <ChevronDown className="h-3.5 w-3.5 text-fg-3" />
            <span className="flex h-4 w-4 items-center justify-center rounded bg-fg text-[9px] font-bold text-paper">{user?.name.slice(0, 1).toUpperCase()}</span>
            <span className="max-w-[120px] truncate">{user?.name ?? "You"}</span>
          </div>
          <button onClick={createFolder} title="New folder" className="rounded-md p-1 text-fg-3 hover:bg-fg/8 hover:text-fg">
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
        {folders.length === 0 ? (
          <div className="px-2 py-2 text-[11px] text-fg-3">Create one to stay organized</div>
        ) : (
          <nav className="mt-1 flex flex-col gap-0.5">
            {folders.map((f) => (
              <SideItem key={f.id} icon={<Folder className="h-4 w-4" />} label={f.name} count={items.filter((i) => i.folderId === f.id).length} active={filter.kind === "folder" && filter.id === f.id} onClick={() => setFilter({ kind: "folder", id: f.id })} />
            ))}
          </nav>
        )}
      </aside>

      <section className="thin-scroll flex min-w-0 flex-1 flex-col overflow-y-auto p-4 lg:h-[var(--studio-h)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="display text-[21px]">{title}</h1>
          <label className="flex items-center gap-2 text-[11px] text-fg-3">
            <LayoutGrid className="h-3.5 w-3.5" />
            <input type="range" min={1} max={5} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24 accent-lime" />
          </label>
        </div>

        {!loaded ? (
          <div className="mx-auto mt-24 h-6 w-6 animate-spin rounded-full border-2 border-line border-t-lime" />
        ) : visible.length === 0 ? (
          <Empty filter={filter} />
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${[560, 420, 320, 240, 180][size - 1]}px, 1fr))` }}>
            {visible.map((g) => (
              <div key={g.id} className="group relative">
                <GenerationCard g={g} onFavorite={(id, v) => patch(id, { isFavorite: v })} onDelete={remove} compact={size >= 3} />
                {folders.length > 0 && (
                  <select
                    value={g.folderId ?? ""}
                    onChange={(e) => {
                      patch(g.id, { folderId: e.target.value || null });
                      toast(e.target.value ? "Moved to folder" : "Removed from folder");
                    }}
                    className="absolute bottom-5 left-5 rounded-md border border-line bg-black/70 px-2 py-1 text-[11px] opacity-0 backdrop-blur transition group-hover:opacity-100"
                  >
                    <option value="">No folder</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function parseFilter(s: string): Filter {
  if (s === "favorites" || s === "image" || s === "video" || s === "audio") return { kind: s };
  return { kind: "all" };
}

function SideItem({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium", active ? "bg-fg/8 text-fg" : "text-fg-2 hover:bg-fg/5 hover:text-fg")}>
      <span className={cn(active ? "text-lime" : "text-fg-3")}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="rounded-full bg-fg/6 px-1.5 text-[10px] text-fg-3">{count}</span>
    </button>
  );
}

function Empty({ filter }: { filter: Filter }) {
  return (
    <div className="mx-auto mt-16 max-w-sm text-center">
      <div className="relative mx-auto mb-6 h-24 w-40">
        {[-14, -4, 6, 16].map((r, i) => (
          <div key={i} className="absolute left-1/2 top-2 h-20 w-16 -translate-x-1/2 rounded-lg border border-fg/10" style={{ transform: `translateX(-50%) translateX(${(i - 1.5) * 26}px) rotate(${r}deg)`, background: ["#2a2115", "#15202a", "#2a1520", "#152a1d"][i] }} />
        ))}
      </div>
      <div className="text-[15px] font-semibold">{filter.kind === "favorites" ? "No favorites yet" : filter.kind === "audio" ? "Audio isn't in this build" : "Your generations will appear here"}</div>
      <div className="mt-1 text-[13px] text-fg-3">{filter.kind === "favorites" ? "Tap the heart on any generation." : "Use folders to keep your work organized."}</div>
      <Link href="/ai/image" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-[13px] font-semibold text-paper hover:bg-lime">
        <Sparkles className="h-3.5 w-3.5" /> Generate
      </Link>
      <div className="mt-8 flex items-center justify-center gap-1 text-[11px] text-fg-3">
        <Trash2 className="h-3 w-3" /> Deleting is instant and permanent.
      </div>
    </div>
  );
}
