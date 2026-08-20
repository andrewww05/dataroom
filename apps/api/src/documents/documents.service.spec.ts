import { NotFoundException } from '@nestjs/common';

import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const service = new DocumentsService();

  it('lists every document by default', () => {
    expect(service.list().total).toBeGreaterThan(0);
  });

  it('filters by status', () => {
    const { items } = service.list('draft');

    expect(items.every((doc) => doc.status === 'draft')).toBe(true);
  });

  it('throws for an unknown id', () => {
    expect(() => service.findOne('nope')).toThrow(NotFoundException);
  });
});
