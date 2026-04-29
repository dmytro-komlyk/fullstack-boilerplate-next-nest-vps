'use client';

import { motion, useMotionValue, useSpring, type Transition } from 'framer-motion';
import React, { useRef, useState, type ReactNode } from 'react';

interface MagneticWrapperProps {
  children: ReactNode;
  offset?: number;
  springConfig?: Transition;
}

export default function MagneticWrapper({
  children,
  offset = 1,
  springConfig = { type: 'spring', stiffness: 150, damping: 15, mass: 0.1 },
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    if (isHovered) {
      x.set(distanceX * 0.1 * offset);
      y.set(distanceY * 0.1 * offset);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
        willChange: 'transform',
      }}
      className="w-fit h-fit"
    >
      {children}
    </motion.div>
  );
}
