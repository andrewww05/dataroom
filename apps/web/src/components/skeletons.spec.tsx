import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AppShellSkeleton, ListingSkeleton, FolderTreeSkeleton } from './skeletons';
import '@testing-library/jest-dom';

describe('Skeletons', () => {
  it('AppShellSkeleton renders shell landmarks and is not empty', () => {
    const { container } = render(<AppShellSkeleton />);
    expect(container.firstChild).not.toBeEmptyDOMElement();
    expect(container.querySelector('aside')).toBeInTheDocument();
  });

  it('ListingSkeleton renders table headers and rows and is not empty', () => {
    const { container } = render(<ListingSkeleton />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelectorAll('th').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tr').length).toBeGreaterThan(1);
  });

  it('FolderTreeSkeleton renders skeleton items and is not empty', () => {
    const { container } = render(<FolderTreeSkeleton />);
    expect(container.firstChild).not.toBeEmptyDOMElement();
  });
});
