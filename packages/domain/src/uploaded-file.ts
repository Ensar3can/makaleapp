export const UPLOAD_LIMITS = {
  maxBytes: 10_000_000,
} as const;

export type UploadedFileInspection =
  | {
      readonly ok: true;
      readonly mimeType: string;
      readonly extension: string;
      readonly storageName: string;
      readonly byteLength: number;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

interface AllowedUploadType {
  readonly extensions: readonly string[];
  readonly magics: readonly number[][];
}

const ALLOWED_UPLOAD_TYPES: Record<string, AllowedUploadType> = {
  'application/pdf': {
    extensions: ['.pdf'],
    magics: [[0x25, 0x50, 0x44, 0x46]],
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    magics: [[0x50, 0x4b, 0x03, 0x04]],
  },
  'text/plain': {
    extensions: ['.txt', '.md'],
    magics: [],
  },
};

const BLOCKED_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.svg',
  '.js',
  '.mjs',
  '.cjs',
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.php',
  '.sh',
  '.com',
]);

export function inspectUploadedFile(input: {
  readonly originalName: string;
  readonly declaredMimeType: string;
  readonly bytes: Uint8Array;
  readonly maxBytes?: number;
}): UploadedFileInspection {
  const maxBytes = input.maxBytes ?? UPLOAD_LIMITS.maxBytes;

  if (input.bytes.byteLength === 0) {
    return { ok: false, reason: 'File is empty' };
  }

  if (input.bytes.byteLength > maxBytes) {
    return { ok: false, reason: 'File exceeds the size limit' };
  }

  const extension = fileExtension(input.originalName);

  if (extension.length === 0 || BLOCKED_EXTENSIONS.has(extension)) {
    return { ok: false, reason: 'File type is not allowed' };
  }

  const allowed = ALLOWED_UPLOAD_TYPES[input.declaredMimeType];

  if (!allowed || !allowed.extensions.includes(extension)) {
    return { ok: false, reason: 'File type is not allowed' };
  }

  if (allowed.magics.length > 0 && !allowed.magics.some((magic) => startsWithMagic(input.bytes, magic))) {
    return { ok: false, reason: 'File signature does not match the declared type' };
  }

  return {
    ok: true,
    mimeType: input.declaredMimeType,
    extension,
    storageName: `${crypto.randomUUID()}${extension}`,
    byteLength: input.bytes.byteLength,
  };
}

function fileExtension(originalName: string): string {
  const base = originalName.replaceAll('\\', '/').split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');

  if (dot <= 0 || base.includes('..')) {
    return '';
  }

  return base.slice(dot).toLowerCase();
}

function startsWithMagic(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.byteLength < magic.length) {
    return false;
  }

  return magic.every((value, index) => bytes[index] === value);
}
