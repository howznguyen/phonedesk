import markSvg from "../docs/brand/phonedesk-mark.svg" with { type: "text" };
import type { Language } from "./i18n";

const TEXT: Record<Language, { title: string; lead: string; open: string; back: string; lang: string }> = {
  en: {
    title: "Management page is only on the computer",
    lead: "For safety, PhoneDesk's management page only opens on the computer it runs on.",
    open: "Open this address on that computer:",
    back: "Back to the phone panel",
    lang: "en",
  },
  vi: {
    title: "Trang quản lý chỉ mở được trên máy tính",
    lead: "Vì an toàn, trang quản lý của PhoneDesk chỉ mở được trên chính máy tính đang chạy nó.",
    open: "Hãy mở địa chỉ này trên máy tính đó:",
    back: "Quay lại bảng điều khiển trên điện thoại",
    lang: "vi",
  },
  zh: {
    title: "管理页面只能在电脑上打开",
    lead: "为了安全，PhoneDesk 的管理页面只能在运行它的那台电脑上打开。",
    open: "请在那台电脑上打开此地址：",
    back: "返回手机控制面板",
    lang: "zh",
  },
};

/** The language of the page: the saved theme language when there is one, else the browser's Accept-Language. */
export function pickLanguage(themeLanguage: unknown, acceptLanguage: string | null): Language {
  if (themeLanguage === "vi" || themeLanguage === "en" || themeLanguage === "zh") return themeLanguage;
  if (/^\s*zh(-|;|,|$)/i.test(acceptLanguage ?? "")) return "zh";
  return /^\s*vi(-|;|,|$)/i.test(acceptLanguage ?? "") ? "vi" : "en"; // the first (preferred) language
}

/** A request for a page (not the JSON API) that the localhost guard refused. */
export function wantsPage(method: string, path: string): boolean {
  return (method === "GET" || method === "HEAD") && !path.startsWith("/api/");
}

/** The HTML 403 shown to a browser on another machine instead of raw JSON. */
export function forbiddenPage(port: number, lang: Language): string {
  const x = TEXT[lang];
  const url = `http://localhost:${Number(port) | 0}/manage/`;
  const mark = markSvg.replace(/<svg /, '<svg class="mark" aria-hidden="true" ');
  return `<!doctype html>
<html lang="${x.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${x.title} - PhoneDesk</title>
<style>
  :root { color-scheme: dark; --bg: #0b0d10; --card: #12161b; --line: #232a32; --text: #e8edf2; --dim: #9aa6b2; --key: #22d3ee; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; background: var(--bg); color: var(--text); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { width: 100%; max-width: 520px; background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 32px 28px; }
  .mark { width: 56px; height: 56px; display: block; margin-bottom: 20px; }
  h1 { margin: 0 0 10px; font-size: 22px; line-height: 1.25; letter-spacing: -0.01em; }
  p { margin: 0 0 18px; color: var(--dim); }
  code { display: block; margin: 0 0 22px; padding: 12px 14px; border-radius: 12px; background: #0b0d10; border: 1px solid var(--line); color: var(--key); font: 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; word-break: break-all; user-select: all; }
  a { color: var(--key); text-decoration: none; font-weight: 600; }
  a:hover, a:focus-visible { text-decoration: underline; }
</style>
</head>
<body>
<main>
${mark}
<h1>${x.title}</h1>
<p>${x.lead}</p>
<p>${x.open}</p>
<code>${url}</code>
<a href="/">${x.back}</a>
</main>
</body>
</html>
`;
}
