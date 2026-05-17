"use client";

import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "user"}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
