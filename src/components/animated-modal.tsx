"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

interface AnimatedModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function AnimatedModal({ open, onClose, title, children }: AnimatedModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className="animate-overlay-in pointer-events-none absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{
          animation: "fade-in 200ms ease-out forwards",
        }}
      />
      <div
        ref={contentRef}
        className="animate-modal-in relative z-10 w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-navy-700 dark:bg-navy-800"
        style={{
          animation: "scale-in 250ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-navy-700 dark:hover:text-neutral-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
