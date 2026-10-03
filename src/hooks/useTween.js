import { useEffect, useRef, useState } from 'react'

// Smoothly moves an array of numbers toward a new target. Jumps straight there when the
// system asks for reduced motion. `target` must keep the same reference until it really changes.
export function useTween(target, ms = 450) {
  const [value, setValue] = useState(target)
  const last = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    cancelAnimationFrame(raf.current)
    if (reduce) { last.current = target; setValue(target); return }
    const from = last.current
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      const cur = target.map((v, i) => (from[i] ?? v) + (v - (from[i] ?? v)) * e)
      last.current = cur
      setValue(cur)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return value
}
