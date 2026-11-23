const motionKey = 'ml-self-study-motion';
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Set();

export const icon = name => `<svg class="ui-icon" width="18" height="18" aria-hidden="true" focusable="false"><use href="${new URL(`./lucide.svg#${name}`, import.meta.url).href}"></use></svg>`;
export const reducedMotion = () => motionPreference.matches || document.documentElement.dataset.motion === 'reduced';

export function initMotion(button, {pause='减少动效', resume='恢复动效', onChange=()=>{}} = {}) {
  let manuallyReduced = false;
  try { manuallyReduced = localStorage.getItem(motionKey) === '1'; } catch {}
  const sync = () => {
    document.documentElement.dataset.motion = manuallyReduced ? 'reduced' : 'auto';
    const quiet = reducedMotion();
    button.setAttribute('aria-pressed', String(quiet));
    button.textContent = motionPreference.matches ? '动效已随系统暂停' : quiet ? resume : pause;
    button.disabled = motionPreference.matches;
    if (quiet) animations.forEach(animation => animation.cancel());
    onChange(quiet);
  };
  button.addEventListener('click', () => {
    manuallyReduced = !manuallyReduced;
    try { localStorage.setItem(motionKey, manuallyReduced ? '1' : '0'); } catch {}
    sync();
  });
  motionPreference.addEventListener('change', sync);
  sync();
}

export function reveal(nodes, {distance = 7, duration = 190, stagger = 36} = {}) {
  if (reducedMotion()) return;
  [...nodes].forEach((node, index) => {
    if (!node || node.hidden) return;
    const animation = node.animate(
      [{opacity: .65, transform: `translateY(${distance}px)`}, {opacity: 1, transform: 'translateY(0)'}],
      {duration, delay: index * stagger, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards'}
    );
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  });
}

