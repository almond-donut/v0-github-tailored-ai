"use client";

import { cn } from "@/lib/utils";
import { motion, MotionProps } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedSpanProps) => (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: delay / 1000 }}
    className={cn("grid text-sm font-normal tracking-tight", className)}
    {...props}
  >
    {children}
  </motion.div>
);

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export const TypingAnimation = ({
  children,
  className,
  duration = 60,
  delay = 0,
  as: Component = "span",
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string. Received:");
  }

  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState<string>("");
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-sm font-normal tracking-tight", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export const Terminal = ({
  children,
  className,
  onClose,
  onMinimize,
}: TerminalProps) => {
  return (
    <div
      className={cn(
        "z-0 h-full w-full rounded-xl border border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center gap-y-2 border-b border-border p-3">
        <div className="flex flex-row gap-x-2">
          <button
            onClick={onClose}
            className="h-3 w-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            aria-label="Close"
          ></button>
          <button
            onClick={onMinimize}
            className="h-3 w-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
            aria-label="Minimize"
          ></button>
          <div
            className="h-3 w-3 rounded-full bg-green-500"
            aria-label="Maximize"
          ></div>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100%-40px)] p-4">
        <pre>
          <code className="grid gap-y-1">{children}</code>
        </pre>
      </div>
    </div>
  );
};
