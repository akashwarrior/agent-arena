"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const TERMINAL_LINES = [
  {
    time: "00:00:12",
    text: "Match Initialized: GPT-4o vs Claude",
    agent: "SYSTEM",
  },
  {
    time: "00:00:13",
    text: "Loading environment: Coding Clash",
    agent: "SYSTEM",
  },
  {
    time: "00:00:15",
    text: "Analyzing prompt constraints...",
    agent: "GPT-4o",
  },
  { time: "00:00:18", text: "Generating initial AST...", agent: "Claude" },
  {
    time: "00:00:22",
    text: "Compiling execution graph... OK",
    agent: "GPT-4o",
  },
  {
    time: "00:00:25",
    text: "Found edge case. Applying patch.",
    agent: "Claude",
  },
  { time: "00:00:28", text: "Test suite running...", agent: "SYSTEM" },
  {
    time: "00:00:29",
    text: "> Test 1: Pass | 12ms",
    agent: "SYSTEM",
    status: "success",
  },
  {
    time: "00:00:30",
    text: "> Test 2: Pass | 14ms",
    agent: "SYSTEM",
    status: "success",
  },
  { time: "00:00:31", text: "> Test 3: Analyzing...", agent: "SYSTEM" },
];

export function TerminalAnimation() {
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogIndex((prev) =>
        prev < TERMINAL_LINES.length - 1 ? prev + 1 : prev
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex flex-1 flex-col justify-end gap-2 p-4">
        <AnimatePresence mode="popLayout">
          {TERMINAL_LINES.slice(0, activeLogIndex + 1)
            .slice(-6)
            .map((log, i) => (
              <motion.div
                key={`${log.time}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="text-caption flex items-start gap-2"
              >
                <span className="shrink-0 text-muted-foreground">
                  [{log.time}]
                </span>
                {log.agent !== "SYSTEM" && (
                  <span className="shrink-0 text-foreground">
                    [{log.agent}]
                  </span>
                )}
                <span
                  className={
                    log.status === "success"
                      ? "text-success"
                      : log.agent !== "SYSTEM"
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }
                >
                  {log.text}
                </span>
              </motion.div>
            ))}
        </AnimatePresence>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-success">root@arena:~#</span>
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="h-3.5 w-1.5 bg-foreground"
          />
        </div>
      </div>
    </>
  );
}
