"use client";

import { memo, useEffect } from "react";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const TRANSITION = {
  type: "spring",
  stiffness: 280,
  damping: 18,
  mass: 0.3,
} as const;

const DIGITS = Array.from({ length: 10 }, (_, index) => index);

const Digit = memo(function Digit({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const animatedValue = useSpring(motionValue, TRANSITION);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums">
      <span className="invisible block h-[1em]">0</span>
      {DIGITS.map((digit) => (
        <DigitGlyph key={digit} mv={animatedValue} number={digit} />
      ))}
    </span>
  );
});

const DigitGlyph = memo(function DigitGlyph({
  mv,
  number,
}: {
  mv: MotionValue<number>;
  number: number;
}) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let position = offset;

    if (offset > 5) {
      position -= 10;
    }

    return `${position}em`;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex h-[1em] items-center justify-center will-change-transform"
    >
      {number}
    </motion.span>
  );
});

type SlidingNumberProps = {
  value: number;
  padStart?: boolean;
  decimalSeparator?: string;
};

export const SlidingNumber = memo(function SlidingNumber({
  value,
  padStart = false,
  decimalSeparator = ".",
}: SlidingNumberProps) {
  const absValue = Math.abs(value);
  const [integerPart, decimalPart] = absValue.toString().split(".");
  const integerValue = parseInt(integerPart, 10);
  const paddedInteger =
    padStart && integerValue < 10 ? `0${integerPart}` : integerPart;
  const integerDigits = paddedInteger.split("");

  return (
    <div className="flex items-center">
      {value < 0 && "-"}
      {integerDigits.map((digit, index) => (
        <Digit
          key={`integer-${integerDigits.length - index - 1}`}
          value={Number(digit)}
        />
      ))}
      {decimalPart && (
        <>
          <span>{decimalSeparator}</span>
          {decimalPart.split("").map((digit, index) => (
            <Digit key={`decimal-${index}`} value={Number(digit)} />
          ))}
        </>
      )}
    </div>
  );
});
