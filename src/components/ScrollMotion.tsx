import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
  duration?: number;
  amount?: number | 'some' | 'all';
}

/**
 * Compositor-only editorial entrance animation triggered smoothly as elements enter
 * the viewport while scrolling down. Automatically bypasses motion when the user
 * prefers reduced motion.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  y = 28,
  scale = 1,
  duration = 0.62,
  amount = 0.08,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ScrollParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  /** Vertical travel in pixels across the viewport pass (default: 24) */
  offset?: number;
}

/**
 * Continuous scroll-linked GPU vertical parallax container for showcase media
 * and atmospheric backdrops.
 */
export const ScrollParallaxLayer: React.FC<ScrollParallaxLayerProps> = ({
  children,
  className = '',
  offset = 24,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  if (shouldReduceMotion) {
    return <div className={`overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="w-full h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
};
