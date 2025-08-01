"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "@repo/ui/utils";

const taglines = [
  "Software for interdisciplinary thinkers",
  "Software for polymaths",
  "Software for the endlessly curious",
  "Software for generalists",
  "Software for the liberal arts",
];

export function RotatingTagline({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative h-10 overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.h2
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center text-2xl font-medium text-gray-900"
        >
          {taglines[currentIndex]}
        </motion.h2>
      </AnimatePresence>
    </div>
  );
}