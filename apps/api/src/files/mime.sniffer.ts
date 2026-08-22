/**
 * Sniffs the MIME type of a buffer based on its content (magic bytes, ZIP entries, or text).
 * Returns null if the type cannot be determined or is not in the allow list (though this only sniffs,
 * the caller does the allow list check).
 */

import * as path from 'path';

export function sniffMimeType(buffer: Buffer, filename?: string): string | null {
  if (buffer.length === 0) return null;

  // PDF: %PDF-
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return 'application/pdf';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // GIF: GIF87a or GIF89a
  if (buffer.length >= 6) {
    const sig = buffer.toString('ascii', 0, 6);
    if (sig === 'GIF87a' || sig === 'GIF89a') {
      return 'image/gif';
    }
  }

  // WebP: RIFF .... WEBP
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }

  // Legacy OLE2 (doc, xls, ppt): D0 CF 11 E0
  if (buffer.length >= 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    // We differentiate by extension because OLE2 is a container.
    // If we wanted to parse OLE2 completely it's complex, so for legacy we might trust the extension
    // if the magic matches.
    const ext = filename ? path.extname(filename).toLowerCase() : undefined;
    if (ext === '.doc') return 'application/msword';
    if (ext === '.xls') return 'application/vnd.ms-excel';
    if (ext === '.ppt') return 'application/vnd.ms-powerpoint';
    return null; // Reject if no matching extension
  }

  // ZIP (docx, xlsx, pptx, OpenDocument): PK\x03\x04
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return sniffZipContainer(buffer);
  }

  // If no magic number, check if it's valid UTF-8 text (no NUL or stray control bytes).
  if (isText(buffer)) {
    const ext = filename ? path.extname(filename).toLowerCase() : undefined;
    if (ext === '.csv') return 'text/csv';
    if (ext === '.md' || ext === '.markdown') return 'text/markdown';
    if (ext === '.txt') return 'text/plain';
    return null;
  }

  return null;
}

/** Looks for specific entries inside a ZIP buffer. */
function sniffZipContainer(buffer: Buffer): string | null {
  // A robust ZIP parser would parse the central directory.
  // For sniffing, we can often just search the buffer for uncompressed local file header names.
  // This is a heuristic but works well for identifying the format.

  // OpenDocument stores an uncompressed 'mimetype' file at the beginning.
  // The local file header for 'mimetype' starts with PK\x03\x04, then 26 bytes later is the name 'mimetype'.
  // Followed by the content (e.g. application/vnd.oasis.opendocument.text).
  const mimetypeIndex = buffer.indexOf('mimetype');
  if (mimetypeIndex !== -1 && mimetypeIndex + 8 < buffer.length) {
    // The content comes right after the extra field. For OD, the extra field length is usually 0.
    // Let's just do a substring search for the known OD mimetypes near the 'mimetype' string.
    const searchArea = buffer.toString('ascii', mimetypeIndex, Math.min(mimetypeIndex + 100, buffer.length));
    if (searchArea.includes('application/vnd.oasis.opendocument.text')) return 'application/vnd.oasis.opendocument.text';
    if (searchArea.includes('application/vnd.oasis.opendocument.spreadsheet')) return 'application/vnd.oasis.opendocument.spreadsheet';
    if (searchArea.includes('application/vnd.oasis.opendocument.presentation')) return 'application/vnd.oasis.opendocument.presentation';
  }

  // OOXML: word/document.xml, xl/workbook.xml, ppt/presentation.xml
  if (buffer.indexOf('word/document.xml') !== -1) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (buffer.indexOf('xl/workbook.xml') !== -1) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (buffer.indexOf('ppt/presentation.xml') !== -1) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }

  return null; // Not a recognized ZIP container
}

/**
 * Validates if the buffer contains valid UTF-8 text without NUL or unexpected control characters.
 */
function isText(buffer: Buffer): boolean {
  if (buffer.length === 0) return false;

  // We check the first N bytes (e.g. up to 8192) to determine if it's text.
  const limit = Math.min(buffer.length, 8192);
  let i = 0;
  while (i < limit) {
    const byte = buffer[i];

    if (byte === 0x00) return false; // NUL byte means binary

    // Control characters (except tab, LF, CR)
    if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) {
      return false;
    }

    // Basic UTF-8 validation
    if (byte < 0x80) {
      i++;
    } else if ((byte & 0xe0) === 0xc0) {
      if (i + 1 >= limit) break;
      if ((buffer[i + 1] & 0xc0) !== 0x80) return false;
      i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      if (i + 2 >= limit) break;
      if ((buffer[i + 1] & 0xc0) !== 0x80 || (buffer[i + 2] & 0xc0) !== 0x80) return false;
      i += 3;
    } else if ((byte & 0xf8) === 0xf0) {
      if (i + 3 >= limit) break;
      if (
        (buffer[i + 1] & 0xc0) !== 0x80 ||
        (buffer[i + 2] & 0xc0) !== 0x80 ||
        (buffer[i + 3] & 0xc0) !== 0x80
      )
        return false;
      i += 4;
    } else {
      return false; // Invalid UTF-8 start byte
    }
  }

  return true;
}
