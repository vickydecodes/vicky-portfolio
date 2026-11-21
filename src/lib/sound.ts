/**
 * Synthesized Web Audio micro-sound engine (zero external audio files).
 * Ultra-subtle, tactile UI clicks and chimes with localStorage mute support.
 */

const STORAGE_KEY = "vicky_sound_muted"
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (isSoundMuted()) return null
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {})
  }
  return ctx
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) === "1"
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, muted ? "1" : "0")
}

/** Crisp tactile UI click (filter pills, ⌘K, nav) */
export function playTick() {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(980, now)
  osc.frequency.exponentialRampToValueAtTime(360, now + 0.025)
  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.03)
}

/** Tactile switch click + harmonic chime on theme ripple (light = bright rise, dark = calm drop) */
export function playThemeRipple(toDark: boolean) {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime

  // 1. Crisp switch click transient
  const clickOsc = c.createOscillator()
  const clickGain = c.createGain()
  clickOsc.type = "triangle"
  clickOsc.frequency.setValueAtTime(toDark ? 720 : 1040, now)
  clickOsc.frequency.exponentialRampToValueAtTime(220, now + 0.02)
  clickGain.gain.setValueAtTime(0.09, now)
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024)
  clickOsc.connect(clickGain)
  clickGain.connect(c.destination)
  clickOsc.start(now)
  clickOsc.stop(now + 0.026)

  // 2. Smooth glassy harmonic sweep matching the 380ms circular ripple
  const notes = toDark ? [520, 320] : [360, 620]
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = now + 0.015 + i * 0.055
    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(
      toDark ? freq * 0.78 : freq * 1.18,
      t + 0.16,
    )
    gain.gain.setValueAtTime(0.085, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.19)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.2)
  })
}

/** Clean two-note success pop (email copy) */
export function playPop() {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime
  ;[560, 840].forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = now + i * 0.05
    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.08, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  })
}

/** Subtle magnetic snap tick for Alt Figma Inspect hover */
export function playInspectTick() {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(1280, now)
  osc.frequency.exponentialRampToValueAtTime(720, now + 0.016)
  gain.gain.setValueAtTime(0.045, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.02)
}
