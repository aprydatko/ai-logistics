"use client";

import * as React from "react";
import { motion, type Transition, useReducedMotion } from "framer-motion";

type DashboardMotionItemProps = {
  children: React.ReactNode;
  transition?: Transition;
};

export function DashboardMotionItem({
  children,
  transition,
}: DashboardMotionItemProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut", ...transition }}
    >
      {children}
    </motion.div>
  );
}
