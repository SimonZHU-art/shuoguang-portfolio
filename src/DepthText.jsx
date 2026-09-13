import { useEffect, useMemo, useRef } from 'react'
import './DepthText.css'

const MAX_LAYERS = 64
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const layerColor = (face, depth, index, total) => {
  const progress = total <= 1 ? 1 : index / total
  const faceMix = Math.round((1 - progress * progress) * 72 + 4)
  return `color-mix(in srgb, ${face} ${faceMix}%, ${depth})`
}

export default function DepthText({
  text = 'Elevate', layers = 34, depth = 2.4, faceColor = '#f8fafc',
  depthColor = '#7c3aed', tilt = 7.5, pointerTracking = true,
  smoothing = 0.14, perspective = 900, autoOrbit = true,
  orbitSpeed = 0.35, fontSize = 'clamp(3rem, 12vw, 7rem)',
  fontWeight = 900, shadow = true, className = '', style = {}
}) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS)
  const safeDepth = clamp(Number(depth) || 0, 0, 12)
  const safeTilt = clamp(Number(tilt) || 0, 0, 12)
  const safeSmoothing = clamp(Number(smoothing) || .14, .02, .35)
  const safePerspective = clamp(Number(perspective) || 900, 300, 2000)
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2)
  const baseRotation = useMemo(() => ({ x: -safeTilt * .32, y: safeTilt * .42 }), [safeTilt])
  const depthLayers = useMemo(() => Array.from({ length: safeLayers }, (_, i) => {
    const index = safeLayers - i
    return { index, color: layerColor(faceColor, depthColor, index, safeLayers), transform: `translateZ(${-index * safeDepth}px)` }
  }), [safeLayers, safeDepth, faceColor, depthColor])

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const canTrack = pointerTracking && finePointer && !reduced
    const current = { ...baseRotation }
    const target = { ...baseRotation }
    let active = false
    let frameId = 0
    const started = performance.now()
    const apply = () => { stage.style.transform = `rotateX(${current.x.toFixed(3)}deg) rotateY(${current.y.toFixed(3)}deg)` }
    if (reduced) { apply(); return }
    const move = event => {
      const rect = root.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      active = true
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * .8), -1, 1)
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * .8), -1, 1)
      target.x = baseRotation.x - y * safeTilt
      target.y = baseRotation.y + x * safeTilt
    }
    const leave = () => { active = false; Object.assign(target, baseRotation) }
    if (canTrack) {
      root.addEventListener('pointermove', move)
      root.addEventListener('pointerleave', leave)
      window.addEventListener('blur', leave)
    }
    const tick = now => {
      if ((!canTrack || !active) && autoOrbit) {
        const orbit = ((now - started) / 1000) * safeOrbitSpeed * Math.PI * 2
        const amount = canTrack ? .18 : .55
        target.x = baseRotation.x + Math.sin(orbit) * safeTilt * amount
        target.y = baseRotation.y + Math.cos(orbit * .85) * safeTilt * amount
      }
      current.x += (target.x - current.x) * safeSmoothing
      current.y += (target.y - current.y) * safeSmoothing
      apply()
      frameId = requestAnimationFrame(tick)
    }
    apply(); frameId = requestAnimationFrame(tick)
    return () => {
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      cancelAnimationFrame(frameId)
    }
  }, [autoOrbit, baseRotation, pointerTracking, safeOrbitSpeed, safeSmoothing, safeTilt])

  return (
    <span ref={rootRef} className={`depth-text ${className}`.trim()} style={{
      ...style,
      '--depth-text-perspective': `${safePerspective}px`, '--depth-text-font-size': fontSize,
      '--depth-text-font-weight': fontWeight, '--depth-text-face-color': faceColor,
      '--depth-text-depth-color': depthColor,
      '--depth-text-shadow': shadow ? `0 22px 34px color-mix(in srgb, ${depthColor} 36%, transparent), 0 4px 8px rgba(0,0,0,.28)` : 'none'
    }}>
      <span ref={stageRef} className="depth-text__stage">
        {depthLayers.map(layer => <span aria-hidden="true" className="depth-text__layer" key={layer.index} style={{ color: layer.color, transform: layer.transform }}>{text}</span>)}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  )
}
