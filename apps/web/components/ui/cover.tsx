"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { SparklesCore } from "@/components/ui/sparkles";

const beamPositions = Array.from({ length: 7 }, (_, i) => (i + 1) * 8);

export const Cover = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  console.log(hovered);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={ref}
      className="group/cover relative inline-block rounded-sm bg-primary/80 px-2 py-2 transition duration-200 hover:bg-primary-foreground/90"
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
            className="absolute inset-0 h-full w-full overflow-hidden"
          >
            <motion.div
              animate={{
                translateX: ["-50%", "0%"],
              }}
              transition={{
                translateX: {
                  duration: 10,
                  ease: "linear",
                  repeat: Infinity,
                },
              }}
              className="flex h-full w-[200%]"
            >
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={500}
                particleColor="#FFFFFF"
              />
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={500}
                particleColor="#FFFFFF"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {beamPositions.map((position, index) => (
        <Beam
          key={index}
          hovered={hovered}
          duration={Math.random() * 2 + 1}
          delay={Math.random() * 2 + 1}
          style={{
            top: `${position}px`,
          }}
        />
      ))}
      <motion.span
        key={String(hovered)}
        animate={{
          scale: hovered ? 0.8 : 1,
          x: hovered ? [0, -30, 30, -30, 30, 0] : 0,
          y: hovered ? [0, 30, -30, 30, -30, 0] : 0,
        }}
        exit={{
          filter: "none",
          scale: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          duration: 0.2,
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
          filter: {
            duration: 0.2,
          },
        }}
        className={cn(
          "relative z-20 inline-block text-foreground transition duration-200 group-hover/cover:text-primary",
          className
        )}
      >
        {children}
      </motion.span>
      <CircleIcon className="absolute -top-0.5 -right-0.5" />
      <CircleIcon className="absolute -right-0.5 -bottom-0.5" delay={0.4} />
      <CircleIcon className="absolute -top-0.5 -left-0.5" delay={0.8} />
      <CircleIcon className="absolute -bottom-0.5 -left-0.5" delay={1.6} />
    </div>
  );
};

export const Beam = ({
  className,
  delay,
  duration,
  hovered,
  ...svgProps
}: {
  className?: string;
  delay?: number;
  duration?: number;
  hovered?: boolean;
} & React.ComponentProps<typeof motion.svg>) => {
  const id = useId();

  return (
    <motion.svg
      height="1"
      viewBox={`0 0 220 1`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("absolute inset-x-0 w-full", className)}
      {...svgProps}
    >
      <motion.path d={`M0 0.5H220`} stroke={`url(#svgGradient-${id})`} />

      <defs>
        <motion.linearGradient
          id={`svgGradient-${id}`}
          key={String(hovered)}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: hovered ? "-10%" : "-5%",
            y1: 0,
            y2: 0,
          }}
          animate={{
            x1: "110%",
            x2: hovered ? "100%" : "105%",
            y1: 0,
            y2: 0,
          }}
          transition={{
            duration: hovered ? 0.5 : (duration ?? 2),
            ease: "linear",
            repeat: Infinity,
            delay: hovered ? Math.random() * (1 - 0.2) + 0.2 : 0,
            repeatDelay: hovered ? Math.random() * (2 - 1) + 1 : (delay ?? 1),
          }}
        >
          <stop stopColor="var(--foreground)" stopOpacity="0" />
          <stop stopColor="var(--foreground)" />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </motion.svg>
  );
};

export const CircleIcon = ({
  className,
  delay,
}: {
  className?: string;
  delay?: number;
}) => {
  return (
    <div
      className={cn(
        `group pointer-events-none h-2 w-2 animate-pulse rounded-full bg-neutral-600 opacity-20 group-hover/cover:hidden group-hover/cover:bg-white group-hover/cover:opacity-100 dark:bg-white`,
        className
      )}
    ></div>
  );
};
