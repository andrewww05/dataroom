import * as crypto from 'crypto';
import { PrismaClient } from '../generated/prisma/client';
import { InvalidNameException } from '../http/api.exception';
import { createTestClient } from '../prisma/test-client';
import { resolveUniqueName } from './name.helper';

describe('name.helper', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createTestClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let dataRoomId: string;
  let parentId: string;

  beforeEach(async () => {
    const owner = await prisma.user.create({
      data: { email: `${crypto.randomUUID()}@test.com`, passwordHash: 'hash' },
    });
    const room = await prisma.dataRoom.create({
      data: { ownerId: owner.id, name: 'Room' },
    });
    const parent = await prisma.node.create({
      data: { dataRoomId: room.id, type: 'FOLDER', name: 'Parent' },
    });
    dataRoomId = room.id;
    parentId = parent.id;
  });

  it('accepts a name with no conflict', async () => {
    const name = await resolveUniqueName(prisma, dataRoomId, parentId, 'New Folder');
    expect(name).toBe('New Folder');
  });

  it('suffixes a conflict without an extension', async () => {
    await prisma.node.create({
      data: { dataRoomId, parentId, type: 'FOLDER', name: 'Q1 Reports' },
    });
    const name = await resolveUniqueName(prisma, dataRoomId, parentId, 'Q1 Reports');
    expect(name).toBe('Q1 Reports (2)');
  });

  it('suffixes a conflict with an extension', async () => {
    await prisma.node.create({
      data: { dataRoomId, parentId, type: 'FILE', name: 'statement.pdf' },
    });
    const name1 = await resolveUniqueName(prisma, dataRoomId, parentId, 'statement.pdf');
    expect(name1).toBe('statement (2).pdf');

    await prisma.node.create({
      data: { dataRoomId, parentId, type: 'FILE', name: 'statement (2).pdf' },
    });
    const name2 = await resolveUniqueName(prisma, dataRoomId, parentId, 'statement.pdf');
    expect(name2).toBe('statement (3).pdf');
  });

  it('treats collisions as case-insensitive', async () => {
    await prisma.node.create({
      data: { dataRoomId, parentId, type: 'FOLDER', name: 'Financials' },
    });
    const name = await resolveUniqueName(prisma, dataRoomId, parentId, 'financials');
    expect(name).toBe('financials (2)');
  });

  it('rejects empty, forbidden chars, and long names', async () => {
    await expect(resolveUniqueName(prisma, dataRoomId, parentId, ' ')).rejects.toThrow(
      InvalidNameException,
    );
    await expect(resolveUniqueName(prisma, dataRoomId, parentId, '.')).rejects.toThrow(
      InvalidNameException,
    );
    await expect(resolveUniqueName(prisma, dataRoomId, parentId, '..')).rejects.toThrow(
      InvalidNameException,
    );
    await expect(resolveUniqueName(prisma, dataRoomId, parentId, 'a/b')).rejects.toThrow(
      InvalidNameException,
    );
    await expect(resolveUniqueName(prisma, dataRoomId, parentId, 'a\\b')).rejects.toThrow(
      InvalidNameException,
    );
    await expect(resolveUniqueName(prisma, dataRoomId, parentId, 'a'.repeat(256))).rejects.toThrow(
      InvalidNameException,
    );
  });
});
