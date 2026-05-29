"use client";

import { motion } from "motion/react";

export function LoginArt() {

  return (
    <div className="absolute inset-0 z-1 flex items-center justify-center overflow-hidden bg-transparent pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,255,150,0.25)_0%,transparent_50%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,80,0,0.20)_0%,transparent_50%)]" />

      <div
        style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
        className="relative flex h-[120%] w-[120%] items-center justify-center"
      >
        <motion.div
          style={{ z: 100 }}
          animate={{ rotateZ: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute h-150 w-150 rounded-full border border-dashed border-foreground/20"
        />
        <motion.div
          style={{ z: 180 }}
          animate={{ rotateZ: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute h-100 w-100 rounded-full border-2 border-dashed border-primary/30"
        />
        <motion.div
          style={{ z: 250 }}
          className="absolute h-50 w-50 rounded-full border border-foreground/30 shadow-[0_0_30px_rgba(0,255,150,0.1)]"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{ background: 'radial-gradient(ellipse at center, transparent 20%, var(--background) 100%)' }}
      />

      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.7] mix-blend-multiply dark:opacity-[0.35] dark:mix-blend-screen">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
