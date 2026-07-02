"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  animation?: "reveal" | "fade-in" | "scale-in"
  delay?: number
  as?: "div" | "section"
}

export function AnimatedSection({
  children,
  className = "",
  animation = "reveal",
  delay = 0,
  as: Tag = "div",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`animate-${animation}${revealed ? " revealed" : ""} ${className}`}
      style={revealed ? {} : { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
