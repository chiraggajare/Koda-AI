import { useEffect, useRef } from 'react';

export function useMouseGradient(containerRef) {
  const posRef = useRef({ x: 50, y: 50 });
  const targetRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef(null);

  useEffect(() => {
    const el = containerRef?.current || document.body;

    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Lerp for smooth following
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.05;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.05;

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
  }, []);
}
