import React, { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience'
import DepthText from './DepthText'
import InteractiveText from './InteractiveText'
import { MODULES } from './portfolioData'
import './styles.css'

const asset = path => `${import.meta.env.BASE_URL}assets/${path}`

const mod = (value, length) => ((value % length) + length) % length

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function createSoundEngine() {
  let context
  const ensure = () => {
    if (!context) context = new (window.AudioContext || window.webkitAudioContext)()
    if (context.state === 'suspended') context.resume()
    return context
  }
  const tone = (frequency, duration, type = 'sine', gain = .035, delay = 0) => {
    const ctx = ensure()
    const oscillator = ctx.createOscillator()
    const volume = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * .68), ctx.currentTime + delay + duration)
    volume.gain.setValueAtTime(.0001, ctx.currentTime + delay)
    volume.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + .018)
    volume.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delay + duration)
    oscillator.connect(volume).connect(ctx.destination)
    oscillator.start(ctx.currentTime + delay)
    oscillator.stop(ctx.currentTime + delay + duration + .02)
  }
  return {
    activate: () => { ensure(); tone(196, .34, 'sine', .035); tone(392, .42, 'triangle', .018, .06) },
    move: () => { tone(92, .13, 'triangle', .045); tone(78, .12, 'triangle', .035, .24); tone(124, .18, 'sine', .025, .47) },
    enter: () => { tone(110, .65, 'sawtooth', .03); tone(220, .8, 'sine', .035, .12); tone(440, .52, 'triangle', .018, .28) },
    leave: () => { tone(330, .45, 'triangle', .025); tone(110, .72, 'sine', .035, .14) },
    focus: () => { tone(520, .18, 'sine', .02); tone(780, .22, 'triangle', .012, .04) },
  }
}

function Fallback({ onChoose }) {
  return (
    <main className="fallback" style={{ backgroundImage: `linear-gradient(rgba(3,5,11,.42),rgba(3,5,11,.9)), url('${asset('dark-deco-triptych.jpg')}')` }}>
      <h1>Shuoguang Zhu</h1>
      <p>你的浏览器暂时无法显示 3D 场景，仍可直接访问全部内容。</p>
      <div>{MODULES.map((item, index) => <button key={item.id} aria-label={`打开${item.label}`} onClick={() => onChoose(index)}><InteractiveText accent={item.sideColor}>{item.label}</InteractiveText><span><InteractiveText accent={item.sideColor}>{item.title}</InteractiveText></span></button>)}</div>
    </main>
  )
}

function ContactEnvelope({ onClose }) {
  const closeRef = useRef(null)
  useEffect(() => { closeRef.current?.focus() }, [])
  return (
    <div className="contact-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-title">
        <button ref={closeRef} className="contact-dialog__close" type="button" onClick={onClose} aria-label="关闭联系方式">×</button>
        <div className="contact-envelope">
          <div className="contact-envelope__back" />
          <article className="contact-letter">
            <p>PRIVATE CORRESPONDENCE</p>
            <h2 id="contact-title">联系朱烁光</h2>
            <dl>
              <div><dt>邮箱</dt><dd><a href="mailto:shuoguangzhu@gmail.com">shuoguangzhu@gmail.com</a></dd></div>
              <div><dt>电话</dt><dd>待补充</dd></div>
              <div><dt>微信</dt><dd>alddmxy0602wdt</dd></div>
            </dl>
            <div className="contact-letter__wechat">
              <img src={asset('wechat-qr-jujuon.jpg')} alt="朱烁光的微信二维码" />
            </div>
            <small>期待与你交换想法、作品与新的可能。</small>
          </article>
          <div className="contact-envelope__front" />
          <div className="contact-envelope__flap" />
          <span className="contact-envelope__seal">SZ</span>
        </div>
      </section>
    </div>
  )
}

