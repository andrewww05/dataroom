import { Prisma } from '../generated/prisma/client';
import { InvalidNameException } from '../http/api.exception';

/**
 * Trims and validates a node name, then ensures it is unique within its parent folder.
 * If a collision exists (case-insensitive), it appends a suffix like " (2)" before the extension.
 * 
 * BR-020: One shared implementation for create, rename, upload, move and copy.
 */
export async function resolveUniqueName(
  tx: Prisma.TransactionClient,
  dataRoomId: string,
  parentId: string | null,
  name: string,
  excludeId?: string,
): Promise<string> {
  const trimmed = name.trim();
  
  if (
    !trimmed ||
    trimmed === '.' ||
    trimmed === '..' ||
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.length > 255
  ) {
    throw new InvalidNameException();
  }

  let candidate = trimmed;
  let counter = 1;

  while (true) {
    const existing = await tx.node.findFirst({
      where: {
        dataRoomId,
        parentId,
        name: {
          equals: candidate,
          mode: 'insensitive',
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    counter++;
    const lastDot = trimmed.lastIndexOf('.');
    if (lastDot > 0 && lastDot < trimmed.length - 1) {
      const stem = trimmed.slice(0, lastDot);
      const ext = trimmed.slice(lastDot);
      candidate = `${stem} (${counter})${ext}`;
    } else {
      candidate = `${trimmed} (${counter})`;
    }

    if (candidate.length > 255) {
      throw new InvalidNameException();
    }
  }
}
