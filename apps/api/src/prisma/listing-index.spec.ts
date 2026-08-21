import { randomUUID } from 'node:crypto';

import { PrismaClient } from '../generated/prisma/client';
import { createTestClient } from './test-client';

/**
 * FR-NAV-030 — a keyset page of one folder's children walks the listing index and needs no sort,
 * so page 500 costs what page 1 costs. Asserted on the query plan, because that is the only
 * observable form the guarantee has before there is an endpoint to time.
 *
 * Requires the compose stack and an applied migration.
 */
describe('FR-NAV-030 the listing index', () => {
  const LISTING_INDEX = 'Node_dataRoomId_parentId_type_name_id_idx';
  const ROWS = 4_000;

  let prisma: PrismaClient;
  let userId: string;
  let dataRoomId: string;
  let rootId: string;

  beforeAll(async () => {
    prisma = createTestClient();

    const user = await prisma.user.create({
      data: { email: `${randomUUID()}@example.test`, passwordHash: 'not-a-real-hash' },
    });
    userId = user.id;

    const dataRoom = await prisma.dataRoom.create({ data: { ownerId: userId, name: 'Big room' } });
    dataRoomId = dataRoom.id;

    const root = await prisma.node.create({
      data: { dataRoomId, parentId: null, type: 'FOLDER', name: 'Big room' },
    });
    rootId = root.id;

    // Enough rows that a sequential scan is not the cheaper plan, in a mix of folders and files.
    await prisma.node.createMany({
      data: Array.from({ length: ROWS }, (_, i) => ({
        dataRoomId,
        parentId: rootId,
        type: i % 4 === 0 ? ('FOLDER' as const) : ('FILE' as const),
        name: `item-${String(i).padStart(6, '0')}`,
      })),
    });

    await prisma.$executeRawUnsafe('ANALYZE "Node"');
  }, 120_000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  interface PlanNode {
    'Node Type': string;
    'Index Name'?: string;
    'Index Cond'?: string;
    Filter?: string;
    Plans?: PlanNode[];
  }

  /** Every node in the plan tree, flattened — the assertions below are about the whole shape. */
  function flatten(node: PlanNode): PlanNode[] {
    return [node, ...(node.Plans ?? []).flatMap(flatten)];
  }

  /** The plan for one keyset page, in the order FR-NAV-030 specifies: folders first, then name. */
  async function planForKeysetPage(): Promise<PlanNode[]> {
    const rows = await prisma.$queryRawUnsafe<{ 'QUERY PLAN': unknown }[]>(
      `EXPLAIN (FORMAT JSON)
       SELECT "id", "type", "name"
         FROM "Node"
        WHERE "dataRoomId" = $1
          AND "parentId" = $2
          AND ("type", "name", "id") > ($3::"NodeType", $4, $5)
        ORDER BY "type", "name", "id"
        LIMIT 100`,
      dataRoomId,
      rootId,
      'FOLDER',
      'item-000500',
      randomUUID(),
    );

    const raw = rows[0]['QUERY PLAN'];
    const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as { Plan: PlanNode }[];

    return flatten(parsed[0].Plan);
  }

  it('walks the listing index', async () => {
    const nodes = await planForKeysetPage();
    const scan = nodes.find((n) => n['Index Name'] !== undefined);

    expect(scan?.['Index Name']).toBe(LISTING_INDEX);
    expect(scan?.['Node Type']).toMatch(/Index (Only )?Scan/);
  });

  it('needs no sort step, and never falls back to a sequential scan', async () => {
    const nodeTypes = (await planForKeysetPage()).map((n) => n['Node Type']);

    // Guards the assertions below: an unparsed plan would be an empty list, and every
    // `not.toContain` would then pass for the wrong reason.
    expect(nodeTypes).toContain('Limit');
    expect(nodeTypes).not.toContain('Sort');
    expect(nodeTypes).not.toContain('Incremental Sort');
    expect(nodeTypes).not.toContain('Seq Scan');
  });

  it('bounds the scan by Data Room and parent rather than filtering rows out', async () => {
    // A second Data Room must not widen the range the query walks, so both columns belong in the
    // index condition — reaching them through a post-scan Filter would mean reading other rooms.
    const nodes = await planForKeysetPage();
    const scan = nodes.find((n) => n['Index Cond'] !== undefined);

    expect(scan?.['Index Cond']).toContain('dataRoomId');
    expect(scan?.['Index Cond']).toContain('parentId');
    expect(scan?.Filter).toBeUndefined();
  });

  it('sorts folders before files without naming either value', async () => {
    // Its own small parent: the big folder holds a thousand folders, so any bounded page of it
    // would be folders only and prove nothing about the boundary.
    const parent = await prisma.node.create({
      data: { dataRoomId, parentId: rootId, type: 'FOLDER', name: 'mixed' },
    });
    await prisma.node.createMany({
      data: [
        { dataRoomId, parentId: parent.id, type: 'FILE', name: 'a-file.pdf' },
        { dataRoomId, parentId: parent.id, type: 'FOLDER', name: 'z-folder' },
        { dataRoomId, parentId: parent.id, type: 'FILE', name: 'm-file.pdf' },
        { dataRoomId, parentId: parent.id, type: 'FOLDER', name: 'b-folder' },
      ],
    });

    const children = await prisma.node.findMany({
      where: { dataRoomId, parentId: parent.id },
      orderBy: [{ type: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: { type: true, name: true },
    });

    expect(children.map((c) => c.name)).toEqual([
      'b-folder',
      'z-folder',
      'a-file.pdf',
      'm-file.pdf',
    ]);
  });
});
