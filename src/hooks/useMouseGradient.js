import { useEffect, useRef } from 'react';

export function useMouseGradient(containerRef, enabled = true) {
  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef?.current || document.body;

    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Lerp for smooth following with a slight delay
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.035;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.035;

      const { x, y } = posRef.current;

      const targetEl = containerRef?.current;
      if (targetEl) {
        targetEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, containerRef]);
}
