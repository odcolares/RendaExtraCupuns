"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { motion } from "framer-motion";

interface CounterProps {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function Counter({ value, label, prefix = "", suffix = "", duration = 2 }: CounterProps) {
  const node = useMotionValue(0);
  const [visibleValue, setVisibleValue] = useState(0);
  const spring = useSpring(node, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setVisibleValue(Math.round(latest));
    });
    node.set(value);
    return () => unsubscribe();
  }, [spring, node, value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="text-3xl font-bold text-brand-primary">
        {prefix}{visibleValue.toLocaleString("pt-BR")}{suffix}
      </div>
      {label && <p className="text-sm text-muted-foreground mt-1">{label}</p>}
    </motion.div>
  );
}
