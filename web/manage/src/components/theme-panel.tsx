import { OptionCards, StyleChips, modeOptions, orientationOptions, radiusOptions } from "@/components/visual-options";
import { LANGUAGES, asLanguage, t, useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { IconArrowDown as ArrowDown, IconArrowRight as ArrowRight, IconRotate as RotateLeft, IconCheck as Check } from "@tabler/icons-react";
import { Button } from "@/components/ui/knowns/button";
import { Card } from "@/components/ui/knowns/card";
import { Field } from "@/components/ui/knowns/input";
import { SegmentedControl } from "@/components/ui/knowns/segmented-control";
import { Slider } from "@/components/ui/knowns/slider";
import { Switch } from "@/components/ui/knowns/switch";
import { ColorField } from "@/components/color-field";
import { PhonePreview, type Orientation } from "@/components/phone-preview";
import { THEME_PRESETS, presetMatches } from "@/components/theme-presets";
import { cn } from "@/lib/utils";
import { THEME_DEFAULTS, type Layout, type Theme } from "@/types";

/** Fields a preset owns (it replaces them all). */
const LOOK_FIELDS = new Set(["mode", "accent", "background", "tile", "text", "radius", "gap", "fontScale", "tileStyle", "iconScale", "iconStroke", "showLabels"]);
const OPEN_KEY = "phonedesk.manage.themeAdvancedOpen";

function readOpen(): boolean {
  try { return localStorage.getItem(OPEN_KEY) === "1"; } catch { return false; }
}
function writeOpen(v: boolean) {
  try { localStorage.setItem(OPEN_KEY, v ? "1" : "0"); } catch { /* private mode */ }
}

/** A small deck drawn from a preset's own tokens: background, tile colour, accent, radius and tile style. */
function PresetThumb({ theme }: { theme: Theme }) {
  const d = THEME_DEFAULTS;
  const accent = theme.accent ?? d.accent;
  const bg = theme.background ?? d.background;
  const tile = theme.tile ?? d.tile;
  const style = theme.tileStyle ?? d.tileStyle;
  const radius = Math.max(2, Math.round((theme.radius ?? d.radius) / 3.5));
  const gap = Math.max(2, Math.round((theme.gap ?? d.gap) / 3));
  const text = theme.text ?? (theme.mode === "light" ? "#111113" : "#f4f4f5");
  const tileStyle = (i: number): React.CSSProperties => {
    const hot = i === 0 || i === 4;
    if (style === "solid") return { background: hot ? accent : tile, borderRadius: radius };
    if (style === "outline") return { background: "transparent", borderRadius: radius, boxShadow: `inset 0 0 0 1px ${hot ? accent : "rgb(128 128 128 / 0.45)"}` };
    return { background: tile, borderRadius: radius, boxShadow: hot ? `inset 0 0 0 1px ${accent}` : "none" };
  };
  if (style === "ios") {
    // Shortcuts look: coloured squircles with a vertical gradient, white glyph, label under the tile
    const hues = [accent, "#38bdf8", "#34d399", "#f59e0b", "#f87171", "#a1a1aa"];
    return (
      <span className="grid aspect-[16/9] w-full grid-cols-3 content-center overflow-hidden rounded-lg border border-black/10 px-2.5 py-2" style={{ background: bg, gap: Math.max(3, gap) }} aria-hidden="true">
        {hues.map((c, i) => (
          <span key={i} className="flex flex-col items-center gap-0.5">
            <span className="grid w-full place-items-center" style={{ aspectRatio: "1.7", borderRadius: Math.max(radius, 6), background: `linear-gradient(180deg, color-mix(in srgb, ${c} 72%, white), ${c})` }}>
              <span className="block size-1.5 rounded-full bg-white" />
            </span>
            <span className="block h-0.5 w-3/5 rounded-full" style={{ background: text, opacity: 0.5 }} />
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="grid aspect-[16/9] w-full grid-cols-3 content-center overflow-hidden rounded-lg border border-black/10 p-2" style={{ background: bg, gap }} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="relative grid place-items-center" style={{ ...tileStyle(i), aspectRatio: "1.5" }}>
          <span className="block size-1.5 rounded-full" style={{ background: i === 0 || i === 4 ? (style === "solid" ? bg : accent) : text, opacity: i === 0 || i === 4 ? 1 : 0.55 }} />
        </span>
      ))}
    </span>
  );
}

export function ThemePanel({ layout, pageId, onChange, orientation, onOrientation }: {
  layout: Layout;
  pageId: string;
  onChange: (theme: Theme | undefined) => void;
  orientation: Orientation;
  onOrientation: (o: Orientation) => void;
}) {
  useLanguage();
  const th = layout.theme ?? {};
  const [open, setOpen] = useState(readOpen);
  const toggle = () => setOpen((v) => { writeOpen(!v); return !v; });
  // one onChange call = one undo step
  // A preset sets the look only: language, orientation and any field this page does not know are kept as they are.
  const applyPreset = (preset: Theme) => {
    const keep: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(th)) if (k === "language" || k === "orientation" || !LOOK_FIELDS.has(k)) keep[k] = v;
    onChange({ ...preset, ...keep } as Theme);
  };
  const set = (patch: Partial<Theme>) => {
    const next: Record<string, unknown> = { ...th, ...patch };
    for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
    onChange(next as Theme);
  };
  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Card className="min-h-0 overflow-y-auto p-4 kn-scroll-auto">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="t-presets" className="flex flex-col gap-2.5">
            <h2 id="t-presets" className="text-sm font-semibold">{t("Theme presets")}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((p) => {
                const on = presetMatches(th, p.theme, THEME_DEFAULTS);
                return (
                  <button
                    key={p.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => applyPreset(p.theme)}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
                      on && "border-primary bg-muted ring-1 ring-primary",
                    )}
                  >
                    <PresetThumb theme={p.theme} />
                    <span className="flex items-center justify-between gap-1.5 px-0.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium leading-tight">{t(p.name)}</span>
                        <span className="block truncate text-[11px] leading-tight text-muted-foreground">{t(p.hint)}</span>
                      </span>
                      {on && <Check className="size-4 shrink-0 text-primary" aria-label={t("In use")} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="t-basic" className="flex flex-col gap-4">
            <h2 id="t-basic" className="text-sm font-semibold">{t("Basics")}</h2>
            <Field label={t("Mode")} id="t-mode">
              <OptionCards label={t("Light or dark mode")} value={th.mode ?? THEME_DEFAULTS.mode} onChange={(v) => set({ mode: v })} options={modeOptions()} />
            </Field>
            <Field label={t("Accent color")} id="t-accent">
              <ColorField id="t-accent" value={th.accent} onChange={(v) => set({ accent: v })} fallback={THEME_DEFAULTS.accent} />
            </Field>
            <Field label={t("Corner style")} id="t-radius" hint={t("How round the tiles are. Fine-tune in More options.")}>
              <OptionCards label={t("Corner style")} cols={4} value={String([0, 8, 14, 24].reduce((p, c) => (Math.abs(c - (th.radius ?? THEME_DEFAULTS.radius)) < Math.abs(p - (th.radius ?? THEME_DEFAULTS.radius)) ? c : p)))} onChange={(v) => set({ radius: Number(v) })} options={radiusOptions(th.accent ?? THEME_DEFAULTS.accent)} />
            </Field>
            <Field label={t("Tile style")} id="t-tilestyle" hint={t("iOS: rounded colored tiles like Shortcuts, white icon, label below the tile.")}>
              <StyleChips label={t("Tile style")} follow={false} value={th.tileStyle ?? THEME_DEFAULTS.tileStyle} onChange={(v) => v && set({ tileStyle: v })} color={th.accent ?? THEME_DEFAULTS.accent} />
            </Field>
            <Field label={t("Phone orientation")} id="t-orient" hint={t("Landscape: a grid made for a phone held sideways, it rotates when held upright.")}>
              <OptionCards label={t("Phone orientation")} value={th.orientation ?? THEME_DEFAULTS.orientation} onChange={(v) => set({ orientation: v })} options={orientationOptions()} />
            </Field>
            <Field label={t("Temperature unit")} id="t-temp" hint={t("Every temperature on the phone follows this, whatever unit the source reports.")}>
              <SegmentedControl
                size="sm"
                aria-label={t("Temperature unit")}
                value={th.temperatureUnit ?? "c"}
                onValueChange={(v) => set({ temperatureUnit: v === "f" ? "f" : undefined })}
                options={[{ value: "c", label: "°C" }, { value: "f", label: "°F" }]}
              />
            </Field>
            <Field label={t("Updates")} id="t-update" hint={t("Looks for a newer PhoneDesk release on GitHub. Nothing is installed automatically.")}>
              <div className="flex items-center gap-3">
                <Switch id="t-update" checked={th.updateCheck !== false} onCheckedChange={(v) => set({ updateCheck: v ? undefined : false })} aria-label={t("Check for updates daily")} />
                <label htmlFor="t-update" className="text-[13px]">{t("Check for updates daily")}</label>
              </div>
            </Field>
            <Field label={t("Language")} id="t-lang" hint={t("Language of this page and of the phone overlay.")}>
              <SegmentedControl
                size="sm"
                aria-label={t("Language")}
                value={asLanguage(th.language)}
                onValueChange={(v) => set({ language: v === "vi" || v === "zh" ? v : "en" })}
                options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
              />
            </Field>
          </section>

          <section aria-labelledby="t-more" className="flex flex-col gap-4 border-t pt-4">
            <button
              type="button"
              id="t-more"
              aria-expanded={open}
              aria-controls="t-more-body"
              onClick={toggle}
              className="flex items-center justify-between gap-2 rounded-md text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span>{t("More options")}</span>
              {open ? <ArrowDown className="size-4 text-muted-foreground" /> : <ArrowRight className="size-4 text-muted-foreground" />}
            </button>
            {open && (
              <div id="t-more-body" className="flex flex-col gap-4">
                <Field label={t("Background color")} id="t-bg">
                  <ColorField id="t-bg" value={th.background} onChange={(v) => set({ background: v })} fallback={THEME_DEFAULTS.background} withText />
                </Field>
                <Field label={t("Tile color")} id="t-tile">
                  <ColorField id="t-tile" value={th.tile} onChange={(v) => set({ tile: v })} fallback={THEME_DEFAULTS.tile} withText />
                </Field>
                <Field label={t("Text color")} id="t-text">
                  <ColorField id="t-text" value={th.text} onChange={(v) => set({ text: v })} fallback="#f4f4f5" noneLabel={t("Auto")} withText />
                </Field>
                <Slider label={t("Corner radius (px)")} min={0} max={40} step={1} value={th.radius ?? THEME_DEFAULTS.radius} onValueChange={(v) => set({ radius: v })} />
                <Slider label={t("Tile gap (px)")} min={0} max={40} step={1} value={th.gap ?? THEME_DEFAULTS.gap} onValueChange={(v) => set({ gap: v })} />
                <Slider label={t("Text size")} min={0.5} max={2} step={0.05} value={th.fontScale ?? THEME_DEFAULTS.fontScale}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  onValueChange={(v) => set({ fontScale: Math.round(v * 100) / 100 })} />
                <Slider label={t("Icon stroke weight")} min={1} max={3} step={0.25} value={th.iconStroke ?? THEME_DEFAULTS.iconStroke}
                  formatValue={(v) => v.toFixed(2).replace(/\.?0+$/, "")}
                  onValueChange={(v) => set({ iconStroke: Math.round(v * 100) / 100 })} />
                <Slider label={t("Icon size")} min={0.5} max={2} step={0.05} value={th.iconScale ?? THEME_DEFAULTS.iconScale}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  onValueChange={(v) => set({ iconScale: Math.round(v * 100) / 100 })} />
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="t-labels" className="text-[13px] font-medium">{t("Show label under the icon")}</label>
                  <Switch id="t-labels" checked={th.showLabels ?? THEME_DEFAULTS.showLabels} onCheckedChange={(v) => set({ showLabels: v })} aria-label={t("Show label")} />
                </div>
                <Button size="sm" variant="secondary" icon={<RotateLeft />} onClick={() => onChange(undefined)} className="self-start">{t("Reset to defaults")}</Button>
              </div>
            )}
          </section>
        </div>
      </Card>
      <div className="min-h-0 min-w-0">
        <PhonePreview layout={layout} pageId={pageId} selectedId={null} orientation={orientation} onOrientation={onOrientation} />
      </div>
    </div>
  );
}
