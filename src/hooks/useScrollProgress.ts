import { useEffect, useRef, useState } from "react";

/**
 * Returns a 0–1 scroll progress value for a given element reference.
 * Progress = how far the element has been scrolled through the viewport.
 */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Start when top hits bottom of viewport, end when bottom hits top
      const start = windowH;        // el.top === windowH
      const end = -rect.height;     // el.top === -rect.height
      const current = rect.top;
      const raw = (start - current) / (start - end);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [ref]);

  return progress;
}

/**
 * Returns a 0–1 progress value for a section relative to viewport center
 */
export function useSectionProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // 0 = element enters top of viewport, 1 = element leaves top
      const raw = (windowH - rect.top) / (windowH + rect.height);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);

  return progress;
}
