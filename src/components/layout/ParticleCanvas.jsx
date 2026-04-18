import React, { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null, radius: 100 };
    
    // Get colors from CSS variables
    const getColors = () => {
      const styles = getComputedStyle(document.body);
      return [
        styles.getPropertyValue('--grad-1').trim() || '#ffffff',
        styles.getPropertyValue('--grad-2').trim() || '#ffffff',
        styles.getPropertyValue('--grad-3').trim() || '#ffffff'
      ];
    };
    
    const colors = getColors();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', resize);

    const mouseMove = (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };
    
    const mouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };
    
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseout', mouseOut);

    class Particle {
      constructor(x, y, dx, dy, size, color) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = Math.random() * 2 + 0.5;
        this.color = color;
        this.baseX = x;
        this.baseY = y;
        this.density = (Math.random() * 30) + 1;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
      }
      
      update() {
        // Drift slowly
        this.baseX += this.dx;
        this.baseY += this.dy;
        
        // Wrap around screen
        if (this.baseX > canvas.width) this.baseX = 0;
        if (this.baseX < 0) this.baseX = canvas.width;
        if (this.baseY > canvas.height) this.baseY = 0;
        if (this.baseY < 0) this.baseY = canvas.height;
        
        // Mouse avoidance logic
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        
        const maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = (forceDirectionX * force * this.density);
        let directionY = (forceDirectionY * force * this.density);
        
        if (distance < maxDistance && mouse.x !== null) {
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            let dx = this.x - this.baseX;
            this.x -= dx / 10;
          }
          if (this.y !== this.baseY) {
            let dy = this.y - this.baseY;
            this.y -= dy / 10;
          }
        }
        
        this.draw();
      }
    }

    function initParticles() {
      particles = [];
      const particleCount = (canvas.width * canvas.height) / 8000;
      for (let i = 0; i < particleCount; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let dx = (Math.random() - 0.5) * 0.4;
        let dy = (Math.random() - 0.5) * 0.4;
        let color = 'rgba(255, 255, 255, 0.5)';
        // make particles semi-transparent
        particles.push(new Particle(x, y, dx, dy, 2, color));
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
    }

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseout', mouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.8
      }}
    />
  );
}
