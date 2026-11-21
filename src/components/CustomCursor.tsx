import { useEffect, useState, useRef } from "react"

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false)
  const [isHidden, setIsHidden] = useState(true)
  
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Detect touch device
    const isTouch = window.matchMedia("(pointer: coarse)").matches
    if (isTouch) return

    const handleMouseMove = (e: MouseEvent) => {
      setIsHidden(false)
      const x = e.clientX
      const y = e.clientY
      
      // Inline centering translation (translate(-50%, -50%)) must be set directly in JS
      // to avoid being wiped out when custom style.transform values are applied.
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
    }

    const handleMouseLeave = () => {
      setIsHidden(true)
    }

    const handleMouseEnter = () => {
      setIsHidden(false)
    }

    // Monitor hover on clickable items
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return
      
      const isClickable = 
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest(".cursor-pointer") ||
        target.closest(".cursor-grab") ||
        target.classList.contains("cursor-pointer")

      setIsHovered(!!isClickable)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)
    window.addEventListener("mouseover", handleMouseOver)

    // Add class to body to hide native cursor
    document.body.classList.add("custom-cursor-active")

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
      window.removeEventListener("mouseover", handleMouseOver)
      document.body.classList.remove("custom-cursor-active")
    }
  }, [])

  if (isHidden) return null

  return (
    <>
      {/* Outer Ring Positioning Wrapper (Spring lag tracking) */}
      <div
        ref={ringRef}
        className="fixed pointer-events-none z-[9999] flex items-center justify-center"
        style={{
          left: 0,
          top: 0,
          transition: "transform 0.08s cubic-bezier(0.25, 1, 0.5, 1)",
          transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)"
        }}
      >
        {/* Inner Animating Ring (Quiet Linear-minimal solid ring) */}
        <div
          className={`rounded-full border transition-all duration-200 ease-out ${
            isHovered
              ? "w-[30px] h-[30px] border-foreground/45 bg-foreground/[0.05]"
              : "w-[18px] h-[18px] border-foreground/25 bg-transparent"
          }`}
        />
      </div>

      {/* Inner Dot Positioning Wrapper (Instant tracking) */}
      <div
        ref={dotRef}
        className="fixed pointer-events-none z-[9999] flex items-center justify-center"
        style={{
          left: 0,
          top: 0,
          transition: "transform 0s",
          transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)"
        }}
      >
        {/* Crisp center dot */}
        <div
          className={`rounded-full bg-foreground transition-all duration-200 ease-out ${
            isHovered
              ? "w-[5px] h-[5px] opacity-90"
              : "w-[3.5px] h-[3.5px] opacity-75"
          }`}
        />
      </div>
    </>
  )
}
