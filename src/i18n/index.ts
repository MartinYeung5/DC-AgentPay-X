import zhTW from './zh-TW.json';
import zhCN from './zh-CN.json';
import en from './en.json';

export const locales = ['zh-TW', 'zh-CN', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'zh-TW';

export const dictionaries: Record<Locale, any> = {
  'zh-TW': zhTW, 'zh-CN': zhCN, 'en': en,
};

export function getDict(locale: string) {
  return dictionaries[(locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale];
}

export function localeLabel(l: Locale) {
  return { 'zh-TW': '繁體中文', 'zh-CN': '简体中文', 'en': 'English' }[l];
}