function App() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [supported] = useState(() => {
    try { const canvas = document.createElement('canvas'); return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')) } catch { return false }
  })
  const [phase, setPhase] = useState('idle')
  const [selected, setSelected] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [moving, setMoving] = useState(false)
  const [direction, setDirection] = useState(1)
  const [moveKey, setMoveKey] = useState(0)
  const [focused, setFocusedState] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [muted, setMuted] = useState(() => reducedMotion || sessionStorage.getItem('portfolio-muted') === 'true')
  const sound = useRef(null)
  const timers = useRef([])
  const module = MODULES[activeIndex]

  const later = useCallback((callback, ms) => {
    const id = window.setTimeout(callback, reducedMotion ? Math.min(ms, 80) : ms)
    timers.current.push(id)
  }, [reducedMotion])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const play = useCallback(name => { if (!muted && sound.current?.[name]) sound.current[name]() }, [muted])

  const selectAvatar = useCallback(() => {
    if (selected || phase !== 'idle') return
    sound.current = createSoundEngine()
    if (!muted) sound.current.activate()
    setSelected(true)
    setPhase('corridor')
  }, [muted, phase, selected])

  const shift = useCallback(dir => {
    if (phase !== 'corridor' || moving || !selected) return
    setDirection(dir); setMoving(true); setMoveKey(value => value + 1); play('move')
    later(() => setActiveIndex(index => mod(index + dir, MODULES.length)), 260)
    later(() => setMoving(false), 720)
  }, [later, moving, phase, play, selected])

  const enterRoom = useCallback(() => {
    if (phase !== 'corridor' || moving || !selected) return
    setPhase('entering'); setFocusedState(null); play('enter')
    later(() => setPhase('room'), 1700)
  }, [later, moving, phase, play, selected])

  const leaveRoom = useCallback(() => {
    if (focused !== null) { setFocusedState(null); play('focus'); return }
    if (phase !== 'room' && phase !== 'entering') return
    setPhase('leaving'); play('leave'); later(() => setPhase('corridor'), 680)
  }, [focused, later, phase, play])

  const exitArchive = useCallback(() => {
    if (phase !== 'corridor' || moving || !selected) return
    setPhase('leaving'); setSelected(false); setFocusedState(null); play('leave')
    later(() => { setActiveIndex(0); setPhase('idle') }, 780)
  }, [later, moving, phase, play, selected])

  const setFocused = useCallback(value => { setFocusedState(value); play('focus') }, [play])

  useEffect(() => {
    const keydown = event => {
      if (event.key === 'Escape' && contactOpen) { setContactOpen(false); return }
      if (event.key === 'Escape' && helpOpen) { setHelpOpen(false); return }
      const key = event.key.toLowerCase()
      if (['a', 'd', 'w', 's', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'escape'].includes(key)) event.preventDefault()
      if (phase === 'room') {
        if (key === 'a' || key === 'arrowleft') setFocused(mod((focused ?? 0) - 1, module.exhibits.length))
        if (key === 'd' || key === 'arrowright') setFocused(mod((focused ?? -1) + 1, module.exhibits.length))
        if (key === 's' || key === 'arrowdown' || key === 'escape') leaveRoom()
        return
      }
      if (phase === 'entering') {
        if (key === 's' || key === 'arrowdown' || key === 'escape') leaveRoom()
        return
      }
      if (phase === 'corridor' && (key === 's' || key === 'arrowdown' || key === 'escape')) { exitArchive(); return }
      if (key === 'a' || key === 'arrowleft') shift(-1)
      if (key === 'd' || key === 'arrowright') shift(1)
      if (key === 'w' || key === 'arrowup') enterRoom()
    }
    window.addEventListener('keydown', keydown, { passive: false })
    return () => window.removeEventListener('keydown', keydown)
  }, [contactOpen, enterRoom, exitArchive, focused, helpOpen, leaveRoom, module.exhibits.length, phase, setFocused, shift])

  const toggleMute = () => {
    const next = !muted
    sessionStorage.setItem('portfolio-muted', String(next)); setMuted(next)
    if (!next && selected) { sound.current ||= createSoundEngine(); sound.current.activate() }
  }

  if (!supported) return <Fallback onChoose={index => { setActiveIndex(index); setSelected(true); setPhase('room') }} />

  return (
    <main className={`world phase-${phase} ${moving ? 'is-moving' : ''} ${!selected && phase === 'leaving' ? 'is-exiting-archive' : ''}`}>
      <a className="skip-link" href="#accessible-content">跳到内容</a>
      <header className="hud">
        <div className="hud-left">
          <button className="crest" type="button" onClick={() => { setFocusedState(null); setPhase(selected ? 'corridor' : 'idle') }} aria-label="返回走廊首页">
            <span className="crest__orbit" aria-hidden="true" />
            <b className="crest__monogram" aria-hidden="true">SZ</b>
          </button>
          <div className="hud-tools">
            <button className={muted ? 'is-muted' : ''} type="button" onClick={toggleMute} aria-label={muted ? '开启声音' : '关闭声音'} data-tip={muted ? '开启声音' : '关闭声音'}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" />{muted ? <path d="m17 9 4 6m0-6-4 6" /> : <><path d="M16 9.2a4 4 0 0 1 0 5.6" /><path d="M18.5 6.7a7.5 7.5 0 0 1 0 10.6" /></>}</svg>
            </button>
            <button type="button" aria-label="查看操作说明" data-tip="操作说明" onClick={() => setHelpOpen(value => !value)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M9.8 9.2a2.4 2.4 0 1 1 3.1 2.3c-.9.4-.9 1-.9 1.8" /><path d="M12 16.8h.01" /></svg>
            </button>
          </div>
        </div>
        <nav aria-label="作品集模块">{MODULES.map((item, index) => <button key={item.id} aria-label={`前往${item.label}`} className={index === activeIndex ? 'is-active' : ''} onClick={() => { if (!selected) selectAvatar(); setActiveIndex(index); setPhase('corridor'); setFocusedState(null) }}><InteractiveText accent={item.sideColor}>{item.label}</InteractiveText></button>)}</nav>
        <div className="hud-actions">
          <button type="button" aria-label="查看联系方式" onClick={() => setContactOpen(true)}><InteractiveText>联系我</InteractiveText></button>
        </div>
      </header>

      <div className="canvas-shell" aria-label="Dark Deco 三维作品集场景">
        <SceneBoundary fallback={<Fallback onChoose={setActiveIndex} />}>
          <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.5, 8.4], fov: 44, near: .1, far: 60 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={() => setReady(true)}>
            <Suspense fallback={null}>
              <Experience module={module} phase={phase} selected={selected} moving={moving} moveKey={moveKey} direction={direction} reducedMotion={reducedMotion} onSelect={selectAvatar} focused={focused} setFocused={setFocused} leaveRoom={leaveRoom} />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      </div>
      {!ready && <div className="loading"><span />正在打开夜色档案馆</div>}

      {phase === 'idle' && <section className="intro">
        <div className="intro__invitation">
          <DepthText className="archive-title" text="朱烁光档案室" layers={28} depth={1.2} faceColor="#f4e8c8" depthColor="#bd8124" tilt={4} smoothing={.12} perspective={1100} orbitSpeed={.12} fontSize="clamp(2.8rem, 6.2vw, 6.8rem)" fontWeight={700} />
        </div>
      </section>}
      {phase === 'idle' && <button className="sr-only" type="button" aria-label="点击背影，进入档案馆" onClick={selectAvatar}>进入档案馆</button>}

      {selected && phase === 'corridor' && <div className="corridor-status" aria-live="polite">
        <DepthText key={module.id} className="corridor-title" text={module.title} layers={24} depth={1.05} faceColor="#f4eedf" depthColor={module.sideColor} tilt={5} smoothing={.1} perspective={980} orbitSpeed={.1} fontSize="clamp(1.75rem, 3vw, 2.8rem)" fontWeight={650} />
      </div>}

      {helpOpen && <aside className="help-panel" aria-label="操作说明">
        <button onClick={() => setHelpOpen(false)} aria-label="关闭操作说明"><InteractiveText>×</InteractiveText></button>
        <p>走廊操作</p><dl><div><dt>A / D</dt><dd>在门厅之间移动</dd></div><div><dt>W</dt><dd>进入当前模块</dd></div><div><dt>S / Esc</dt><dd>退出模块；在走廊再次按下可离开档案室</dd></div></dl>
      </aside>}

      {contactOpen && <ContactEnvelope onClose={() => setContactOpen(false)} />}

      {selected && <div className="touch-controls" aria-label="触屏控制">
        <button onClick={() => shift(-1)} aria-label="向左移动"><InteractiveText>A</InteractiveText></button>{selected && phase === 'corridor' && <button onClick={exitArchive} aria-label="退出档案室"><InteractiveText>S</InteractiveText></button>}<button onClick={() => phase === 'room' ? leaveRoom() : enterRoom()} aria-label={phase === 'room' ? '退出模块' : '进入模块'}><InteractiveText>{phase === 'room' ? 'S' : 'W'}</InteractiveText></button><button onClick={() => shift(1)} aria-label="向右移动"><InteractiveText>D</InteractiveText></button>
      </div>}

      <section id="accessible-content" className="sr-only" aria-live="polite">
        <h1>{module.label}：{module.title}</h1><p>{module.intro}</p><p>{module.body}</p><ul>{module.exhibits.map(item => <li key={item.value}>{item.value}：{item.label} {item.detail}</li>)}</ul>
      </section>
    </main>
  )
}

const rootElement = document.getElementById('root')
const root = globalThis.__DARK_DECO_ROOT__ ||= createRoot(rootElement)
root.render(<App />)
