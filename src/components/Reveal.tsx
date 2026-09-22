import { motion, useReducedMotion, type Variants } from "motion/react";
import * as React from "react";

/** Single scroll-triggered reveal. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  amount = 0.2,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  amount?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -70px 0px" }}
      transition={{
        duration: reduceMotion ? 0.2 : 0.66,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/** Parent for groups that should stagger their children into view. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  amount?: number;
}) {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : stagger,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: "0px 0px -60px 0px" }}
    >
      {children}
    </motion.div>
  );
}

/** Child item for <RevealGroup>. */
export function RevealItem({
  children,
  className,
  y = 26,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  const item: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
