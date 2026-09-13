import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './DriftWall.css'

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const columnFactor = (index, variance) => 1 + variance * ((((index * .6180339887 + .35) % 1) * 2) - 1)

export default function DriftWall({
  items = [], columns = 5, tileWidth = 200, tileHeight = 132, gap = 18, radius = 14,
  tilt = 16, turn = -14, roll = 0, perspective = 1200, depth = 120, speed = 42,
  direction = 'up', variance = .45, parallax = .6, pauseOnHover = false, lift = 64,
  fade = .6, dim = .55, grayscale = false, overlayColor = '#060010', className = '',
  style, selectedIndex = null, onItemActivate,
}) {
  const containerRef = useRef(null)
  const planeRef = useRef(null)
  const trackRefs = useRef([])
  const offsetsRef = useRef([])
  const velocitiesRef = useRef([])
  const hoveredColRef = useRef(-1)
  const wallHoveredRef = useRef(false)
  const pointerRef = useRef({ x: 0, y: 0 })
  const pointerDampedRef = useRef({ x: 0, y: 0 })
  const panDampedRef = useRef(0)
  const lastTsRef = useRef(null)
  const rafRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(360)
  const [containerWidth, setContainerWidth] = useState(900)
  const [activeId, setActiveId] = useState(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = event => setReduced(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const columnItems = useMemo(() => {
    const safeColumns = Math.max(1, Math.min(columns, items.length || 1))
    const result = Array.from({ length: safeColumns }, () => [])
    items.forEach((item, index) => result[index % safeColumns].push({ ...item, originalIndex: index }))
    return result
  }, [columns, items])

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap
    return columnItems.map(column => {
      const copyHeight = Math.max(unit, column.length * unit)
      return { copyHeight, copies: Math.max(3, Math.ceil((containerHeight * 1.7) / copyHeight) + 1) }
    })
  }, [columnItems, containerHeight, gap, tileHeight])

  useLayoutEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 360)
      setContainerWidth(entry.contentRect.width || 900)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const baseVelocities = useMemo(() => columnItems.map((_, index) => {
    const sign = direction === 'up' ? 1 : -1
    return speed * columnFactor(index, variance) * sign * (index % 2 === 0 ? 1 : -1)
  }), [columnItems, direction, speed, variance])

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, index) => meta.copyHeight * ((index * .37) % 1))
    velocitiesRef.current = columnItems.map(() => 0)
  }, [columnItems, columnMeta])

  const applyPlaneTransform = useCallback((px, py, panX) => {
    if (!planeRef.current) return
    planeRef.current.style.transform = `translate(-50%, -50%) translate3d(${panX}px, 0, 0) scale(1.16) rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) translateZ(${-depth}px)`
  }, [depth, roll, tilt, turn])

  useEffect(() => {
    const animate = timestamp => {
      if (lastTsRef.current === null) lastTsRef.current = timestamp
      const dt = Math.min(.05, Math.max(0, timestamp - lastTsRef.current) / 1000)
      lastTsRef.current = timestamp
      const damp = 1 - Math.exp(-dt / .12)
      const selectedPointer = selectedIndex === null || columnItems.length < 2 ? 0 : (selectedIndex / (columnItems.length - 1) - .5)
      const targetPointerX = wallHoveredRef.current ? pointerRef.current.x : selectedPointer
      const maxTilt = reduced ? 0 : parallax * 8
      pointerDampedRef.current.x += (targetPointerX * maxTilt - pointerDampedRef.current.x) * damp
      pointerDampedRef.current.y += (-pointerRef.current.y * maxTilt - pointerDampedRef.current.y) * damp
      const planeWidth = columnItems.length * (tileWidth + gap) * 1.16
      const panRange = Math.max(0, planeWidth - containerWidth) + Math.min(120, tileWidth * .55)
      const targetPanX = -targetPointerX * panRange
      panDampedRef.current += (targetPanX - panDampedRef.current) * damp
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y, panDampedRef.current)

      columnMeta.forEach((meta, index) => {
        const paused = (wallHoveredRef.current && pauseOnHover) || hoveredColRef.current === index
        const target = reduced || paused ? 0 : baseVelocities[index]
        const ease = 1 - Math.exp(-dt / (target === 0 ? .16 : .28))
        velocitiesRef.current[index] += (target - (velocitiesRef.current[index] || 0)) * ease
        let next = (offsetsRef.current[index] || 0) + velocitiesRef.current[index] * dt
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight
        offsetsRef.current[index] = next
        if (trackRefs.current[index]) trackRefs.current[index].style.transform = `translate3d(0, ${-next}px, 0)`
      })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(rafRef.current); lastTsRef.current = null }
  }, [applyPlaneTransform, baseVelocities, columnItems.length, columnMeta, containerWidth, gap, parallax, pauseOnHover, reduced, selectedIndex, tileWidth])

  const cssVars = useMemo(() => ({
    '--dw-tile-w': `${tileWidth}px`, '--dw-tile-h': `${tileHeight}px`, '--dw-gap': `${gap}px`,
    '--dw-radius': `${radius}px`, '--dw-perspective': `${perspective}px`, '--dw-lift': `${lift}px`,
    '--dw-dim': dim, '--dw-gray': grayscale ? 1 : 0, '--dw-overlay': overlayColor,
    '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`, ...style,
  }), [dim, fade, gap, grayscale, lift, overlayColor, perspective, radius, style, tileHeight, tileWidth])

  const activate = (id, columnIndex) => { setActiveId(id); hoveredColRef.current = columnIndex }
  const release = () => { setActiveId(null); hoveredColRef.current = -1 }
  const choose = index => onItemActivate?.(selectedIndex === index ? null : index)

  return (
    <div ref={containerRef} className={`drift-wall ${reduced ? 'drift-wall--reduced' : ''} ${className}`.trim()} style={cssVars}
      role="group" aria-label="模块内容漂移陈列墙"
      onPointerEnter={() => { wallHoveredRef.current = true }}
      onPointerMove={event => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        pointerRef.current = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 }
      }}
      onPointerLeave={() => { wallHoveredRef.current = false; pointerRef.current = { x: 0, y: 0 }; release() }}>
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((column, columnIndex) => (
          <div className="drift-wall__col" key={`column-${columnIndex}`}>
            <div className="drift-wall__track" ref={element => { trackRefs.current[columnIndex] = element }}>
              {Array.from({ length: columnMeta[columnIndex].copies }, (_, copyIndex) => column.map((item, itemIndex) => {
                const id = `${columnIndex}-${copyIndex}-${itemIndex}`
                const active = activeId === id || selectedIndex === item.originalIndex
                return <button key={id} type="button" className={`drift-wall__tile ${active ? 'is-active' : ''}`} data-tile-id={id}
                  aria-label={`${item.value}：${item.label}`} onClick={() => choose(item.originalIndex)}
                  onPointerEnter={() => activate(id, columnIndex)} onPointerLeave={release}
                  onFocus={() => activate(id, columnIndex)} onBlur={release}>
                  <span className="drift-wall__inner">
                    <img src={item.image} alt="" loading="lazy" decoding="async" draggable={false} />
                    <span className="drift-wall__overlay" aria-hidden="true" />
                    <span className="drift-wall__content">
                      <strong>{item.value}</strong><span>{item.label}</span>{item.detail && <small>{item.detail}</small>}
                    </span>
                  </span>
                </button>
              }))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
