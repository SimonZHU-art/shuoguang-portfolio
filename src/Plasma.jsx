import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle } from 'ogl'
import './Plasma.css'

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255] : [1, .5, .2]
}

const vertex = `#version 300 es
precision highp float;
in vec2 position; in vec2 uv; out vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position,0.0,1.0); }`

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution; uniform float iTime; uniform vec3 uCustomColor;
uniform float uSpeed; uniform float uDirection; uniform float uScale; uniform float uOpacity;
uniform vec2 uMouse; uniform float uMouseInteractive; uniform float uQuality; uniform float uStepScale;
out vec4 fragColor;
void mainImage(out vec4 o, vec2 C){
  vec2 center=iResolution.xy*.5; C=(C-center)/uScale+center;
  C+=(uMouse-center)*.0002*length(C-center)*step(.5,uMouseInteractive);
  float i,d,z,T=iTime*uSpeed*uDirection; vec3 O,p,S;
  for(vec2 r=iResolution.xy,Q; ++i<60.; O+=o.w/d*o.xyz){
    p=z*normalize(vec3(C-.5*r,r.y)); p.z-=4.; S=p; d=p.y-T;
    p.x+=.4*(1.+p.y)*sin(d+p.x*.1)*cos(.34*d+p.x*.05);
    Q=p.xz*=mat2(cos(p.y+vec4(0,11,33,0)-T));
    z+=d=(abs(sqrt(length(Q*Q))-.25*(5.+S.y))/3.+8e-4)*uStepScale;
    o=1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
    if(i>=uQuality) break;
  }
  o.xyz=tanh(O/1e4);
}
bool finite1(float x){ return !(isnan(x)||isinf(x)); }
void main(){
  vec4 o=vec4(0.); mainImage(o,gl_FragCoord.xy);
  vec3 rgb=vec3(finite1(o.r)?o.r:0.,finite1(o.g)?o.g:0.,finite1(o.b)?o.b:0.);
  float intensity=(rgb.r+rgb.g+rgb.b)/3.; vec3 finalColor=intensity*uCustomColor;
  fragColor=vec4(finalColor,length(rgb)*uOpacity);
}`

export default function Plasma({ color = '#ffffff', speed = 1, direction = 'forward', scale = 1, opacity = 1, mouseInteractive = true, renderScale = .55, maxDpr = 1.5, targetFps = 60, iterations = 60 }) {
  const containerRef = useRef(null)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer
    try { renderer = new Renderer({ webgl: 2, alpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, maxDpr) }) } catch { return }
    const gl = renderer.gl
    const canvas = gl.canvas
    Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' })
    container.appendChild(canvas)
    const geometry = new Triangle(gl)
    const program = new Program(gl, { vertex, fragment, transparent: true, uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) }, uCustomColor: { value: new Float32Array(hexToRgb(color)) },
      uSpeed: { value: speed * .4 }, uDirection: { value: direction === 'reverse' ? -1 : 1 }, uScale: { value: scale }, uOpacity: { value: opacity },
      uMouse: { value: new Float32Array([0, 0]) }, uMouseInteractive: { value: mouseInteractive ? 1 : 0 }, uQuality: { value: Math.min(60, iterations) }, uStepScale: { value: 60 / Math.max(1, iterations) },
    } })
    const mesh = new Mesh(gl, { geometry, program })
    let raf = 0
    let last = 0
    let visible = true
    let pendingMouse = null
    const resize = () => {
      const rect = container.getBoundingClientRect()
      renderer.setSize(Math.max(1, rect.width * renderScale), Math.max(1, rect.height * renderScale))
      Object.assign(canvas.style, { width: '100%', height: '100%' })
      program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight])
    }
    const ro = new ResizeObserver(resize); ro.observe(container); resize()
    const mouseMove = event => { const rect = container.getBoundingClientRect(); pendingMouse = [event.clientX - rect.left, event.clientY - rect.top] }
    if (mouseInteractive) container.addEventListener('mousemove', mouseMove, { passive: true })
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0 }); io.observe(container)
    const t0 = performance.now(); const interval = 1000 / targetFps
    const loop = time => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden || time - last < interval) return
      last = time
      if (pendingMouse) { program.uniforms.uMouse.value.set(pendingMouse); pendingMouse = null }
      const elapsed = (time - t0) * .001
      program.uniforms.iTime.value = direction === 'pingpong' ? Math.sin(elapsed * .32) * 5 : elapsed
      renderer.render({ scene: mesh })
    }
    if (reduced) renderer.render({ scene: mesh }); else raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); container.removeEventListener('mousemove', mouseMove); canvas.remove() }
  }, [color, speed, direction, scale, opacity, mouseInteractive, renderScale, maxDpr, targetFps, iterations])
  return <div ref={containerRef} className="plasma-container" aria-hidden="true" />
}
