import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ParticlesBackground() {
  const { particlesEnabled } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!particlesEnabled || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Store particles here
    let particles = [];
    
    // Mouse tracking
    let mouse = {
      x: undefined,
      y: undefined,
      radius: 200 // Larger interaction zone for smooth entry
    };

    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    const createParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 12000); // Responsive amount
      for (let i = 0; i < numParticles; i++) {
        const baseVx = (Math.random() - 0.5) * 0.5;
        const baseVy = (Math.random() - 0.5) * 0.5;
        const baseAlpha = Math.random() * 0.5 + 0.1;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          baseVx,
          baseVy,
          vx: baseVx,
          vy: baseVy,
          baseAlpha,
          alpha: baseAlpha,
          shooting: false
        });
      }
    };

    const updateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Random shooting stars
      if (Math.random() < 0.02) { 
        const p = particles[Math.floor(Math.random() * particles.length)];
        if (!p.shooting) {
          p.shooting = true;
          // Shoot left or right fast
          p.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 10 + 8);
          p.vy = (Math.random() - 0.5) * 1; 
          p.alpha = 0.9;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;

        // Return to base state via friction if not shooting - higher damping for smoothness
        if (!p.shooting) {
          p.vx += (p.baseVx - p.vx) * 0.15;
          p.vy += (p.baseVy - p.vy) * 0.15;
          p.alpha += (p.baseAlpha - p.alpha) * 0.1;
        }

        // Screen wrap instead of bounce for more infinite fluid feel
        let wrapped = false;
        if (p.x < 0) { p.x = canvas.width; wrapped = true; }
        else if (p.x > canvas.width) { p.x = 0; wrapped = true; }
        
        if (p.y < 0) { p.y = canvas.height; wrapped = true; }
        else if (p.y > canvas.height) { p.y = 0; wrapped = true; }

        // Reset shooting if it leaves the screen
        if (wrapped && p.shooting) {
          p.shooting = false;
          p.vx = p.baseVx;
          p.vy = p.baseVy;
          p.alpha = p.baseAlpha;
        }

        // Mouse interaction (Smooth Deflection Container)
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distanceSq = dx * dx + dy * dy;
          const radiusSq = mouse.radius * mouse.radius;

          if (distanceSq < radiusSq && distanceSq > 0.1) {
            const distance = Math.sqrt(distanceSq);
            // Non-linear falloff (stronger near the center, decays smoothly toward edge)
            const ratio = distance / mouse.radius;
            const force = (1 - ratio) * (1 - ratio);

            // Stronger, snappier repulsion
            const pushStrength = 2.5; 
            p.vx += (dx / distance) * force * pushStrength;
            p.vy += (dy / distance) * force * pushStrength;

            // Higher max speed for "instant" feel
            const maxSpeed = 10;
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > maxSpeed * maxSpeed) {
              const speed = Math.sqrt(speedSq);
              p.vx = (p.vx / speed) * maxSpeed;
              p.vy = (p.vy / speed) * maxSpeed;
            }

            // Milder lighting effect
            if (!p.shooting) {
               p.alpha = Math.min(0.6, p.alpha + 0.01);
            }
          }
        }

        // Draw particle
        ctx.beginPath();
        if (p.shooting) {
          // Draw a small streak for shooting particles
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.lineWidth = p.radius;
          ctx.stroke();
        } else {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(updateParticles);
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = undefined;
      mouse.y = undefined;
    };

    const handleResize = () => {
      initCanvas();
    };

    initCanvas();
    updateParticles();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particlesEnabled]);

  if (!particlesEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0.8,
        mixBlendMode: 'screen'
      }}
    />
  );
}
