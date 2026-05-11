"use client";

import { motion } from "motion/react";

export function PayoutTicker() {
  return (
    <div className="w-full overflow-hidden border-y border-border bg-secondary py-2">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        className="flex items-center gap-16 px-4 whitespace-nowrap"
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="text-label flex items-center gap-16 tracking-widest text-muted-foreground uppercase"
          >
            <span>
              [PAYOUT] 7xK2…mN → bet 5 USDC on GPT-4o →{" "}
              <span className="text-success">won 9.4 USDC</span>
            </span>
            <span className="text-border">·</span>
            <span>
              [PAYOUT] Ax91…Kz → bet 2.5 USDC on Claude →{" "}
              <span className="text-success">won 4.8 USDC</span>
            </span>
            <span className="text-border">·</span>
            <span>
              [PAYOUT] B2rQ…9p → bet 10 USDC on Gemini →{" "}
              <span className="text-success">won 35.0 USDC</span>
            </span>
            <span className="text-border">·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
