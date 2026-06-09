"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const PARTICLE_COUNT = 120;
const CONNECTION_DISTANCE = 180;
const REPULSION_RADIUS = 120;
const REPULSION_STRENGTH = 0.012;

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Explicitly-typed non-null captures for use inside closures.
    const cv: HTMLCanvasElement = canvas;
    const cx: CanvasRenderingContext2D = ctx;

    let animationId: number;
    let particles: Particle[] = [];

    function createParticle(): Particle {
      return {
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        size: Math.random() * 4 + 2.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.4 + 0.4,
      };
    }

    function resize(): void {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    }

    function init(): void {
      particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    }

    function animate(): void {
      const isDark = document.documentElement.classList.contains("dark");

      cx.clearRect(0, 0, cv.width, cv.height);

      cx.strokeStyle = isDark ? "rgba(14, 165, 214, 0.08)" : "rgba(0, 43, 49, 0.15)";
      cx.lineWidth = 0.75;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DISTANCE) {
            cx.beginPath();
            cx.moveTo(particles[i].x, particles[i].y);
            cx.lineTo(particles[j].x, particles[j].y);
            cx.stroke();
          }
        }
      }

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x > cv.width) p.x = 0;
        if (p.x < 0) p.x = cv.width;
        if (p.y > cv.height) p.y = 0;
        if (p.y < 0) p.y = cv.height;

        cx.fillStyle = isDark
          ? `rgba(14, 165, 214, ${p.opacity * 0.6})`
          : `rgba(0, 47, 53, ${p.opacity})`;
        cx.beginPath();
        cx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        cx.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    function handleMouseMove(e: MouseEvent): void {
      for (const p of particles) {
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_RADIUS) {
          p.x -= dx * REPULSION_STRENGTH;
          p.y -= dy * REPULSION_STRENGTH;
        }
      }
    }

    function handleResize(): void {
      resize();
      init();
    }

    resize();
    init();
    animate();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-60"
    />
  );
}
