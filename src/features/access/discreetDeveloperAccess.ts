import type React from 'react';
import { useEffect, useRef } from 'react';
import { navigatePreview } from './navigation';

/**
 * Discreet developer entrance:
 * 1. Multi-activation gesture: clicking the brand element 5 times within 3 seconds.
 * 2. Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D) when focus is not in an editable field.
 * Both navigate to /#/developer-reference without altering visible UI.
 */
export function useDiscreetDeveloperAccess() {
  const clickTimestamps = useRef<number[]>([]);

  const handleBrandClick = (event: React.MouseEvent) => {
    const now = Date.now();
    // Keep clicks from the last 3000ms
    clickTimestamps.current = [...clickTimestamps.current.filter((t) => now - t < 3000), now];
    if (clickTimestamps.current.length > 1) {
      // Prevent scrolling away during multi-click gesture
      event.preventDefault();
    }
    if (clickTimestamps.current.length >= 5) {
      event.preventDefault();
      clickTimestamps.current = [];
      navigatePreview('/developer-reference');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isDKey = event.key === 'D' || event.key === 'd' || event.code === 'KeyD';
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && isDKey) {
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
        const isEditing = path.some((el) => {
          if (!(el instanceof HTMLElement)) return false;
          const tag = el.tagName;
          return (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            el.isContentEditable ||
            tag.includes('TEXT-FIELD')
          );
        });
        if (isEditing) {
          return;
        }
        event.preventDefault();
        navigatePreview('/developer-reference');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { handleBrandClick };
}
