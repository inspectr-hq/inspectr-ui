import { useEffect, useState } from 'react';

/**
 * Tracks the clientHeight of a DOM element via ResizeObserver,
 * falling back to a window resize listener in environments where
 * ResizeObserver is unavailable.
 *
 * @param {React.RefObject} ref     - ref attached to the element to measure
 * @param {object}          options
 * @param {number}          options.min     - minimum height to return (default: 0)
 * @param {boolean}         options.enabled - when false the observer is not attached (default: true)
 * @param {Array}           options.deps    - additional effect dependencies
 */
const useElementHeight = (ref, { min = 0, enabled = true, deps = [] } = {}) => {
  const [height, setHeight] = useState(min);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const update = () => setHeight(Math.max(min, Math.floor(node.clientHeight || 0)));
    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return height;
};

export default useElementHeight;
