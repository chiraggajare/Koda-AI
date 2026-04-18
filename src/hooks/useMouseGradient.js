import { useEffect, useRef } from 'react';

export function useMouseGradient(containerRef) {
  const posRef = useRef({ x: 50, y: 50 });
  const targetRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef(null);

  useEffect(() => {
    const el = containerRef?.current || document.body;

    const onMove = (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      targetRef.current = {
        x: (e.clientX / w) * 100,
        y: (e.clientY / h) * 100,
      };
    };

    const animate = () => {
      // Slightly faster lerp for a better balance of ambient weight and responsiveness
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.017;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.017;

      const { x, y } = posRef.current;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);

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
