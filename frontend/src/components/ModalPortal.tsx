"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
  children: React.ReactNode;
}

// Minimal focus trap utility: cycle focus within the modal
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    '*[tabindex]:not([tabindex="-1"])',
    '*[contenteditable=true]'
  ];
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')));
  return nodes.filter(el => el.offsetParent !== null || el === document.activeElement);
}

export default function ModalPortal({ isOpen, onClose, labelledBy, describedBy, children }: ModalPortalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<Element | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    lastActiveRef.current = document.activeElement;
    // Prevent body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab' && containerRef.current) {
        const focusables = getFocusableElements(containerRef.current);
        if (focusables.length === 0) {
          (containerRef.current as HTMLElement).focus();
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !containerRef.current.contains(active)) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (active === last || !containerRef.current.contains(active)) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Restore focus to invoking element
      if (lastActiveRef.current instanceof HTMLElement) {
        try { lastActiveRef.current.focus(); } catch {}
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!isOpen || typeof window === 'undefined') return null;

  const portalTarget = document.getElementById('modal-root') || document.body;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" aria-hidden={!isOpen}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="relative z-[9999] pointer-events-auto focus:outline-none max-h-[90vh] overflow-auto"
        ref={containerRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, portalTarget);
}
