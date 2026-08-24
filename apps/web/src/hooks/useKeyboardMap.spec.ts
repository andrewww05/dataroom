import { renderHook } from '@testing-library/react';
import { useKeyboardMap } from './useKeyboardMap';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useKeyboardMap', () => {
  const events = {
    onUp: vi.fn(),
    onDown: vi.fn(),
    onEnter: vi.fn(),
    onBackspace: vi.fn(),
    onF2: vi.fn(),
    onDelete: vi.fn(),
    onSelectAll: vi.fn(),
    onCut: vi.fn(),
    onCopy: vi.fn(),
    onPaste: vi.fn(),
    onSearch: vi.fn(),
    onEscape: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fireKey = (key: string, ctrlKey = false, shiftKey = false, target?: HTMLElement) => {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey,
      shiftKey,
      metaKey: ctrlKey,
      bubbles: true,
    });
    if (target) {
      target.dispatchEvent(event);
    } else {
      window.dispatchEvent(event);
    }
    return event;
  };

  it('triggers onUp', () => {
    renderHook(() => useKeyboardMap(events));
    fireKey('ArrowUp');
    expect(events.onUp).toHaveBeenCalledWith(false);
  });

  it('triggers onUp with shift', () => {
    renderHook(() => useKeyboardMap(events));
    fireKey('ArrowUp', false, true);
    expect(events.onUp).toHaveBeenCalledWith(true);
  });

  it('triggers onSelectAll with Ctrl+A', () => {
    renderHook(() => useKeyboardMap(events));
    fireKey('a', true);
    expect(events.onSelectAll).toHaveBeenCalled();
  });

  it('ignores input elements', () => {
    renderHook(() => useKeyboardMap(events));
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey('ArrowUp', false, false, input);
    expect(events.onUp).not.toHaveBeenCalled();
    input.remove();
  });

  it('triggers onEscape properly', () => {
    renderHook(() => useKeyboardMap(events));
    fireKey('Escape');
    expect(events.onEscape).toHaveBeenCalled();
  });
});
