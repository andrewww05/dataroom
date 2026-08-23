import { useEffect } from 'react';

type KeyboardMapParams = {
  onUp?: (shift: boolean) => void;
  onDown?: (shift: boolean) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  onF2?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
};

export function useKeyboardMap(params: KeyboardMapParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if the event originates from an input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        // Check if we are inside an active dialog/modal where we shouldn't intercept global shortcuts,
        // unless it's Esc which is handled natively by dialogs (or we can just let Esc bubble).
        (typeof target.closest === 'function' && target.closest('[role="dialog"]'))
      ) {
        if (e.key === 'Escape' && params.onEscape) {
          // Note: Dialogs natively close on Esc. If we want our handler to run AFTER dialogs,
          // we shouldn't prevent default, or maybe let it be. But usually dialogs stopPropagation.
          // Wait, the requirement says "viewer -> dialog -> inline rename -> clear selection".
          // If focus is in a dialog, the dialog handles Esc. If not, this global handler fires.
        } else {
          return;
        }
      }

      switch (e.key) {
        case 'ArrowUp':
          if (params.onUp) {
            e.preventDefault();
            params.onUp(e.shiftKey);
          }
          break;
        case 'ArrowDown':
          if (params.onDown) {
            e.preventDefault();
            params.onDown(e.shiftKey);
          }
          break;
        case 'Enter':
          if (params.onEnter) {
            e.preventDefault();
            params.onEnter();
          }
          break;
        case 'Backspace':
          if (params.onBackspace) {
            e.preventDefault();
            params.onBackspace();
          }
          break;
        case 'F2':
          if (params.onF2) {
            e.preventDefault();
            params.onF2();
          }
          break;
        case 'Delete':
          if (params.onDelete) {
            e.preventDefault();
            params.onDelete();
          }
          break;
        case 'a':
        case 'A':
          if ((e.ctrlKey || e.metaKey) && params.onSelectAll) {
            e.preventDefault();
            params.onSelectAll();
          }
          break;
        case 'x':
        case 'X':
          if ((e.ctrlKey || e.metaKey) && params.onCut) {
            e.preventDefault();
            params.onCut();
          }
          break;
        case 'c':
        case 'C':
          if ((e.ctrlKey || e.metaKey) && params.onCopy) {
            e.preventDefault();
            params.onCopy();
          }
          break;
        case 'v':
        case 'V':
          if ((e.ctrlKey || e.metaKey) && params.onPaste) {
            e.preventDefault();
            params.onPaste();
          }
          break;
        case '/':
          if (params.onSearch) {
            e.preventDefault();
            params.onSearch();
          }
          break;
        case 'Escape':
          if (params.onEscape) {
            e.preventDefault();
            params.onEscape();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [params]);
}
