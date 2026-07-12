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
        {/* Inner Animating Ring (Decoupled to rotate without affecting translation) */}
        <div
          className={`rounded-full border border-primary/75 mix-blend-difference transition-all duration-300 ease-in-out ${
            isHovered 
              ? "w-[36px] h-[36px] border-dashed border-primary/90 animate-[spin_8s_linear_infinite]" 
              : "w-[20px] h-[20px] border-solid"
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
        {/* Inner Animating Dot (Pulsates slightly when locked-on/hovered) */}
        <div
          className={`rounded-full bg-primary mix-blend-difference transition-all duration-300 ease-in-out ${
            isHovered 
              ? "w-[8px] h-[8px] animate-pulse" 
              : "w-[4px] h-[4px]"
          }`}
        />
      </div>
    </>
  )
}
