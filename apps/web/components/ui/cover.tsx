"use client";

import { memo, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { SparklesCore } from "@/components/ui/sparkles";

const beamConfigs = Array.from({ length: 7 }, (_, index) => ({
  style: { top: `${(index + 1) * 8}px` },
  duration: 1 + (index % 3) * 0.45,
  delay: 1 + (index % 5) * 0.3,
  hoverDelay: 0.2 + (index % 4) * 0.15,
  hoverRepeatDelay: 1 + (index % 3) * 0.35,
}));

export const Cover = memo(function Cover({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group/cover relative inline-block rounded-sm bg-primary/80 p-2 transition-colors duration-200 hover:bg-primary-foreground/90"
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: {
                duration: 0.2,
              },
            }}
            className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden"
          >
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={500}
              particleColor="#FFFFFF"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {beamConfigs.map((beam, index) => (
        <Beam
          key={index}
          id={`beam-${index}`}
          hovered={hovered}
          duration={beam.duration}
          delay={beam.delay}
          hoverDelay={beam.hoverDelay}
          hoverRepeatDelay={beam.hoverRepeatDelay}
          style={beam.style}
        />
      ))}
      <motion.span
        animate={{
          scale: hovered ? 0.8 : 1,
          x: hovered ? [0, -30, 30, -30, 30, 0] : 0,
          y: hovered ? [0, 30, -30, 30, -30, 0] : 0,
        }}
        transition={
          hovered
            ? {
                x: {
                  duration: 0.2,
                  repeat: Infinity,
                  repeatType: "loop",
                },
                y: {
                  duration: 0.2,
                  repeat: Infinity,
                  repeatType: "loop",
                },
                scale: {
                  duration: 0.2,
                },
              }
            : undefined
        }
        className={cn(
          "pointer-events-none relative z-20 inline-block text-foreground transition duration-200 group-hover/cover:text-primary",
          className
        )}
      >
        {children}
      </motion.span>
      <CircleIcon className="absolute -top-0.5 -right-0.5" delay={0} />
      <CircleIcon className="absolute -right-0.5 -bottom-0.5" delay={0.4} />
      <CircleIcon className="absolute -top-0.5 -left-0.5" delay={0.8} />
      <CircleIcon className="absolute -bottom-0.5 -left-0.5" delay={1.6} />
    </div>
  );
});

export const Beam = memo(function Beam({
  id,
  className,
  delay,
  duration,
  hoverDelay,
  hoverRepeatDelay,
  hovered,
  ...svgProps
}: {
  id: string;
  className?: string;
  delay: number;
  duration: number;
  hoverDelay: number;
  hoverRepeatDelay: number;
  hovered?: boolean;
} & ComponentProps<typeof motion.svg>) {
  return (
    <motion.svg
      height="1"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute inset-0 max-w-full",
        className
      )}
      {...svgProps}
    >
      <motion.path d={`M0 0.5H220`} stroke={`url(#svgGradient-${id})`} />

      <defs>
        <motion.linearGradient
          id={`svgGradient-${id}`}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: "-5%",
            y1: 0,
            y2: 0,
          }}
          animate={{
            x1: "110%",
            x2: "105%",
            y1: 0,
            y2: 0,
          }}
          transition={{
            duration: hovered ? 0.5 : (duration ?? 2),
            ease: "linear",
            repeat: Infinity,
            delay: hovered ? (hoverDelay ?? 0.2) : 0,
            repeatDelay: hovered ? (hoverRepeatDelay ?? 1) : (delay ?? 1),
          }}
        >
          <stop stopColor="var(--foreground)" stopOpacity="0" />
          <stop stopColor="var(--foreground)" />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </motion.svg>
  );
});

export const CircleIcon = memo(function CircleIcon({
  className,
  delay,
}: {
  className?: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        `group pointer-events-none h-2 w-2 animate-pulse rounded-full bg-neutral-600 opacity-20 group-hover/cover:hidden group-hover/cover:bg-white group-hover/cover:opacity-100 dark:bg-white`,
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  );
});
