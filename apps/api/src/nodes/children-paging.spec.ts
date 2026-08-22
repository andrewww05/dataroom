import { randomUUID } from 'node:crypto';

import { API_PREFIX, type FsNode, type NodeType, type Page } from '@dataroom/shared';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../prisma/prisma.service';
import { createTestApp } from '../testing/test-app';
import { childrenPageQuery } from './nodes.service';

/**
 * FR-NAV-030 — the order, the walk and the cost of a page of children.
 *
 * The rows are seeded straight through Prisma: no write route exists until slice 5.
 * Requires the compose stack and an applied migration.
 */
describe('FR-NAV-030 a folder’s children', () => {
  const LISTING_INDEX = 'Node_dataRoomId_parentId_type_name_id_idx';
  const FOLDERS = 100;
  const FILES = 150;

  let app: INestApplication;
  let prisma: PrismaService;

  const run = randomUUID().slice(0, 8);

  let token: string;
  let dataRoomId: string;
  let rootId: string;
  let mixedId: string;
  let emptyId: string;
  let exactId: string;
  let fileId: string;
  /** A folder large enough that a sequential scan is not the cheaper plan for a page of it. */
  let bigId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const mine = await signUp(`paging-mine-${run}`);
    token = mine.token;
    dataRoomId = mine.dataRoomId;
    rootId = mine.rootId;

    mixedId = await folder(dataRoomId, rootId, 'mixed');
    emptyId = await folder(dataRoomId, rootId, 'empty');
    exactId = await folder(dataRoomId, rootId, 'exactly-three');

    await prisma.node.createMany({
      data: ['a', 'b', 'c'].map((name) => ({
        dataRoomId,
        parentId: exactId,
        type: 'FOLDER' as const,
        name,
      })),
    });

    // 250 rows: enough that the default page of 100 walks in three, the last one short.
    await prisma.node.createMany({
      data: [
        ...Array.from({ length: FOLDERS }, (_, i) => ({
          dataRoomId,
          parentId: mixedId,
          type: 'FOLDER' as const,
          name: `folder-${String(i).padStart(4, '0')}`,
        })),
        ...Array.from({ length: FILES }, (_, i) => ({
          dataRoomId,
          parentId: mixedId,
          type: 'FILE' as const,
          name: `file-${String(i).padStart(4, '0')}.pdf`,
          sizeBytes: BigInt(1_024 * (i + 1)),
          mimeType: 'application/pdf',
        })),
      ],
    });

    const file = await prisma.node.create({
      data: {
        dataRoomId,
        parentId: rootId,
        type: 'FILE',
        name: 'lonely.pdf',
        sizeBytes: 42n,
        mimeType: 'application/pdf',
        storageKey: `${dataRoomId}/lonely`,
      },
      select: { id: true },
    });
    fileId = file.id;

    // A second Data Room whose names sort into the middle of every page above.
    const theirs = await signUp(`paging-theirs-${run}`);
    const theirMixed = await folder(theirs.dataRoomId, theirs.rootId, 'mixed');
    await prisma.node.createMany({
      data: [
        {
          dataRoomId: theirs.dataRoomId,
          parentId: theirMixed,
          type: 'FOLDER' as const,
          name: 'folder-0050',
        },
        {
          dataRoomId: theirs.dataRoomId,
          parentId: theirMixed,
          type: 'FILE' as const,
          name: 'file-0050.pdf',
        },
        // Same parent id is impossible across rooms, but a row in the other room whose *name* lands
        // mid-page is exactly what a missing `dataRoomId` predicate would let through.
        {
          dataRoomId: theirs.dataRoomId,
          parentId: theirs.rootId,
          type: 'FOLDER' as const,
          name: 'folder-0051',
        },
      ],
    });

    // The plan assertions need a folder where the index is genuinely the cheaper plan: at 250 rows
    // Postgres reads the table sequentially and is right to, whatever the query looks like.
    bigId = await folder(dataRoomId, rootId, 'big');
    await prisma.node.createMany({
      data: Array.from({ length: 4_000 }, (_, i) => ({
        dataRoomId,
        parentId: bigId,
        type: i % 4 === 0 ? ('FOLDER' as const) : ('FILE' as const),
        name: `item-${String(i).padStart(6, '0')}`,
      })),
    });

    await prisma.$executeRawUnsafe('ANALYZE "Node"');
  }, 120_000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: run } } });
    await app.close();
  });

  async function signUp(
    slug: string,
  ): Promise<{ token: string; dataRoomId: string; rootId: string }> {
    const response = await request(app.getHttpServer())
      .post(`/${API_PREFIX}/auth/signup`)
      .send({ email: `${slug}@example.test`, password: 'correct horse battery' })
      .expect(201);

    return {
      token: response.body.token,
      dataRoomId: response.body.dataRoom.id,
      rootId: response.body.dataRoom.rootId,
    };
  }

  async function folder(roomId: string, parentId: string, name: string): Promise<string> {
    const row = await prisma.node.create({
      data: { dataRoomId: roomId, parentId, type: 'FOLDER', name },
      select: { id: true },
    });

    return row.id;
  }

  function children(id: string, query: Record<string, string | number> = {}) {
    return request(app.getHttpServer())
      .get(`/${API_PREFIX}/nodes/${id}/children`)
      .query(query)
      .set('Authorization', `Bearer ${token}`);
  }

  /** Every page of a folder, cursor by cursor, plus how many requests it took. */
  async function walk(
    id: string,
    query: Record<string, string | number> = {},
  ): Promise<{ items: FsNode[]; pages: number; lastCursor: string | null }> {
    const items: FsNode[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const response = await children(id, cursor === null ? query : { ...query, cursor }).expect(
        200,
      );
      const page = response.body as Page<FsNode>;

      items.push(...page.items);
      cursor = page.nextCursor;
      pages += 1;

      // A runaway cursor would otherwise hang the suite rather than fail it.
      expect(pages).toBeLessThanOrEqual(10);
    } while (cursor !== null);

    return { items, pages, lastCursor: cursor };
  }

  it('orders folders before files, then by name ascending', async () => {
    const first = (await children(mixedId).expect(200)).body as Page<FsNode>;

    expect(first.items).toHaveLength(100);
    expect(first.items.every((item) => item.type === 'FOLDER')).toBe(true);
    expect(first.items.map((item) => item.name)).toEqual(
      [...first.items.map((item) => item.name)].sort(),
    );
    expect(first.nextCursor).not.toBeNull();
  });

  it('walks 250 rows in three pages with no row repeated or skipped', async () => {
    const { items, pages } = await walk(mixedId);

    expect(pages).toBe(3);
    expect(items).toHaveLength(FOLDERS + FILES);
    expect(new Set(items.map((item) => item.id)).size).toBe(FOLDERS + FILES);

    // The concatenated walk is exactly the folder's children, in the specified order.
    const expected = await prisma.node.findMany({
      where: { dataRoomId, parentId: mixedId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });
    expect(items.map((item) => item.id)).toEqual(expected.map((row) => row.id));

    // Folders first across the whole walk, not merely within a page.
    const firstFile = items.findIndex((item) => item.type === 'FILE');
    expect(firstFile).toBe(FOLDERS);
    expect(items.slice(firstFile).every((item) => item.type === 'FILE')).toBe(true);
  });

  it('resumes exactly after the last row of the previous page', async () => {
    const first = (await children(mixedId, { limit: 7 }).expect(200)).body as Page<FsNode>;
    const second = (await children(mixedId, { limit: 7, cursor: first.nextCursor! }).expect(200))
      .body as Page<FsNode>;

    const all = await prisma.node.findMany({
      where: { dataRoomId, parentId: mixedId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      take: 14,
      select: { id: true },
    });

    expect(first.items).toHaveLength(7);
    expect([...first.items, ...second.items].map((item) => item.id)).toEqual(
      all.map((row) => row.id),
    );
  });

  it('reports nextCursor null on the last page rather than an empty page after it', async () => {
    // The boundary worth asserting: a folder read with a limit that exactly matches its row count
    // still ends here, because `take: limit + 1` found no further row.
    const exact = (await children(exactId, { limit: 3 }).expect(200)).body as Page<FsNode>;

    expect(exact.items).toHaveLength(3);
    expect(exact.nextCursor).toBeNull();

    // And one row short of that count does hand back a cursor onto the remaining row.
    const short = (await children(exactId, { limit: 2 }).expect(200)).body as Page<FsNode>;
    expect(short.nextCursor).not.toBeNull();

    const rest = (await children(exactId, { limit: 2, cursor: short.nextCursor! }).expect(200))
      .body as Page<FsNode>;
    expect(rest.items).toHaveLength(1);
    expect(rest.nextCursor).toBeNull();
  });

  it('carries no total count anywhere in the body', async () => {
    const response = await children(mixedId).expect(200);

    expect(Object.keys(response.body).sort()).toEqual(['items', 'nextCursor']);
    for (const item of response.body.items as FsNode[]) {
      expect(Object.keys(item).sort()).toEqual([
        'createdAt',
        'id',
        'mimeType',
        'name',
        'parentId',
        'sizeBytes',
        'type',
        'updatedAt',
      ]);
    }
  });

  it('narrows to folders and still pages', async () => {
    const { items, pages } = await walk(mixedId, { type: 'FOLDER', limit: 40 });

    expect(items).toHaveLength(FOLDERS);
    expect(pages).toBe(3);
    expect(items.every((item) => item.type === 'FOLDER')).toBe(true);
  });

  it('narrows to files, where the cursor sits on the last kind', async () => {
    const { items } = await walk(mixedId, { type: 'FILE', limit: 100 });

    expect(items).toHaveLength(FILES);
    expect(items.every((item) => item.type === 'FILE')).toBe(true);
    expect(items[0].sizeBytes).toBe(1_024);
  });

  it('rejects an unusable limit and an unknown type by name', async () => {
    for (const query of [{ limit: 0 }, { limit: -1 }, { limit: 101 }, { limit: 'abc' }]) {
      const response = await children(mixedId, query).expect(400);

      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(response.body.details)).toEqual(['limit']);
    }

    const badType = await children(mixedId, { type: 'SYMLINK' }).expect(400);
    expect(badType.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(badType.body.details)).toEqual(['type']);
  });

  it('rejects a cursor this endpoint did not issue', async () => {
    for (const cursor of ['not base64!!', 'eyJ0IjoiU1lNTElOSyJ9']) {
      const response = await children(mixedId, { cursor }).expect(400);

      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(response.body.details)).toEqual(['cursor']);
    }
  });

  it('rejects an unknown query field rather than ignoring it', async () => {
    // The global pipe runs `forbidNonWhitelisted`, so a misspelled `?limits=10` is heard about.
    const response = await children(mixedId, { limits: 10 }).expect(400);

    expect(response.body.code).toBe('VALIDATION_FAILED');
  });

  it('answers an empty folder with no rows and no cursor', async () => {
    const response = await children(emptyId).expect(200);

    expect(response.body).toEqual({ items: [], nextCursor: null });
  });

  it('answers a file with no rows and no cursor, not an error', async () => {
    const response = await children(fileId).expect(200);

    expect(response.body).toEqual({ items: [], nextCursor: null });
  });

  it('never returns a row from another Data Room whose name sorts mid-page', async () => {
    const { items } = await walk(mixedId);
    const ids = new Set(items.map((item) => item.id));

    const foreign = await prisma.node.findMany({
      where: { dataRoomId: { not: dataRoomId }, name: { startsWith: 'folder-005' } },
      select: { id: true, name: true },
    });

    expect(foreign.length).toBeGreaterThan(0);
    for (const row of foreign) expect(ids.has(row.id)).toBe(false);
    // The names do collide, which is what makes the assertion above worth making.
    expect(items.some((item) => item.name === 'folder-0050')).toBe(true);
  });

  interface PlanNode {
    'Node Type': string;
    'Index Name'?: string;
    'Index Cond'?: string;
    'Actual Rows'?: number;
    'Rows Removed by Filter'?: number;
    Filter?: string;
    Plans?: PlanNode[];
  }

  function flatten(node: PlanNode): PlanNode[] {
    return [node, ...(node.Plans ?? []).flatMap(flatten)];
  }

  type PageArgs = { limit: number; type?: NodeType; after?: { t: NodeType; n: string; i: string } };

  async function explain(options: string, parentId: string, page: PageArgs): Promise<PlanNode[]> {
    const query = childrenPageQuery(dataRoomId, parentId, page);
    const rows = await prisma.$queryRawUnsafe<{ 'QUERY PLAN': unknown }[]>(
      `EXPLAIN (${options}) ${query.text}`,
      ...query.values,
    );

    const raw = rows[0]['QUERY PLAN'];
    const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as { Plan: PlanNode }[];

    return flatten(parsed[0].Plan);
  }

  /**
   * The plan for the SQL the service itself issues: `childrenPageQuery` is the query `listChildren`
   * runs, explained with its own parameters rather than retyped here — a copy would prove a plan the
   * app never runs.
   */
  const planForServiceQuery = (parentId: string, page: PageArgs): Promise<PlanNode[]> =>
    explain('FORMAT JSON', parentId, page);

  /** The same query, run, so the assertions are about rows actually read. */
  const analyseServiceQuery = (parentId: string, page: PageArgs): Promise<PlanNode[]> =>
    explain('ANALYZE, FORMAT JSON', parentId, page);

  it('plans one keyset page as an index scan with no sort and no sequential scan', async () => {
    const nodes = await planForServiceQuery(bigId, {
      limit: 100,
      after: { t: 'FOLDER', n: 'item-000500', i: randomUUID() },
    });
    const nodeTypes = nodes.map((node) => node['Node Type']);

    // Guards the negatives below: an unparsed plan would be an empty list and they would all pass.
    expect(nodeTypes).toContain('Limit');
    expect(nodeTypes).not.toContain('Sort');
    expect(nodeTypes).not.toContain('Incremental Sort');
    expect(nodeTypes).not.toContain('Seq Scan');

    const scan = nodes.find((node) => node['Index Name'] !== undefined);
    expect(scan?.['Index Name']).toBe(LISTING_INDEX);
    expect(scan?.['Node Type']).toMatch(/Index (Only )?Scan/);
  });

  it('starts the scan at the cursor instead of filtering the rows before it', async () => {
    // The whole reason this one query is raw SQL: with the tuple in `Index Cond`, the scan opens at
    // the cursor. As an `OR` of three branches — Prisma's only form, its enum filter having no `gt`
    // — it lands in `Filter` instead, and a deep page pays for every row before it.
    const nodes = await planForServiceQuery(bigId, {
      limit: 100,
      after: { t: 'FILE', n: 'item-003000', i: randomUUID() },
    });
    const scan = nodes.find((node) => node['Index Cond'] !== undefined);

    // Both scope columns bound the scan, so a second Data Room cannot widen what a page reads.
    expect(scan?.['Index Cond']).toContain('dataRoomId');
    expect(scan?.['Index Cond']).toContain('parentId');
    expect(scan?.['Index Cond']).toContain('ROW');
    expect(scan?.Filter).toBeUndefined();
  });

  it('reads no more rows for a page at the end of a large folder than for the first', async () => {
    /** What the scan actually read, rather than what the planner estimated it would. */
    const rowsRead = async (name: string): Promise<{ read: number; discarded: number }> => {
      const nodes = await analyseServiceQuery(bigId, {
        limit: 100,
        after: { t: 'FILE', n: name, i: randomUUID() },
      });
      const scan = nodes.find((node) => node['Index Cond'] !== undefined);

      return {
        read: scan?.['Actual Rows'] ?? Number.NaN,
        discarded: scan?.['Rows Removed by Filter'] ?? 0,
      };
    };

    const first = await rowsRead('item-000000');
    const last = await rowsRead('item-003900');

    // 101 rows either way: the page plus the one row that decides the next cursor. The `OR` form
    // this replaced discarded every row before the cursor, so `last.discarded` grew with depth.
    expect(first.read).toBeLessThanOrEqual(101);
    expect(last.read).toBeLessThanOrEqual(101);
    expect(first.discarded).toBe(0);
    expect(last.discarded).toBe(0);
  });
});
