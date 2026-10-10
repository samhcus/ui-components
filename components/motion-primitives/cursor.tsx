'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  motion,
  type SpringOptions,
  useMotionValue,
  useSpring,
  AnimatePresence,
  type Transition,
  type Variant,
} from 'motion/react';
import { cn } from '@/lib/utils';

export type CursorProps = {
  children: React.ReactNode;
  className?: string;
  springConfig?: SpringOptions;
  attachToParent?: boolean;
  transition?: Transition;
  variants?: {
    initial: Variant;
    animate: Variant;
    exit: Variant;
  };
  onPositionChange?: (x: number, y: number) => void;
};

export function Cursor({
  children,
  className,
  springConfig,
  attachToParent,
  variants,
  transition,
  onPositionChange,
}: CursorProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!attachToParent);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      cursorX.set(window.innerWidth / 2);
      cursorY.set(window.innerHeight / 2);
    }
  }, []);

  useEffect(() => {
    if (!attachToParent) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = 'auto';
    }
    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      onPositionChange?.(e.clientX, e.clientY);
    };
    document.addEventListener('mousemove', updatePosition);
    return () => {
      document.removeEventListener('mousemove', updatePosition);
    };
  }, [cursorX, cursorY, onPositionChange]);

  const cursorXSpring = useSpring(cursorX, springConfig ?? { duration: 0 });
  const cursorYSpring = useSpring(cursorY, springConfig ?? { duration: 0 });

  useEffect(() => {
    if (!attachToParent || !cursorRef.current) return;
    const parent = cursorRef.current.parentElement;
    if (!parent) return;

    const show = () => {
      parent.style.cursor = 'none';
      setIsVisible(true);
    };
    const hide = () => {
      parent.style.cursor = 'auto';
      setIsVisible(false);
    };

    parent.addEventListener('mouseenter', show);
    parent.addEventListener('mouseleave', hide);

    return () => {
      parent.removeEventListener('mouseenter', show);
      parent.removeEventListener('mouseleave', hide);
    };
  }, [attachToParent]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cursorRef}
          className={cn('pointer-events-none fixed left-0 top-0 z-50', className)}
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: '-50%',
            translateY: '-50%',
          }}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
