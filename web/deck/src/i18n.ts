import { VI } from './i18n-vi'
import { ZH } from './i18n-zh'

/**
 * Tiny dictionary i18n. English is the default; Vietnamese and Chinese come from layout.theme.language
 * ('en' | 'vi' | 'zh', missing = 'en').
 * The English text is the key: t('Cancel') returns the Vietnamese/Chinese entry when that language is on and the
 * text itself otherwise.
 * Placeholders are {0}, {1}...: t('{0} min ago', 5). Module level constants must hold English text and be passed through t() at use time.
 */

export type Lang = 'en' | 'vi' | 'zh'
const KEY = 'pd.lang'
const DICTS: { [lang: string]: { [en: string]: string } } = { vi: VI, zh: ZH }

/** Used until a layout arrives (the pairing screen) and whenever a layout carries no language: the device's own language. */
const FALLBACK: Lang = (() => {
  try {
    const n = (window.navigator.language || '').toLowerCase()
    return n.startsWith('zh') ? 'zh' : n.startsWith('vi') ? 'vi' : 'en'
  } catch (e) {
    return 'en'
  }
})()

let cur: Lang = 'en'
try {
  const s = window.localStorage.getItem(KEY)
  cur = s === 'vi' || s === 'zh' || s === 'en' ? s : FALLBACK
} catch (e) {
  /* storage is optional */
}

export const getLang = (): Lang => cur

/** Called by the deck whenever the layout (or its theme) changes; remembered so the pairing screen uses the same language. */
export function setLang(l: unknown) {
  const next: Lang = l === 'vi' ? 'vi' : l === 'zh' ? 'zh' : l === 'en' ? 'en' : FALLBACK
  if (next === cur) return
  cur = next
  try {
    window.localStorage.setItem(KEY, next)
  } catch (e) {
    /* ignore */
  }
}

export function t(en: string, a?: string | number, b?: string | number, c?: string | number): string {
  const dict = DICTS[cur]
  let s = dict && Object.prototype.hasOwnProperty.call(dict, en) ? dict[en] : en
  const args = [a, b, c]
  for (let i = 0; i < 3; i++) {
    if (args[i] !== undefined) s = s.split('{' + i + '}').join(String(args[i]))
  }
  return s
}

/** BCP 47 tag for Intl and toLocaleString. */
export const locale = (): string => (cur === 'vi' ? 'vi-VN' : cur === 'zh' ? 'zh-CN' : 'en-US')
