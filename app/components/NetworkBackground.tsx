"use client";
import { useEffect, useRef } from "react";
import { ANIMATION_TOGGLE_EVENT } from "@/app/hooks/useAnimationToggle";

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
const STORAGE_KEY = "alleycorp-animation";

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Ref so the animation loop closure always reads the current value without re-mounting.
  const enabledRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cv: HTMLCanvasElement = canvas;
    const cx: CanvasRenderingContext2D = ctx;

    let animationId: number;
    let particles: Particle[] = [];
    let mousePending = false;

    // Read initial preference from localStorage (default OFF).
    const stored = localStorage.getItem(STORAGE_KEY);
    enabledRef.current = stored === null ? false : stored === "true";

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
      if (!enabledRef.current) return;

      const isDark = document.documentElement.classList.contains("dark");

      cx.clearRect(0, 0, cv.width, cv.height);

      cx.strokeStyle = isDark ? "rgba(14, 165, 214, 0.08)" : "rgba(0, 43, 49, 0.15)";
      cx.lineWidth = 0.75;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (dx * dx + dy * dy < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
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

    function start(): void {
      resize();
      init();
      animate();
    }

    function stop(): void {
      cancelAnimationFrame(animationId);
      cx.clearRect(0, 0, cv.width, cv.height);
    }

    function handleMouseMove(e: MouseEvent): void {
      if (!enabledRef.current || mousePending) return;
      mousePending = true;
      requestAnimationFrame(() => {
        for (const p of particles) {
          const dx = e.clientX - p.x;
          const dy = e.clientY - p.y;
          if (dx * dx + dy * dy < REPULSION_RADIUS * REPULSION_RADIUS) {
            p.x -= dx * REPULSION_STRENGTH;
            p.y -= dy * REPULSION_STRENGTH;
          }
        }
        mousePending = false;
      });
    }

    function handleResize(): void {
      resize();
      init();
    }

    function handleToggle(e: Event): void {
      const next = (e as CustomEvent<{ enabled: boolean }>).detail.enabled;
      enabledRef.current = next;
      if (next) {
        start();
      } else {
        stop();
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener(ANIMATION_TOGGLE_EVENT, handleToggle);

    if (enabledRef.current) {
      start();
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener(ANIMATION_TOGGLE_EVENT, handleToggle);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-60"
    />
  );
}
