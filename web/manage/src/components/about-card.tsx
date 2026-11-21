import { useState } from "react";
import { IconCheck as Check, IconCopy as Copy, IconExternalLink as Link } from "@tabler/icons-react";
import { Button } from "@/components/ui/knowns/button";
import { Card, CardContent } from "@/components/ui/knowns/card";
import { aboutLine, osName } from "@/lib/about";
import { getLanguage, t, useLanguage } from "@/lib/i18n";
import type { About } from "@/types";

function fmtDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(getLanguage() === "vi" ? "vi-VN" : getLanguage() === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function AboutCard({ about }: { about: About | null }) {
  useLanguage();
  const [copied, setCopied] = useState(false);
  if (!about) return null;
  const rows: [string, string | undefined][] = [
    [t("Version"), about.version],
    [t("Commit"), about.commit],
    [t("Built"), fmtDate(about.buildDate)],
    [t("System"), osName(about)],
  ];
  const links: [string, string][] = [
    [t("Source code on GitHub"), about.repo],
    [t("Releases"), `${about.repo}/releases`],
    [t("Report an issue"), `${about.repo}/issues`],
    [t("MIT License"), `${about.repo}/blob/main/LICENSE`],
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(aboutLine(about));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  return (
    <Card id="about" className="max-w-3xl">
      <CardContent className="flex flex-col gap-3 p-4">
        <h3 className="text-[15px] font-semibold">{t("About PhoneDesk")}</h3>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-[13px]">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-xs">{v}</dd></div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {links.map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[13px] underline underline-offset-2 hover:text-foreground">
              <Link className="size-3.5" />{label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 select-all truncate rounded-lg bg-muted px-2.5 py-1.5 text-xs">{aboutLine(about)}</code>
          <Button size="sm" variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={() => void copy()}>{copied ? t("Copied") : t("Copy for bug report")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
