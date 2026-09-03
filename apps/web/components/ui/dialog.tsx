'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './button';
import { DIALOG_SURFACE_CLASS } from './tokens';

export function Dialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (open && !node.open) {
      node.showModal();
    }

    if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog ref={ref} className={DIALOG_SURFACE_CLASS} aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId} className="font-serif text-2xl text-ink">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
      <div className="mt-6">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
