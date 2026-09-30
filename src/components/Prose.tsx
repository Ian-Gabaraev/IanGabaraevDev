import { useEffect, useRef } from 'react';

const COPY_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const CHECK_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>';

/**
 * Renders build-time markdown HTML and progressively enhances code blocks with
 * copy buttons. Buttons are added after mount so hydration stays in sync with
 * the prerendered markup.
 */
export function Prose({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const cleanups: (() => void)[] = [];

    for (const block of root.querySelectorAll<HTMLElement>('.code-block')) {
      if (block.querySelector('.copy-button')) continue;
      const code = block.querySelector('code');
      if (!code) continue;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.innerHTML = COPY_ICON;

      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? '');
          button.dataset.copied = 'true';
          button.innerHTML = CHECK_ICON;
          button.setAttribute('aria-label', 'Copied');
          timers.push(
            setTimeout(() => {
              delete button.dataset.copied;
              button.innerHTML = COPY_ICON;
              button.setAttribute('aria-label', 'Copy code to clipboard');
            }, 1800),
          );
        } catch {
          /* clipboard permission denied */
        }
      };

      button.addEventListener('click', onClick);
      block.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener('click', onClick);
        button.remove();
      });
    }

    return () => {
      timers.forEach(clearTimeout);
      cleanups.forEach((fn) => fn());
    };
  }, [html]);

  return <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
