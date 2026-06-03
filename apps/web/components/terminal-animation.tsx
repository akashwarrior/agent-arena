"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type TerminalLine = {
  time: string;
  text: string;
  agent: string;
  status?: "success";
};

export function TerminalAnimation({ lines }: { lines: TerminalLine[] }) {
  const lineCount = lines.length;
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogIndex((prev) =>
        prev < lineCount - 1 ? prev + 1 : prev
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [lineCount]);

  return (
    <>
      <div className="flex flex-1 flex-col justify-end gap-2 p-4">
        <AnimatePresence mode="popLayout">
          {lines
            .slice(0, activeLogIndex + 1)
            .slice(-3)
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
