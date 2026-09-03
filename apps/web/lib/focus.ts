export const MAIN_CONTENT_ID = 'main-content';

export function wrappedTabTargetIndex(
  count: number,
  currentIndex: number,
  shiftKey: boolean,
): number {
  if (count <= 0) {
    return -1;
  }

  if (shiftKey) {
    return currentIndex <= 0 ? count - 1 : currentIndex - 1;
  }

  return currentIndex >= count - 1 ? 0 : currentIndex + 1;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function listFocusable(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((node) => {
    if (node.hasAttribute('disabled') || node.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return node.tabIndex >= 0;
  });
}

export function cycleTab(event: KeyboardEvent, root: HTMLElement): void {
  if (event.key !== 'Tab') {
    return;
  }

  const items = listFocusable(root);
  if (items.length === 0) {
    event.preventDefault();
    root.focus();
    return;
  }

  const currentIndex = items.findIndex((node) => node === event.target);
  if (currentIndex === -1) {
    event.preventDefault();
    (event.shiftKey ? items[items.length - 1] : items[0])?.focus();
    return;
  }

  const atEdge = event.shiftKey ? currentIndex === 0 : currentIndex === items.length - 1;
  if (!atEdge) {
    return;
  }

  event.preventDefault();
  items[wrappedTabTargetIndex(items.length, currentIndex, event.shiftKey)]?.focus();
}
