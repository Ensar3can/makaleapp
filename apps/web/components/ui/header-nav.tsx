'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cycleTab } from '../../lib/focus';
import { Button } from './button';
import {
  HEADER_NAV_DESKTOP_CLASS,
  HEADER_NAV_OVERLAY_CLASS,
  HEADER_NAV_PANEL_CLASS,
  HEADER_NAV_TOGGLE_CLASS,
} from './tokens';

const DESKTOP_NAV_QUERY = '(min-width: 1024px)';

export function HeaderNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    const onChange = () => {
      if (media.matches) {
        setOpen(false);
      }
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        toggleRef.current?.focus();
        wasOpen.current = false;
      }
      return;
    }

    wasOpen.current = true;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      const panel = panelRef.current;
      if (panel) {
        cycleTab(event, panel);
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="ml-auto flex shrink-0 items-center">
      <nav className={HEADER_NAV_DESKTOP_CLASS} aria-label="Primary">
        {children}
      </nav>
      <Button
        ref={toggleRef}
        type="button"
        variant="ghost"
        className={HEADER_NAV_TOGGLE_CLASS}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Close' : 'Menu'}
      </Button>
      {open ? (
        <div className="lg:hidden">
          <button
            type="button"
            className={HEADER_NAV_OVERLAY_CLASS}
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id={panelId}
            className={HEADER_NAV_PANEL_CLASS}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-title`}
            tabIndex={-1}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-serif text-lg font-semibold text-navy" id={`${panelId}-title`}>
                Menu
              </p>
              <Button ref={closeRef} type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <nav aria-label="Primary">{children}</nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
