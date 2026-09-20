"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type StaggeredContentProps = {
  children: ReactNode;
  delay?: number;
};

export default function StaggeredContent({
  children,
  delay = 0,
}: StaggeredContentProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
