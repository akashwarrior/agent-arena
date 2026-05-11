"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const ease_out = [0.22, 1, 0.36, 1] as const;

const fade_up: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease_out } },
};

const stagger_parent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/* ── Stagger container (scroll-triggered) ───────────────────────── */

export function StaggerIn({
  children,
  className,
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  id?: string;
}) {
  const Component = Tag === "section" ? motion.section : motion.div;
  return (
    <Component
      id={id}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger_parent}
      className={className}
    >
      {children}
    </Component>
  );
}

/* ── Fade-up child (used inside StaggerIn) ──────────────────────── */

export function FadeIn({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "span" | "p" | "h2";
}) {
  const components = {
    div: motion.div,
    span: motion.span,
    p: motion.p,
    h2: motion.h2,
  } as const;
  const Component = components[Tag];
  return (
    <Component variants={fade_up} className={className}>
      {children}
    </Component>
  );
}

/* ── Slide-up on scroll (standalone, not inside stagger) ────────── */

export function SlideIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: ease_out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Fade wrapper (opacity only) ────────────────────────────────── */

export function FadeWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: ease_out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hover lift card ────────────────────────────────────────────── */

export function HoverCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fade_up}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
