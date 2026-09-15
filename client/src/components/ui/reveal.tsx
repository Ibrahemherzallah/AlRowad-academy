import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

/**
 * Scroll-reveal primitives. Elements animate in once as they enter the
 * viewport. Respects the container's RTL/LTR direction automatically since
 * transforms are axis-based (y) or neutral.
 */

// Gentle ease-out — slow, graceful settle with no bounce.
const easing = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 1.5, ease: easing } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 1, ease: easing } },
};

/** Stagger container: children with `fadeUp`/`scaleIn` cascade in slowly. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.22, delayChildren: 0.15 } },
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  /** Trigger a bit before fully in view for a snappier feel. */
  amount?: number;
  delay?: number;
}

/** Single element that reveals on scroll. */
export function Reveal({ children, className, variants = fadeUp, amount = 0.3, delay = 0 }: RevealProps) {
  return (
      <motion.div
          className={className}
          variants={variants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount }}
          // Preserve the variant's slow duration/easing; only add the delay.
          transition={delay ? { duration: 1.1, ease: easing, delay } : undefined}
      >
        {children}
      </motion.div>
  );
}

/** Wraps a group so its `Reveal`/motion children stagger in together. */
export function RevealGroup({ children, className, amount = 0.2 }: RevealProps) {
  return (
      <motion.div
          className={className}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount }}
      >
        {children}
      </motion.div>
  );
}
