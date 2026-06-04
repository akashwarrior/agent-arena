"use client";

import { memo, useEffect, useId, useRef } from "react";

const TAU = Math.PI * 2;
const DENSITY_AREA = 400 * 400;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

type Particle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  twinkleSpeed: number;
  velocity: number;
};

type ParticlesProps = {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getParticleCount(width: number, height: number, density: number) {
  if (!width || !height || !density) return 0;
  return Math.max(1, Math.round((density * width * height) / DENSITY_AREA));
}

function createParticles({
  width,
  height,
  count,
  minSize,
  maxSize,
  speed,
}: {
  width: number;
  height: number;
  count: number;
  minSize: number;
  maxSize: number;
  speed: number;
}) {
  return Array.from(
    { length: count },
    (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: randomBetween(minSize, maxSize),
      alpha: randomBetween(0.1, 1),
      phase: Math.random() * TAU,
      twinkleSpeed: randomBetween(0.5, 1.25) * speed,
      velocity: randomBetween(0.08, 0.35),
    })
  );
}

export const SparklesCore = memo(function SparklesCore({
  id,
  background = "#0d47a1",
  minSize = 1,
  maxSize = 3,
  speed = 4,
  particleColor = "#ffffff",
  particleDensity = 120,
}: ParticlesProps) {
  const generatedId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let lastFrame = performance.now();
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      ratio = Math.min(devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);

      const targetW = Math.floor(width * ratio);
      const targetH = Math.floor(height * ratio);
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      particles = createParticles({
        width,
        height,
        count: getParticleCount(width, height, particleDensity),
        minSize,
        maxSize,
        speed,
      });
    };

    const render = (time: number) => {
      const delta = Math.min(64, time - lastFrame) / 16.67;
      lastFrame = time;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.fillStyle = particleColor;
      for (const particle of particles) {
        particle.x += particle.velocity * delta;
        if (particle.x - particle.radius > width) {
          particle.x = -particle.radius;
          particle.y = Math.random() * height;
        }

        const twinkle =
          0.55 +
          0.45 *
            Math.sin(time * 0.001 * particle.twinkleSpeed + particle.phase);
        ctx.globalAlpha = particle.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationFrame = requestAnimationFrame(render);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [background, maxSize, minSize, particleColor, particleDensity, speed]);

  return (
    <canvas
      ref={canvasRef}
      id={id || generatedId}
      className="block h-full w-full"
    />
  );
});
