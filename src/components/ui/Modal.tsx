"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }: ModalProps) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const raf = window.requestAnimationFrame(() => {
      dialogRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.({ preventScroll: true });
      previousFocusRef.current = null;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : "Details modal"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: reducedMotion ? 0.14 : 0.18, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: reducedMotion ? 0.1 : 0.14, ease: EASE_OUT } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close modal backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-default"
          />
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            style={{ transformOrigin: "center" }}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, transform: "scale(0.95)", filter: "blur(2px)" }
            }
            animate={
              reducedMotion
                ? { opacity: 1, transition: { duration: 0.16, ease: EASE_OUT } }
                : {
                    opacity: 1,
                    transform: "scale(1)",
                    filter: "blur(0px)",
                    transition: { duration: 0.22, ease: EASE_OUT },
                  }
            }
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } }
                : {
                    opacity: 0,
                    transform: "scale(0.96)",
                    filter: "blur(2px)",
                    transition: { duration: 0.14, ease: EASE_OUT },
                  }
            }
            className={`relative z-10 w-full ${maxWidth} liquid-glass-card liquid-glass-card--cyan liquid-glass-card--showcase rounded-[28px] overflow-hidden text-slate-100 my-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70`}
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/12 bg-space-950/55">
              {title ? (
                <h2 id={titleId} className="font-subhead text-lg font-semibold tracking-wide text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mars-500" aria-hidden="true" />
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <LiquidGlassButton
                type="button"
                variant="glass"
                size="icon"
                onClick={onClose}
                aria-label="Close dialog"
                contentClassName="min-w-[38px] min-h-[38px] p-2"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </LiquidGlassButton>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
