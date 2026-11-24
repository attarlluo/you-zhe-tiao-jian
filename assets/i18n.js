const preferenceKey = new URL('../', import.meta.url).pathname + 'study-language';
const requested = new URL(location.href).searchParams.get('lang');
let saved;
try { saved = localStorage.getItem(preferenceKey); } catch {}

const language = ['zh', 'en'].includes(requested) ? requested : saved === 'en' ? 'en' : 'zh';
export const english = language === 'en';
export const locale = english ? 'en' : 'zh-CN';
export const t = (zh, en) => english ? en : zh;
export const minutesLabel = minutes => t(`${minutes} 分钟`, `${minutes} min`);
export const countLabel = (count, classifier, singular) =>
  t(`${count} ${classifier}`, `${count} ${singular}${count === 1 ? '' : 's'}`);

document.documentElement.lang = locale;
if (requested === language) {
  try { localStorage.setItem(preferenceKey, language); } catch {}
}

export function localizedLink(href) {
  if (language === 'zh' && requested !== 'zh') return href;
  const url = new URL(href, location.href);
  url.searchParams.set('lang', language);
  return url.href;
}

export function initLanguage() {
  if (english) {
    for (const node of document.querySelectorAll('[data-en]')) {
      node.textContent = node.dataset.en;
    }
    for (const attribute of ['alt', 'aria-label', 'content', 'placeholder']) {
      for (const node of document.querySelectorAll(`[data-en-${attribute}]`)) {
        node.setAttribute(attribute, node.getAttribute(`data-en-${attribute}`));
      }
    }
  }
  for (const anchor of document.querySelectorAll('a[href^="./"]')) {
    anchor.href = localizedLink(anchor.getAttribute('href'));
  }
  const toggle = document.querySelector('#language');
  toggle.textContent = t('English', '简体中文');
  toggle.lang = t('en', 'zh-CN');
  toggle.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.set('lang', t('en', 'zh'));
    location.assign(url);
  });
  toggle.hidden = false;
}
