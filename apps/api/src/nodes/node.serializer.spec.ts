import { randomUUID } from 'node:crypto';

import { toFsNode, toNodeStats, type FsNodeRow } from './node.serializer';

/** The one `BigInt` boundary — so `JSON.stringify` never meets one further out (docs/03). */
describe('the FsNode serialiser', () => {
  const createdAt = new Date('2026-03-01T10:20:30.400Z');
  const updatedAt = new Date('2026-03-02T00:00:00.000Z');

  const folder: FsNodeRow = {
    id: randomUUID(),
    parentId: randomUUID(),
    type: 'FOLDER',
    name: 'Financials',
    sizeBytes: null,
    mimeType: null,
    createdAt,
    updatedAt,
  };

  it('serialises a folder with the file fields null rather than absent', () => {
    const node = toFsNode(folder);

    expect(node.sizeBytes).toBeNull();
    expect(node.mimeType).toBeNull();
    // Present as keys: a client reads the same shape for both kinds (FR-NAV-020).
    expect(Object.keys(node).sort()).toEqual([
      'createdAt',
      'id',
      'mimeType',
      'name',
      'parentId',
      'sizeBytes',
      'type',
      'updatedAt',
    ]);
  });

  it('renders both timestamps as ISO 8601 strings', () => {
    const node = toFsNode(folder);

    expect(node.createdAt).toBe('2026-03-01T10:20:30.400Z');
    expect(node.updatedAt).toBe('2026-03-02T00:00:00.000Z');
  });

  it('carries a size beyond 32 bits across exactly, as a JSON number', () => {
    // 5 GiB — past 2^32 and nowhere near 2^53, which is why the contract says number (FR-ACCT-010).
    const sizeBytes = 5_368_709_120n;
    const node = toFsNode({ ...folder, type: 'FILE', sizeBytes, mimeType: 'application/pdf' });

    expect(node.sizeBytes).toBe(5_368_709_120);
    expect(JSON.parse(JSON.stringify(node)).sizeBytes).toBe(Number(sizeBytes));
  });

  it('keeps a zero-byte file at zero rather than null', () => {
    expect(toFsNode({ ...folder, type: 'FILE', sizeBytes: 0n }).sizeBytes).toBe(0);
  });

  it('converts the stats total whichever way the driver hands an int8 back', () => {
    // `::bigint` may arrive as a BigInt or as a string depending on the driver's column mapping;
    // both are the same number here, and neither reaches `JSON.stringify` as one.
    expect(toNodeStats({ folders: 2, files: 3, bytes: 5_368_709_121n })).toEqual({
      folders: 2,
      files: 3,
      bytes: 5_368_709_121,
    });
    expect(toNodeStats({ folders: 0, files: 0, bytes: '0' })).toEqual({
      folders: 0,
      files: 0,
      bytes: 0,
    });
  });

  it('stringifies both shapes without throwing', () => {
    const file = toFsNode({ ...folder, type: 'FILE', sizeBytes: 2n ** 40n });
    const stats = toNodeStats({ folders: 1, files: 1, bytes: 2n ** 40n });

    expect(() => JSON.stringify({ file, stats })).not.toThrow();
    // The guard this test exists for: the same values unconverted would throw.
    expect(() => JSON.stringify({ sizeBytes: 2n ** 40n })).toThrow(TypeError);
  });
});
