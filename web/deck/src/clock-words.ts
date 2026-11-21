/**
 * The time written in Vietnamese words (clock style "word"). Pure, no DOM.
 *
 * Spoken form is 12 hour; the part of day is returned separately (so the tile can show it as a caption).
 * Rules:
 *   :00           "X giờ"                      10:00 -> "mười giờ"
 *   :30           "X giờ rưỡi"                 10:30 -> "mười giờ rưỡi"
 *   :01-:09       "X giờ lẻ N"                 7:05  -> "bảy giờ lẻ năm"
 *   :10-:39       "X giờ <phút>"               7:15  -> "bảy giờ mười lăm", 7:35 -> "bảy giờ ba mươi lăm"
 *   :40-:59       "(X+1) giờ kém <60 - phút>"  10:55 -> "mười một giờ kém năm", 9:40 -> "mười giờ kém hai mươi"
 * "kém" starts at :40 (a choice: "kém hai mươi" is the usual way to say 9:40, while 9:35 is read "chín giờ ba mươi lăm").
 * Minute words: 10 "mười", 15 "mười lăm", 21 "hai mươi mốt", 24 "hai mươi tư", 25 "hai mươi lăm"; a lone unit uses "năm" (kém năm).
 */

const UNITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

/** 0-59 as words. A lone unit keeps its plain word ("năm"); after "mười" / "mươi" 5 -> "lăm", and after "mươi" 1 -> "mốt", 4 -> "tư". */
export function numberWords(n: number): string {
  n = Math.max(0, Math.min(59, Math.floor(n)))
  if (n < 10) return UNITS[n]
  const tens = Math.floor(n / 10)
  const u = n % 10
  if (tens === 1) return u === 0 ? 'mười' : 'mười ' + (u === 5 ? 'lăm' : UNITS[u])
  const head = UNITS[tens] + ' mươi'
  if (u === 0) return head
  return head + ' ' + (u === 1 ? 'mốt' : u === 4 ? 'tư' : u === 5 ? 'lăm' : UNITS[u])
}

/** Hour 0-23 (or beyond, wrapped) as the 12-hour spoken number: 0 and 12 -> "mười hai". */
export function hourWords(h: number): string {
  const x = ((Math.floor(h) % 12) + 12) % 12
  return x === 0 ? 'mười hai' : numberWords(x)
}

/** Part of day for an hour 0-23: đêm (0-4), sáng (5-10), trưa (11-12), chiều (13-17), tối (18-23). */
export function dayPart(h: number): 'đêm' | 'sáng' | 'trưa' | 'chiều' | 'tối' {
  const x = ((Math.floor(h) % 24) + 24) % 24
  if (x < 5) return 'đêm'
  if (x < 11) return 'sáng'
  if (x < 13) return 'trưa'
  if (x < 18) return 'chiều'
  return 'tối'
}

export interface TimeWords {
  text: string
  /** Part of day of the hour that is spoken (for "kém" the next hour). */
  part: string
}

export function timeWords(hour: number, minute: number): TimeWords {
  const h = ((Math.floor(hour) % 24) + 24) % 24
  const m = Math.max(0, Math.min(59, Math.floor(minute)))
  if (m >= 40) {
    const next = (h + 1) % 24
    return { text: hourWords(next) + ' giờ kém ' + numberWords(60 - m), part: dayPart(next) }
  }
  const base = hourWords(h) + ' giờ'
  const part = dayPart(h)
  if (m === 0) return { text: base, part }
  if (m === 30) return { text: base + ' rưỡi', part }
  if (m < 10) return { text: base + ' lẻ ' + numberWords(m), part }
  return { text: base + ' ' + numberWords(m), part }
}

const EN_UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']

/** 0-59 in English words: 7 -> "seven", 25 -> "twenty-five". */
export function numberWordsEn(n: number): string {
  n = Math.max(0, Math.min(59, Math.floor(n)))
  if (n < 20) return EN_UNITS[n]
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'][Math.floor(n / 10)]
  return n % 10 === 0 ? tens : tens + '-' + EN_UNITS[n % 10]
}

export function hourWordsEn(h: number): string {
  const x = ((Math.floor(h) % 12) + 12) % 12
  return x === 0 ? 'twelve' : EN_UNITS[x]
}

export function dayPartEn(h: number): 'night' | 'morning' | 'afternoon' | 'evening' {
  const x = ((Math.floor(h) % 24) + 24) % 24
  if (x < 5) return 'night'
  if (x < 12) return 'morning'
  if (x < 18) return 'afternoon'
  return 'evening'
}

/** English spoken time: "ten o'clock", "five past ten", "quarter past ten", "half past ten", "twenty to eleven", "quarter to eleven". */
export function timeWordsEn(hour: number, minute: number): TimeWords {
  const h = ((Math.floor(hour) % 24) + 24) % 24
  const m = Math.max(0, Math.min(59, Math.floor(minute)))
  if (m > 30) {
    const next = (h + 1) % 24
    const left = 60 - m
    return { text: (left === 15 ? 'quarter' : numberWordsEn(left)) + ' to ' + hourWordsEn(next), part: dayPartEn(next) }
  }
  const part = dayPartEn(h)
  if (m === 0) return { text: hourWordsEn(h) + " o'clock", part }
  if (m === 30) return { text: 'half past ' + hourWordsEn(h), part }
  return { text: (m === 15 ? 'quarter' : numberWordsEn(m)) + ' past ' + hourWordsEn(h), part }
}

const ZH_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 0-59 in Chinese: 7 -> "七", 15 -> "十五", 25 -> "二十五". */
export function numberWordsZh(n: number): string {
  n = Math.max(0, Math.min(59, Math.floor(n)))
  if (n < 10) return ZH_DIGITS[n]
  const tens = Math.floor(n / 10)
  const u = n % 10
  const head = tens === 1 ? '十' : ZH_DIGITS[tens] + '十'
  return u === 0 ? head : head + ZH_DIGITS[u]
}

/** Hour 0-23 as the 12-hour spoken number: 0 and 12 -> "十二". */
export function hourWordsZh(h: number): string {
  const x = ((Math.floor(h) % 12) + 12) % 12
  return x === 0 ? '十二' : numberWordsZh(x)
}

/** Part of day for an hour 0-23: 凌晨 (0-4), 早上 (5-8), 上午 (9-11), 中午 (12), 下午 (13-17), 晚上 (18-23). */
export function dayPartZh(h: number): '凌晨' | '早上' | '上午' | '中午' | '下午' | '晚上' {
  const x = ((Math.floor(h) % 24) + 24) % 24
  if (x < 5) return '凌晨'
  if (x < 9) return '早上'
  if (x < 12) return '上午'
  if (x < 13) return '中午'
  if (x < 18) return '下午'
  return '晚上'
}

/** Chinese spoken time: "十点", "十点半", "七点零五分", "九点四十分". */
export function timeWordsZh(hour: number, minute: number): TimeWords {
  const h = ((Math.floor(hour) % 24) + 24) % 24
  const m = Math.max(0, Math.min(59, Math.floor(minute)))
  const base = hourWordsZh(h) + '点'
  const part = dayPartZh(h)
  if (m === 0) return { text: base, part }
  if (m === 30) return { text: base + '半', part }
  if (m < 10) return { text: base + '零' + numberWordsZh(m) + '分', part }
  return { text: base + numberWordsZh(m) + '分', part }
}
