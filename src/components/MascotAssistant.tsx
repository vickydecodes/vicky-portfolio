import { useState, useEffect, useRef } from "react"
import { Trash2 } from "lucide-react"

import { useChatStore } from "src/store/useChatStore"

const speechLines = [
  "hii 👋",
  "ask me anything",
  "click me!",
  "psst, I'm real",
  "don't bin me! 🥺",
  "run /help inside me",
  "i wander around"
]

export default function MascotAssistant() {
  const { isChatOpen, setChatOpen, isMascotDismissed, setMascotDismissed } = useChatStore()
  const [position, setPosition] = useState({ x: 250, y: -200 })
  const [isBouncing, setIsBouncing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isHoveringDustbin, setIsHoveringDustbin] = useState(false)
  const [speechIndex, setSpeechIndex] = useState(0)
  const [showSpeech, setShowSpeech] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Dropping physics variables
  const isDroppingRef = useRef(true)
  const dropVelocity = useRef(0)

  const dragOffset = useRef({ x: 0, y: 0 })
  const velocity = useRef({ vx: 0.8, vy: 0.6 })
  const isWalking = useRef(true)
  const stateTimer = useRef<number>(0)
  const animationFrameId = useRef<number>(0)
  
  const isMouseDown = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)

  const mascotWidth = 48
  const hitboxWidth = 64
  const hitboxHeight = 108

  // Check prefers-reduced-motion
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(media.matches)
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [])

  // Speech bubble cycle
  useEffect(() => {
    if (isMascotDismissed) return
    const interval = setInterval(() => {
      setShowSpeech(false)
      setTimeout(() => {
        setSpeechIndex((prev) => (prev + 1) % speechLines.length)
        setShowSpeech(true)
      }, 300)
    }, 4500)
    return () => clearInterval(interval)
  }, [isMascotDismissed])

  // Mascot summon/un-dismiss drop trigger hook
  useEffect(() => {
    if (!isMascotDismissed) {
      isDroppingRef.current = true
      dropVelocity.current = 0
      const startX = window.innerWidth > 0 ? (window.innerWidth - 120 - Math.random() * 80) : 250
      setPosition({ x: startX, y: -200 })
    }
  }, [isMascotDismissed])

  // Physics & wandering loop
  useEffect(() => {
    if (isMascotDismissed || isChatOpen || isDragging || prefersReducedMotion) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      return
    }

    const updatePhysics = () => {
      // If dropping (superhero entrance), calculate acceleration and floor collision
      if (isDroppingRef.current) {
        setPosition((prev) => {
          const targetY = window.innerHeight - hitboxHeight - 20
          
          dropVelocity.current += 1.25 // Gravity acceleration
          let nextY = prev.y + dropVelocity.current
          
          if (nextY >= targetY) {
            nextY = targetY
            isDroppingRef.current = false
            // Impact squish effect (superhero landing duration)
            setIsBouncing(true)
            setTimeout(() => {
              setIsBouncing(false)
            }, 450)
            
            // Bounce upward slightly and kick off wandering direction
            dropVelocity.current = 0
            velocity.current.vx = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.4)
            velocity.current.vy = -0.6
          }
          return { x: prev.x, y: nextY }
        })
        
        animationFrameId.current = requestAnimationFrame(updatePhysics)
        return
      }

      setPosition((prev) => {
        let nextX = prev.x + (isWalking.current ? velocity.current.vx : 0)
        let nextY = prev.y + (isWalking.current ? velocity.current.vy : 0)

        const boundsRight = window.innerWidth - hitboxWidth
        const boundsBottom = window.innerHeight - hitboxHeight

        let bounced = false

        // Collision X
        if (nextX <= 0) {
          nextX = 0
          velocity.current.vx = Math.abs(velocity.current.vx)
          bounced = true
        } else if (nextX >= boundsRight) {
          nextX = boundsRight
          velocity.current.vx = -Math.abs(velocity.current.vx)
          bounced = true
        }

        // Collision Y
        if (nextY <= 0) {
          nextY = 0
          velocity.current.vy = Math.abs(velocity.current.vy)
          bounced = true
        } else if (nextY >= boundsBottom) {
          nextY = boundsBottom
          velocity.current.vy = -Math.abs(velocity.current.vy)
          bounced = true
        }

        if (bounced) {
          setIsBouncing(true)
          // Add a bit of randomness to direction on bounce
          velocity.current.vx += (Math.random() - 0.5) * 0.2
          velocity.current.vy += (Math.random() - 0.5) * 0.2
          
          // Constrain velocities to reasonable ranges
          const speed = Math.sqrt(velocity.current.vx ** 2 + velocity.current.vy ** 2)
          if (speed > 2.0) {
            velocity.current.vx = (velocity.current.vx / speed) * 1.5
            velocity.current.vy = (velocity.current.vy / speed) * 1.5
          } else if (speed < 0.4) {
            velocity.current.vx = (velocity.current.vx / speed) * 0.8
            velocity.current.vy = (velocity.current.vy / speed) * 0.8
          }
        }

        return { x: nextX, y: nextY }
      })

      // State machine for walking/pausing (wandering)
      stateTimer.current += 1
      if (stateTimer.current > 180 + Math.random() * 120) { // change state every 3-5 seconds
        stateTimer.current = 0
        isWalking.current = !isWalking.current
        if (isWalking.current) {
          // Set new random direction
          const angle = Math.random() * Math.PI * 2
          const speed = 0.5 + Math.random() * 0.5
          velocity.current.vx = Math.cos(angle) * speed
          velocity.current.vy = Math.sin(angle) * speed
        }
      }

      animationFrameId.current = requestAnimationFrame(updatePhysics)
    }

    animationFrameId.current = requestAnimationFrame(updatePhysics)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [isMascotDismissed, isChatOpen, isDragging, prefersReducedMotion])

  // Reset bounce state after animation finishes
  useEffect(() => {
    if (isBouncing) {
      const timer = setTimeout(() => setIsBouncing(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isBouncing])

  // Drag handlers
  const handleStartDrag = (clientX: number, clientY: number) => {
    isMouseDown.current = true
    hasDragged.current = false
    dragStartPos.current = { x: clientX, y: clientY }
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y
    }
  }

  const handleDrag = (clientX: number, clientY: number) => {
    if (!isMouseDown.current) return

    const dx = clientX - dragStartPos.current.x
    const dy = clientY - dragStartPos.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Only switch to dragging mode if moved more than 5px
    if (distance > 5 && !hasDragged.current) {
      hasDragged.current = true
      setIsDragging(true)
    }

    if (hasDragged.current) {
      const newX = clientX - dragOffset.current.x
      const newY = clientY - dragOffset.current.y

      // Keep within window boundary slightly
      const boundedX = Math.max(-20, Math.min(window.innerWidth - hitboxWidth + 20, newX))
      const boundedY = Math.max(-20, Math.min(window.innerHeight - hitboxHeight + 20, newY))

      setPosition({ x: boundedX, y: boundedY })

      // Check overlap with dustbin (bottom-right area or middle-right)
      const binLeft = window.innerWidth - 120
      const binRight = window.innerWidth - 10
      const binTop = window.innerHeight / 2 - 80
      const binBottom = window.innerHeight / 2 + 80

      const mascotCenterX = boundedX + hitboxWidth / 2
      const mascotCenterY = boundedY + hitboxHeight / 2

      const overlapping = 
        mascotCenterX >= binLeft && 
        mascotCenterX <= binRight && 
        mascotCenterY >= binTop && 
        mascotCenterY <= binBottom

      setIsHoveringDustbin(overlapping)
    }
  }

  const handleEndDrag = () => {
    if (!isMouseDown.current) return
    isMouseDown.current = false

    if (hasDragged.current) {
      setIsDragging(false)
      if (isHoveringDustbin) {
        setMascotDismissed(true)
        setIsHoveringDustbin(false)
      }
    } else {
      // Simple click! Open chat
      setChatOpen(true)
    }
  }

  // Global mouse/touch move event listeners to handle drag outside component
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDrag(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleMouseUp = () => {
      handleEndDrag()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging, isHoveringDustbin])

  if (isMascotDismissed) return null

  // Movement speed physics style
  const styleTransform = prefersReducedMotion
    ? "fixed bottom-6 right-6 z-45 animate-pulse"
    : `fixed top-0 left-0 z-45 select-none transition-transform duration-[80ms] ease-out`

  return (
    <>
      {/* Draggable Mascot container */}
      <div
        className={styleTransform}
        style={prefersReducedMotion ? undefined : {
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: "none"
        }}
      >
        {/* Interactive Speech Bubble */}
        {showSpeech && !isDragging && (
          <div className="absolute top-[12px] -translate-y-full left-1/2 -translate-x-1/2 bg-card text-foreground font-sans text-[10px] font-medium tracking-tight border border-border/25 px-2.5 py-1 rounded-md shadow-md whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200 select-none z-50">
            {speechLines[speechIndex]}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border/80 -z-10 translate-y-[1px]" />
          </div>
        )}

        {/* Mascot Body wrapper (hitbox larger than visual sprite) */}
        <div
          onMouseDown={(e) => {
            if (e.button !== 0) return // only left click
            e.preventDefault()
            handleStartDrag(e.clientX, e.clientY)
          }}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStartDrag(e.touches[0].clientX, e.touches[0].clientY)
            }
          }}
          className={`w-[64px] h-[108px] flex items-center justify-center cursor-grab active:cursor-grabbing relative group transition-transform ${
            isBouncing ? "scale-y-[0.80] scale-x-[1.20]" : ""
          } ${isDragging ? "scale-105 opacity-90 cursor-grabbing" : ""}`}
        >

          
          <img 
            src="/assets/minecraft_me.png" 
            alt="vicky mascot" 
            className="relative select-none pointer-events-none" 
            style={{ width: `${mascotWidth}px`, height: "auto", imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Dustbin container: visible only when dragging */}
      {isDragging && (
        <div
          className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center transition-all duration-200 ${
            isHoveringDustbin
              ? "border-red-500 bg-red-500/10 text-red-500 scale-110"
              : "border-border/60 bg-secondary/20 text-muted-foreground/60"
          } animate-in fade-in slide-in-from-right-4 duration-300`}
        >
          <Trash2 className={`h-7 w-7 transition-transform ${isHoveringDustbin ? "scale-110 rotate-6" : "animate-pulse"}`} />
          <span className="text-[9px] mt-1.5 font-bold uppercase tracking-wider">bin me</span>
        </div>
      )}
    </>
  )
}
