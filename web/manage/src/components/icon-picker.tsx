import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconChevronDown as ChevronDown, IconChevronRight as ChevronRight, IconSearch as Search, IconTrash as Trash, IconX as X } from "@tabler/icons-react";
import { BRANDS, ICONS, ICON_GROUPS, isIconName as isIconNameGuard } from "@shared/icons";
import { ApiError, api, uploadUrl } from "@/api";
import { Button } from "@/components/ui/knowns/button";
import { Input } from "@/components/ui/knowns/input";
import { Popover } from "@/components/ui/knowns/popover";
import { SegmentedControl } from "@/components/ui/knowns/segmented-control";
import { Select } from "@/components/ui/knowns/select";
import { Spinner } from "@/components/ui/knowns/spinner";
import { AppList } from "@/components/app-picker";
import { CatalogGlyph, Icon, ItemIcon, LobeGlyph } from "@/components/icon";
import { useCatalog } from "@/lib/icon-data";
import { getLanguage, t, useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const isIconName = (v: string): boolean => isIconNameGuard(v);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

/** Icon catalog categories (English names from the catalog, translated with t() where shown). */
const EMOJI_GROUP_EN: Record<string, string> = {
  smileys_emotion: "Smileys & emotion", people_body: "People & body", animals_nature: "Animals & nature", food_drink: "Food & drink", travel_places: "Travel & places",
  activities: "Activities", objects: "Objects", symbols: "Symbols & signs", flags: "Flags",
};
const cmp = (a: string, b: string) => a.localeCompare(b, getLanguage());
const numLocale = () => (getLanguage() === "vi" ? "vi-VN" : getLanguage() === "zh" ? "zh-CN" : "en-US");

type Tab = "icon" | "brand" | "lobe" | "emoji" | "app" | "img";
const TABS: { value: Tab; label: string }[] = [
  { value: "icon", label: "Icon" },
  { value: "brand", label: "Brand logos" },
  { value: "lobe", label: "AI brand" },
  { value: "emoji", label: "Emoji" },
  { value: "app", label: "Apps" },
  { value: "img", label: "Image" },
];

const CELL = 42;
const COLS = 8;
const HEIGHT = 252;

/** Fixed-cell grid that only mounts the rows in view, so thousands of items stay smooth. */
function VirtualGrid({ count, render, height = HEIGHT }: { count: number; render: (i: number) => ReactNode; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const rows = Math.ceil(count / COLS);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    setTop(0);
  }, [count]);
  const first = Math.max(0, Math.floor(top / CELL) - 2);
  const last = Math.min(rows, Math.ceil((top + height) / CELL) + 2);
  const cells: ReactNode[] = [];
  for (let i = first * COLS; i < Math.min(count, last * COLS); i++) cells.push(render(i));
  return (
    <div ref={ref} onScroll={(e) => setTop(e.currentTarget.scrollTop)} className="kn-scroll-auto overflow-y-auto" style={{ height: Math.min(height, Math.max(rows, 1) * CELL) }}>
      <div style={{ height: rows * CELL, position: "relative" }}>
        <div className="absolute inset-x-0 grid" style={{ top: first * CELL, gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>{cells}</div>
      </div>
    </div>
  );
}

function CellButton({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      style={{ height: CELL }}
      className={cn("relative grid place-items-center rounded-lg transition-colors hover:bg-muted", on && "bg-primary text-primary-foreground hover:bg-primary")}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="grid place-items-center text-center text-[13px] text-muted-foreground" style={{ height: HEIGHT }}>{children}</div>;
}

function IconTab({ value, onPick }: { value: string | undefined; onPick: (v: string) => void }) {
  const lang = useLanguage();
  const { catalog, loading, error, retry } = useCatalog(true);
  const [q, setQ] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);

  // Without the agent's catalog, fall back to the built-in groups so the picker still works.
  const all = useMemo(() => {
    if (catalog) return Object.entries(catalog.icons).map(([name, i]) => ({ name, c: i.c, t: i.t.join(" "), solid: !!i.F && !!i.O }));
    return Object.entries(ICON_GROUPS).flatMap(([g, names]) => names.filter((n) => !(n in BRANDS)).map((name) => ({ name, c: g, t: "", solid: !!ICONS[name]?.F })));
  }, [catalog]);

  const list = useMemo(() => {
    const n = norm(q.trim());
    return all.filter((i) => (!n || i.name.includes(n.replace(/\s+/g, "-")) || norm(i.t).includes(n) || norm(`${i.c} ${t(i.c)}`).includes(n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, lang]);
  const byCat = useMemo(() => {
    const m = new Map<string, typeof all>();
    for (const i of all) (m.get(i.c) ?? m.set(i.c, []).get(i.c)!).push(i);
    return [...m.entries()].sort((a, b) => cmp(t(a[0]), t(b[0])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, lang]);
  const tree = !q.trim() && byCat.length > 1;

  const cellFor = (i: number, items: typeof all) => {
                const it = items[i]!;
                const on = value === it.name;
                return (
                  <CellButton key={it.name} label={it.name} on={on} onClick={() => onPick(it.name)}>
                    {it.solid && <span title={t("Has a solid variant")} className="absolute right-1 top-1 size-1.5 rounded-full bg-current opacity-50" />}
                    {catalog ? <CatalogGlyph name={it.name} size={20} weight={on ? "Filled" : "Outline"} /> : <Icon name={it.name} size={20} weight={on ? "Filled" : "Outline"} />}
                  </CellButton>
                );
              };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input autoFocus size="sm" icon={<Search />} placeholder={t("Search by name or keyword (English)…")} aria-label={t("Search icons")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? (
        <Empty><span className="flex items-center gap-2"><Spinner label={t("Loading")} /> {t("Loading all icons…")}</span></Empty>
      ) : (
        <>
          {error && (
            <p className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
              <span>{error.includes("404") ? t("The agent has no full catalog yet, showing the basic set.") : t("Could not load the catalog: {error}", { error })}</span>
              <Button size="xs" variant="secondary" onClick={retry}>{t("Retry")}</Button>
            </p>
          )}
          {tree ? (
            <div className="kn-scroll-auto flex flex-col overflow-y-auto" style={{ height: HEIGHT }}>
              {byCat.map(([c, items]) => {
                const isOpen = openCat === c;
                return (
                  <div key={c}>
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpenCat(isOpen ? null : c)} className="sticky top-0 z-10 flex w-full items-center gap-1.5 bg-popover py-1.5 text-left text-[12px] font-medium text-muted-foreground hover:text-foreground">
                      <ChevronRight className={cn("size-3.5 transition-transform", isOpen && "rotate-90")} />
                      <span className="flex-1 truncate">{t(c)}</span>
                      <span className="rounded-full bg-muted px-1.5 text-[10.5px] tabular-nums">{items.length.toLocaleString(numLocale())}</span>
                    </button>
                    {isOpen && <VirtualGrid count={items.length} height={168} render={(i) => cellFor(i, items)} />}
                  </div>
                );
              })}
            </div>
          ) : list.length === 0 ? (
            <Empty>{t("No icons match.")}</Empty>
          ) : (
            <VirtualGrid count={list.length} render={(i) => cellFor(i, list)} />
          )}
          <p className="text-[11px] text-muted-foreground">{t("Icons: {n} · a small dot in the corner marks an icon with a \"solid\" variant (shown when selected)", { n: (tree ? all.length : list.length).toLocaleString(numLocale()) })}</p>
        </>
      )}
    </div>
  );
}

function LobeTab({ value, onPick }: { value: string | undefined; onPick: (v: string) => void }) {
  useLanguage();
  const { catalog, loading, error, retry } = useCatalog(true);
  const [q, setQ] = useState("");
  const names = useMemo(() => Object.keys(catalog?.brands ?? {}).sort(), [catalog]);
  const list = useMemo(() => {
    const n = norm(q.trim());
    return names.filter((x) => !n || x.includes(n.replace(/\s+/g, "")) || x.includes(n.replace(/\s+/g, "-")));
  }, [names, q]);
  return (
    <div className="flex flex-col gap-2">
      <Input autoFocus size="sm" icon={<Search />} placeholder={t("Search AI brands (claude, openai, gemini…)")} aria-label={t("Search AI brands")} value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? (
        <Empty><span className="flex items-center gap-2"><Spinner label={t("Loading")} /> {t("Loading brands…")}</span></Empty>
      ) : error || !names.length ? (
        <Empty>
          <span className="flex flex-col items-center gap-2">
            {error ? t("Could not load the catalog: {error}", { error }) : t("The agent catalog has no brand section yet.")}
            <Button size="xs" variant="secondary" onClick={retry}>{t("Retry")}</Button>
          </span>
        </Empty>
      ) : list.length === 0 ? (
        <Empty>{t("No brands match.")}</Empty>
      ) : (
        <VirtualGrid count={list.length} render={(i) => {
          const n = list[i]!;
          return <CellButton key={n} label={n} on={value === `lobe:${n}`} onClick={() => onPick(`lobe:${n}`)}><LobeGlyph name={n} size={22} /></CellButton>;
        }} />
      )}
      <p className="text-[11px] text-muted-foreground">{t("Brands: {n} · colour versions keep their original colours", { n: list.length.toLocaleString(numLocale()) })}</p>
    </div>
  );
}

function BrandTab({ value, onPick }: { value: string | undefined; onPick: (v: string) => void }) {
  const names = Object.keys(BRANDS);
  return (
    <VirtualGrid count={names.length} render={(i) => {
      const n = names[i]!;
      return <CellButton key={n} label={n} on={value === n} onClick={() => onPick(n)}><Icon name={n} size={22} /></CellButton>;
    }} />
  );
}

type EmojiGroup = { name: string; slug: string; emojis: { emoji: string; name: string; slug: string }[] };

function EmojiTab({ value, onPick }: { value: string | undefined; onPick: (v: string) => void }) {
  useLanguage();
  const [groups, setGroups] = useState<EmojiGroup[] | null>(null);
  const [q, setQ] = useState("");
  const [g, setG] = useState("");
  useEffect(() => {
    let live = true;
    import("unicode-emoji-json/data-by-group.json").then((m) => live && setGroups((m.default ?? m) as unknown as EmojiGroup[]));
    return () => { live = false; };
  }, []);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (groups ?? []).filter((x) => !g || x.slug === g).flatMap((x) => x.emojis).filter((e) => !n || e.name.includes(n) || e.slug.includes(n.replace(/\s+/g, "_")));
  }, [groups, q, g]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input autoFocus size="sm" icon={<Search />} placeholder={t("Search emoji (English)…")} aria-label={t("Search emoji")} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="w-[130px] flex-none">
          <Select size="sm" aria-label={t("Emoji group")} value={g} onChange={(e) => setG(e.target.value)} options={[{ value: "", label: t("All groups") }, ...(groups ?? []).map((x) => ({ value: x.slug, label: EMOJI_GROUP_EN[x.slug] ? t(EMOJI_GROUP_EN[x.slug]!) : x.name }))]} />
        </div>
      </div>
      {!groups ? (
        <Empty><span className="flex items-center gap-2"><Spinner label={t("Loading")} /> {t("Loading emoji…")}</span></Empty>
      ) : list.length === 0 ? (
        <Empty>{t("No emoji match.")}</Empty>
      ) : (
        <VirtualGrid count={list.length} render={(i) => {
          const e = list[i]!;
          return <CellButton key={e.slug} label={e.name} on={value === e.emoji} onClick={() => onPick(e.emoji)}><span className="text-[22px] leading-none">{e.emoji}</span></CellButton>;
        }} />
      )}
    </div>
  );
}

const UPLOADS_KEY = "pd-uploaded-icons";
const readLocal = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(UPLOADS_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};
const writeLocal = (ids: string[]) => {
  try {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
};

function ImageTab({ value, onPick }: { value: string | undefined; onPick: (v: string) => void }) {
  useLanguage();
  const [ids, setIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const remote = await api.listUploads();
      setIds(remote);
      writeLocal(remote);
    } catch {
      // The agent may not list uploads: fall back to the ones this browser uploaded.
      setIds(readLocal());
    }
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") return setErr(t("Only PNG or JPEG images are accepted."));
    if (file.size > 512 * 1024) return setErr(t("The image is larger than 512 KB. Pick a smaller one."));
    setBusy(true);
    setErr(null);
    try {
      const id = await api.uploadIcon(file);
      const next = [id, ...(ids ?? []).filter((x) => x !== id)];
      setIds(next);
      writeLocal(next);
      onPick(`img:${id}`);
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 404 ? t("The agent does not support image upload yet (/api/icons returned 404).") : t("Could not upload: {error}", { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (id: string) => {
    if (armed !== id) return setArmed(id);
    setArmed(null);
    try {
      await api.deleteUpload(id);
      const next = (ids ?? []).filter((x) => x !== id);
      setIds(next);
      writeLocal(next);
      if (value === `img:${id}`) onPick("");
    } catch (e) {
      setErr(t("Could not delete: {error}", { error: e instanceof Error ? e.message : String(e) }));
    }
  };

  return (
    <div className="flex flex-col gap-2" style={{ minHeight: HEIGHT }}>
      <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <Button size="sm" variant="secondary" loading={busy} onClick={() => input.current?.click()}>{t("Upload PNG / JPEG image")}</Button>
      <p className="text-[11px] text-muted-foreground">{t("Max 512 KB, automatically scaled down to 128 px.")}</p>
      {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
      {!ids ? (
        <div className="flex items-center gap-2 py-4 text-[13px] text-muted-foreground"><Spinner label={t("Loading")} /> {t("Loading…")}</div>
      ) : ids.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-muted-foreground">{t("No images uploaded yet.")}</p>
      ) : (
        <ul className="kn-scroll-auto grid grid-cols-4 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 170 }}>
          {ids.map((id) => (
            <li key={id} className="group relative">
              <button
                type="button"
                aria-label={t("Select image {id}", { id })}
                aria-pressed={value === `img:${id}`}
                onClick={() => onPick(`img:${id}`)}
                className={cn("grid aspect-square w-full place-items-center rounded-lg border p-1 transition-colors hover:bg-muted", value === `img:${id}` && "border-primary bg-primary/10")}
              >
                <img src={uploadUrl(id)} alt="" loading="lazy" className="size-full rounded-md object-contain" />
              </button>
              <button
                type="button"
                aria-label={armed === id ? t("Click again to delete the image") : t("Delete image")}
                onClick={() => void remove(id)}
                className={cn("absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border bg-card text-destructive opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100", armed === id && "opacity-100")}
              >
                <Trash className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function describe(v: string): string {
  if (v.startsWith("app:")) return t("App: {name}", { name: v.slice(4) });
  if (v.startsWith("img:")) return t("Uploaded image");
  if (v.startsWith("lobe:")) return t("AI brand: {name}", { name: v.slice(5) });
  if (isIconName(v) || /^[a-z][a-z0-9-]{2,}$/.test(v)) return v;
  return t("Text: {text}", { text: v });
}

export function IconPicker({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const initial: Tab = !value ? "icon" : value.startsWith("app:") ? "app" : value.startsWith("img:") ? "img" : value.startsWith("lobe:") ? "lobe" : value in BRANDS ? "brand" : !isIconName(value) && !/^[a-z][a-z0-9-]{2,}$/.test(value) ? "emoji" : "icon";
  const [tab, setTab] = useState<Tab>(initial);

  const pick = (v: string | undefined) => {
    onChange(v || undefined);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => { setOpen(o); if (o) setTab(initial); }}
      side="bottom"
      align="start"
      aria-label={t("Select icon")}
      className="w-[420px] p-3"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-full items-center gap-3 rounded-[9px] border bg-card px-3 text-left text-[13.5px] transition-colors hover:bg-muted"
        >
          <span className="grid size-6 place-items-center">
            {value ? <ItemIcon icon={value} size={20} /> : <span className="text-muted-foreground">–</span>}
          </span>
          <span className="flex-1 truncate">{value ? describe(value) : t("No icon selected")}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <SegmentedControl size="sm" aria-label={t("Icon type")} value={tab} onValueChange={(v) => setTab(v as Tab)} options={TABS.map((x) => ({ ...x, label: t(x.label) }))} className="w-full" />
        {tab === "icon" && <IconTab value={value} onPick={pick} />}
        {tab === "brand" && <BrandTab value={value} onPick={pick} />}
        {tab === "lobe" && <LobeTab value={value} onPick={pick} />}
        {tab === "emoji" && <EmojiTab value={value} onPick={pick} />}
        {tab === "app" && <AppList selected={value?.startsWith("app:") ? value.slice(4) : undefined} maxHeight={HEIGHT} onPick={(a) => pick(`app:${a.bundleId}`)} />}
        {tab === "img" && <ImageTab value={value} onPick={pick} />}
        <div className="flex items-end gap-2 border-t pt-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
            {t("Or an emoji / short text")}
            <Input size="sm" value={value && !isIconName(value) && !value.startsWith("app:") && !value.startsWith("img:") && !value.startsWith("lobe:") && !/^[a-z][a-z0-9-]{2,}$/.test(value) ? value : ""} placeholder="🎵" maxLength={8} onChange={(e) => onChange(e.target.value || undefined)} />
          </label>
          <Button size="sm" variant="secondary" icon={<X />} disabled={!value} onClick={() => pick(undefined)}>{t("Clear")}</Button>
        </div>
      </div>
    </Popover>
  );
}
