"use client";

import { motion, type MotionProps } from "framer-motion";
import { forwardRef } from "react";

export const FadeIn = forwardRef<HTMLDivElement, MotionProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
      {...props}
    />
  )
);
FadeIn.displayName = "FadeIn";

export const FadeInUp = forwardRef<HTMLDivElement, MotionProps & { className?: string; delay?: number }>(
  ({ className, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
      {...props}
    />
  )
);
FadeInUp.displayName = "FadeInUp";

export const StaggerContainer = forwardRef<HTMLDivElement, MotionProps & { className?: string; delay?: number }>(
  ({ className, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      {...props}
    />
  )
);
StaggerContainer.displayName = "StaggerContainer";

export const StaggerItem = forwardRef<HTMLDivElement, MotionProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
      {...props}
    />
  )
);
StaggerItem.displayName = "StaggerItem";

export const HoverScale = forwardRef<HTMLDivElement, React.PropsWithChildren<{ className?: string; scale?: number }>> (
  ({ children, className, scale = 1.02 }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
);
HoverScale.displayName = "HoverScale";

export const PulseAnimation = forwardRef<HTMLDivElement, MotionProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
      {...props}
    />
  )
);
PulseAnimation.displayName = "PulseAnimation";

export { motion };
