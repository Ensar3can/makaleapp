export const TOAST_FLASH_KEY = 'aip.toast.flash';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  readonly id: string;
  readonly tone: ToastTone;
  readonly message: string;
}

export interface ToastStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const TONES: ReadonlySet<string> = new Set(['success', 'error', 'info']);
const EMPTY_TOASTS: readonly ToastMessage[] = [];

let toasts: readonly ToastMessage[] = EMPTY_TOASTS;
let nextId = 0;
let storageOverride: ToastStorage | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getStorage(): ToastStorage | null {
  if (storageOverride) {
    return storageOverride;
  }

  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage;
}

function parseFlash(raw: string): { tone: ToastTone; message: string } | null {
  try {
    const parsed = JSON.parse(raw) as { tone?: unknown; message?: unknown };

    if (typeof parsed.message !== 'string' || parsed.message.trim().length === 0) {
      return null;
    }

    if (typeof parsed.tone !== 'string' || !TONES.has(parsed.tone)) {
      return null;
    }

    return { tone: parsed.tone as ToastTone, message: parsed.message };
  } catch {
    return null;
  }
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): readonly ToastMessage[] {
  return toasts;
}

export function getServerToasts(): readonly ToastMessage[] {
  return EMPTY_TOASTS;
}

export function configureToastStorage(storage: ToastStorage | null): void {
  storageOverride = storage;
}

export function resetToastStore(): void {
  toasts = EMPTY_TOASTS;
  nextId = 0;
  emit();
}

export function showToast(input: { tone: ToastTone; message: string }): string {
  nextId += 1;
  const toast: ToastMessage = {
    id: `toast-${nextId}`,
    tone: input.tone,
    message: input.message,
  };
  toasts = [...toasts, toast];
  emit();
  return toast.id;
}

export function dismissToast(id: string): void {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) {
    return;
  }

  toasts = next.length === 0 ? EMPTY_TOASTS : next;
  emit();
}

export function flashToast(input: { tone: ToastTone; message: string }): void {
  const storage = getStorage();

  if (!storage) {
    showToast(input);
    return;
  }

  storage.setItem(TOAST_FLASH_KEY, JSON.stringify({ tone: input.tone, message: input.message }));
}

export function hydrateToastFlash(): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const raw = storage.getItem(TOAST_FLASH_KEY);

  if (!raw) {
    return;
  }

  storage.removeItem(TOAST_FLASH_KEY);
  const parsed = parseFlash(raw);

  if (parsed) {
    showToast(parsed);
  }
}
