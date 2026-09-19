import { Html, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { lazy, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import DepthText from './DepthText'
import DriftWall from './DriftWall'
import InteractiveText from './InteractiveText'
import Plasma from './Plasma'

const CinematicEffects = lazy(() => import('./CinematicEffects'))
const asset = path => `${import.meta.env.BASE_URL}assets/${path}`

const GOLD = '#d6a43b'
const DOOR_ASSETS = {
  profile: asset('door-profile-stag.jpg'),
  projects: asset('door-projects-raven.jpg'),
  strengths: asset('door-strengths-lion.jpg'),
}
const DRIFT_VISUALS = {
  profile: [asset('door-profile-stag.jpg'), asset('dark-deco-avatar-v3.jpg'), asset('portfolio-triptych.jpg')],
  projects: [asset('portfolio-triptych.jpg'), asset('dark-deco-triptych.jpg'), asset('door-projects-raven.jpg')],
  strengths: [asset('door-strengths-lion.jpg'), asset('dark-deco-butler-v2.jpg'), asset('dark-deco-triptych.jpg'), asset('door-profile-stag.jpg')],
}

function DecoPillar({ x, z = 0 }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, .1, 0]}><boxGeometry args={[.48, 4.8, .65]} /><meshStandardMaterial color="#050916" metalness={.35} roughness={.65} /></mesh>
      <mesh position={[0, 2.25, .05]}><boxGeometry args={[.86, .22, .78]} /><meshStandardMaterial color={GOLD} metalness={.75} roughness={.28} /></mesh>
      <mesh position={[0, -2.1, .05]}><boxGeometry args={[.92, .28, .82]} /><meshStandardMaterial color="#151b35" metalness={.45} roughness={.6} /></mesh>
      {[1.35, .88, .42].map((y, i) => <mesh key={y} position={[0, y, .36]}><boxGeometry args={[.12 + i * .05, .58, .08]} /><meshBasicMaterial color={GOLD} toneMapped={false} /></mesh>)}
    </group>
  )
}

function WallSconce({ x, color = GOLD }) {
  return (
    <group position={[x, 1.45, .42]}>
      <mesh><boxGeometry args={[.16, 1.28, .16]} /><meshStandardMaterial color="#171322" metalness={.78} roughness={.3} /></mesh>
      {[0, .17, -.17].map((offset, index) => (
        <mesh key={offset} position={[offset, .48 - Math.abs(offset) * 1.1, .04]} scale={[index ? .62 : .78, 1, 1]}>
          <octahedronGeometry args={[.25, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.1} roughness={.42} />
        </mesh>
      ))}
      <pointLight position={[0, .42, .42]} color={color} intensity={2.2} distance={3.5} />
    </group>
  )
}

function DoorTitleLights() {
  return (
    <group>
      {[-1.16, 1.16].map(x => (
        <group key={x} position={[x, 3.47, .52]}>
          <mesh position={[0, .12, 0]}><cylinderGeometry args={[.018, .018, .28, 16]} /><meshStandardMaterial color="#6e471e" metalness={.88} roughness={.24} /></mesh>
          <mesh position={[0, -.06, 0]}><cylinderGeometry args={[.08, .17, .15, 24]} /><meshStandardMaterial color="#9b6a2c" metalness={.82} roughness={.28} /></mesh>
          <mesh position={[0, -.15, .015]}><sphereGeometry args={[.048, 20, 14]} /><meshBasicMaterial color="#ffe0a0" toneMapped={false} /></mesh>
          <pointLight position={[0, -.18, .04]} color="#f3cd82" intensity={.42} distance={1.45} decay={2} />
        </group>
      ))}
      <spotLight position={[-1.16, 3.34, .55]} target-position={[-.42, 2.5, .05]} color="#f0c979" intensity={4.8} distance={3.4} angle={.58} penumbra={1} />
      <spotLight position={[1.16, 3.34, .55]} target-position={[.42, 2.5, .05]} color="#f0c979" intensity={4.8} distance={3.4} angle={.58} penumbra={1} />
    </group>
  )
}

function Vitrine({ x, variant = 0 }) {
  return (
    <group position={[x, -1.03, -.15]}>
      <mesh position={[0, .18, 0]}><boxGeometry args={[1.35, .42, .92]} /><meshStandardMaterial color="#050812" metalness={.6} roughness={.35} /></mesh>
      <mesh position={[0, .43, 0]}><boxGeometry args={[1.5, .08, 1.02]} /><meshStandardMaterial color={GOLD} metalness={.82} roughness={.2} /></mesh>
      <mesh position={[0, 1.1, 0]}><boxGeometry args={[1.18, 1.28, .72]} /><meshPhysicalMaterial color="#1c2f62" transparent opacity={.2} roughness={.08} metalness={.15} transmission={.16} /></mesh>
      {variant === 0 && <mesh position={[0, 1.08, 0]} rotation={[0, .65, 0]}><torusKnotGeometry args={[.24, .07, 72, 8]} /><meshStandardMaterial color={GOLD} metalness={.82} roughness={.24} /></mesh>}
      {variant === 1 && <group position={[0, .98, 0]}>{[-.28, 0, .28].map((px, i) => <mesh key={px} position={[px, i * .12, 0]}><boxGeometry args={[.13, .42 + i * .22, .16]} /><meshStandardMaterial color={i === 1 ? '#9d211d' : GOLD} metalness={.7} roughness={.3} /></mesh>)}</group>}
    </group>
  )
}

function OrnateDoorLeaf({ x, moduleId }) {
  const source = useTexture(DOOR_ASSETS[moduleId])
  const map = useMemo(() => {
    const cloned = source.clone()
    cloned.colorSpace = THREE.SRGBColorSpace
    cloned.wrapS = THREE.ClampToEdgeWrapping
    cloned.repeat.set(.5, 1)
    cloned.offset.set(x < 0 ? 0 : .5, 0)
    cloned.anisotropy = 8
    cloned.needsUpdate = true
    return cloned
  }, [source, x])
  useEffect(() => () => map.dispose(), [map])
  return (
    <group position={[x, 1.22, -.08]}>
      <mesh castShadow receiveShadow><boxGeometry args={[1.94, 4.62, .46]} /><meshStandardMaterial color="#160b06" roughness={.72} metalness={.08} /></mesh>
      <mesh position={[0, 0, .238]}><planeGeometry args={[1.9, 4.56]} /><meshStandardMaterial map={map} roughness={.52} metalness={.08} emissive="#1b0b04" emissiveIntensity={.08} /></mesh>
      <mesh position={[0, -2.27, .3]}><boxGeometry args={[2.02, .16, .13]} /><meshStandardMaterial color="#6e491d" metalness={.74} roughness={.34} /></mesh>
      <mesh position={[0, 2.27, .3]}><boxGeometry args={[2.02, .1, .11]} /><meshStandardMaterial color="#9b6b2b" metalness={.78} roughness={.3} /></mesh>
    </group>
  )
}

function ArchiveTunnel({ accent }) {
  const ribs = [-.55, -1.35, -2.15, -3.05, -4.05, -5.15]
  return (
    <group>
      <mesh position={[0, 1.2, -6.05]}>
        <planeGeometry args={[4.26, 4.68]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-2.08, 1.18, -3.08]}>
        <boxGeometry args={[.28, 4.76, 5.85]} />
        <meshStandardMaterial color="#020204" roughness={.92} />
      </mesh>
      <mesh position={[2.08, 1.18, -3.08]}>
        <boxGeometry args={[.28, 4.76, 5.85]} />
        <meshStandardMaterial color="#020204" roughness={.92} />
      </mesh>
      <mesh position={[0, 3.5, -3.08]}>
        <boxGeometry args={[4.32, .2, 5.85]} />
        <meshStandardMaterial color="#010103" roughness={.94} />
      </mesh>
      <mesh position={[0, -1.12, -3.08]}>
        <boxGeometry args={[4.32, .16, 5.85]} />
        <meshStandardMaterial color="#030205" roughness={.86} metalness={.12} />
      </mesh>
      {ribs.map((z, index) => {
        const fade = 1 - index / ribs.length
        return (
          <group key={z} position={[0, 0, z]}>
            <mesh position={[-1.96, 1.18, 0]}><boxGeometry args={[.095, 4.58, .11]} /><meshStandardMaterial color="#4a2f17" metalness={.62} roughness={.48} transparent opacity={.46 * fade + .08} /></mesh>
            <mesh position={[1.96, 1.18, 0]}><boxGeometry args={[.095, 4.58, .11]} /><meshStandardMaterial color="#4a2f17" metalness={.62} roughness={.48} transparent opacity={.46 * fade + .08} /></mesh>
            <mesh position={[0, 3.42, 0]}><boxGeometry args={[4.02, .095, .11]} /><meshStandardMaterial color="#6b451f" metalness={.68} roughness={.42} transparent opacity={.42 * fade + .06} /></mesh>
          </group>
        )
      })}
      <mesh position={[0, -1.025, -3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[.72, 5.4]} />
        <meshBasicMaterial color={accent} transparent opacity={.055} />
      </mesh>
      <pointLight position={[0, .65, -4.8]} color={accent} intensity={.28} distance={3.8} />
    </group>
  )
}

function DecoFloor() {
  return (
    <group position={[0, -1.755, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2, 3].map(index => <mesh key={index} position={[0, 0, index * .025]}><ringGeometry args={[1.3 + index * 1.1, 1.34 + index * 1.1, 96, 1, Math.PI * .06, Math.PI * .88]} /><meshBasicMaterial color={index % 2 ? '#243f84' : GOLD} transparent opacity={.36 - index * .045} toneMapped={false} /></mesh>)}
      {[-1.05, -.7, -.35, 0, .35, .7, 1.05].map(angle => <mesh key={angle} rotation={[0, 0, angle]} position={[0, 3.2, .11]}><boxGeometry args={[.025, 6.4, .02]} /><meshBasicMaterial color={GOLD} transparent opacity={.24} /></mesh>)}
    </group>
  )
}

function Avatar({ selected, moving, direction, reducedMotion, onSelect, phase }) {
  const group = useRef()
  const ring = useRef()
  const material = useRef()
  const poseStart = useRef(0)
  const previousPhase = useRef(phase)
  const idleTexture = useTexture(asset('dark-deco-butler-v2.jpg'))
  const uniforms = useMemo(() => ({
    uIdleMap: { value: idleTexture },
    uQuarterMap: { value: idleTexture },
    uMidMap: { value: idleTexture },
    uThreeQuarterMap: { value: idleTexture },
    uInspectMap: { value: idleTexture },
    uPose: { value: 0 },
    uReveal: { value: selected ? 1 : .52 },
    uTime: { value: 0 },
    uMoving: { value: 0 },
    uDirection: { value: 1 },
  }), [idleTexture])
  useEffect(() => {
    idleTexture.colorSpace = THREE.NoColorSpace
    idleTexture.anisotropy = 4
    idleTexture.needsUpdate = true
  }, [idleTexture])
  useEffect(() => {
    if (!selected) return undefined
    let cancelled = false
    const loaded = []
    const targets = [
      ['uQuarterMap', asset('dark-deco-butler-inspect-quarter-v1.jpg')],
      ['uMidMap', asset('dark-deco-butler-inspect-mid-v1.jpg')],
      ['uThreeQuarterMap', asset('dark-deco-butler-inspect-three-quarter-v1.jpg')],
      ['uInspectMap', asset('dark-deco-butler-inspect-v1.jpg')],
    ]
    const loader = new THREE.TextureLoader()
    targets.forEach(([uniform, url]) => loader.load(url, texture => {
      if (cancelled) { texture.dispose(); return }
      texture.colorSpace = THREE.NoColorSpace
      texture.anisotropy = 4
      texture.needsUpdate = true
      uniforms[uniform].value = texture
      loaded.push(texture)
    }))
    return () => { cancelled = true; loaded.forEach(texture => texture.dispose()) }
  }, [selected, uniforms])
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (previousPhase.current !== phase) { previousPhase.current = phase; poseStart.current = t }
    const bob = !reducedMotion ? (moving ? Math.abs(Math.sin(t * 8.5)) * .075 : Math.sin(t * (selected ? 1.6 : 1.35)) * (selected ? .012 : .038)) : 0
    group.current.position.y = .29 + bob
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, moving ? -direction * .035 : 0, 7, delta)
    material.current.uniforms.uTime.value = t
    material.current.uniforms.uMoving.value = THREE.MathUtils.damp(material.current.uniforms.uMoving.value, moving ? 1 : 0, 6, delta)
    material.current.uniforms.uDirection.value = THREE.MathUtils.damp(material.current.uniforms.uDirection.value, direction, 4, delta)
    material.current.uniforms.uReveal.value = THREE.MathUtils.damp(material.current.uniforms.uReveal.value, selected ? 1 : .52, reducedMotion ? 20 : 2.8, delta)
    const inspecting = phase === 'entering'
    const rawPose = inspecting ? THREE.MathUtils.clamp((t - poseStart.current) / (reducedMotion ? .08 : 1.16), 0, 1) : 0
    material.current.uniforms.uPose.value = rawPose * rawPose * (3 - 2 * rawPose)
    if (ring.current) {
      const pulse = 1 + Math.sin(t * 3.2) * .07
      ring.current.scale.setScalar(pulse)
      ring.current.rotation.z += delta * .25
    }
  })
  return (
    <group ref={group} position={[.18, .29, 3.45]} onClick={onSelect} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
      <mesh renderOrder={8}>
        <planeGeometry args={[2.72, 4.08, 28, 34]} />
        <shaderMaterial ref={material} transparent depthWrite={false} uniforms={uniforms}
          vertexShader={`uniform float uTime; uniform float uMoving; uniform float uDirection; varying vec2 vUv; void main(){ vUv=uv; vec3 p=position; float tails=(1.0-smoothstep(.32,.72,uv.y))*smoothstep(.08,.27,uv.y); float sleeve=smoothstep(.23,.39,abs(uv.x-.5))*(1.0-smoothstep(.46,.5,abs(uv.x-.5)))*smoothstep(.35,.54,uv.y)*(1.0-smoothstep(.72,.86,uv.y)); p.x+=sin(uTime*1.8+uv.y*7.)*.015*tails*(.2+uMoving); p.x+=uDirection*uMoving*.045*sleeve; p.y+=sin(uTime*1.35)*.007+uMoving*.018*sleeve; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`}
          fragmentShader={`uniform sampler2D uIdleMap; uniform sampler2D uQuarterMap; uniform sampler2D uMidMap; uniform sampler2D uThreeQuarterMap; uniform sampler2D uInspectMap; uniform float uPose; uniform float uReveal; varying vec2 vUv; float cutout(vec4 c){ float hi=max(c.r,max(c.g,c.b)); float lo=min(c.r,min(c.g,c.b)); return (lo>.66&&hi-lo<.05)?0.0:1.0; } float grain(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } void main(){ vec4 idle=texture2D(uIdleMap,vUv); vec4 quarter=texture2D(uQuarterMap,vUv); vec4 mid=texture2D(uMidMap,vUv); vec4 threeQuarter=texture2D(uThreeQuarterMap,vUv); vec4 inspect=texture2D(uInspectMap,vUv); float segment=floor(min(uPose,.9999)*4.0); float localPose=fract(min(uPose,.9999)*4.0); float blend=smoothstep(.56,1.0,localPose); vec4 fromColor=idle; vec4 toColor=quarter; if(segment>2.5){ fromColor=threeQuarter; toColor=inspect; } else if(segment>1.5){ fromColor=mid; toColor=threeQuarter; } else if(segment>.5){ fromColor=quarter; toColor=mid; } float fromMask=cutout(fromColor); float toMask=cutout(toColor); float mask=mix(fromMask,toMask,blend); if(mask<.012) discard; vec3 rgb=(fromColor.rgb*fromMask*(1.0-blend)+toColor.rgb*toMask*blend)/max(mask,.001); rgb=pow(rgb,vec3(2.12)); float luma=dot(rgb,vec3(.299,.587,.114)); rgb=mix(vec3(luma),rgb,.62); vec3 patina=vec3(luma*1.05,luma*.95,luma*.8); rgb=mix(rgb,patina,.12); rgb*=vec3(1.045,.985,.88); float keyLight=exp(-8.0*dot(vUv-vec2(.69,.62),vUv-vec2(.69,.62))); float falloff=.88+.12*smoothstep(.03,.54,vUv.y)*(1.0-.2*abs(vUv.x-.5)); rgb*=falloff; rgb+=vec3(.035,.024,.011)*keyLight; float matte=(grain(floor(vUv*vec2(760.0,1140.0)))-.5)*.012; rgb+=vec3(matte*.8,matte*.7,matte*.52); rgb*=uReveal; gl_FragColor=vec4(max(rgb,vec3(0.0)),mask); }`} />
      </mesh>
      <mesh position={[0, -2.05, -.04]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, .38, 1]}><circleGeometry args={[.7, 48]} /><meshBasicMaterial color="#02030a" transparent opacity={.56} depthWrite={false} /></mesh>
      {selected && <mesh ref={ring} position={[0, -2.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.78, .025, 12, 64]} /><meshBasicMaterial color={GOLD} toneMapped={false} /></mesh>}
    </group>
  )
}

function RoomBoard({ module, focused, setFocused, leaveRoom }) {
  const wallItems = useMemo(() => module.exhibits.map((item, index) => ({
    ...item,
    image: DRIFT_VISUALS[module.id][index % DRIFT_VISUALS[module.id].length],
  })), [module])
  return (
    <Html transform center position={[0, 1.28, 1.1]} distanceFactor={.96} zIndexRange={[20, 0]}>
      <section className="room-board" aria-label={module.label}>
        <div className="room-plasma"><Plasma color={module.sideColor} speed={.42} direction="pingpong" scale={1.14} opacity={.46} mouseInteractive renderScale={.42} maxDpr={1.25} targetFps={36} iterations={42} /></div>
        <div className="room-board__content">
        <p className="room-eyebrow">{module.label}</p>
        <DepthText text={module.title} layers={28} depth={1.4} faceColor="#eee8d8" depthColor={module.sideColor} tilt={5} smoothing={.12} perspective={1100} orbitSpeed={.16} fontSize="clamp(2.8rem, 7vw, 7.2rem)" fontWeight={700} />
        <p className="room-intro">{module.intro}</p>
        <p className="room-body">{module.body}</p>
        <div className={`room-drift-wall room-drift-wall--${module.id}`}>
          <DriftWall items={wallItems} columns={module.exhibits.length} tileWidth={218} tileHeight={148} gap={14}
            radius={0} tilt={8} turn={-8} perspective={1050} depth={74} speed={11} direction="up"
            variance={.32} parallax={.35} lift={42} fade={.42} dim={.68} grayscale
            overlayColor="#05070f" selectedIndex={focused} onItemActivate={setFocused}
            style={{ '--dw-accent': module.sideColor }} />
        </div>
        <button className="room-exit" type="button" aria-label="返回走廊" onClick={leaveRoom}><InteractiveText accent={module.sideColor}>S / Esc　返回走廊</InteractiveText></button>
        </div>
      </section>
    </Html>
  )
}

function Hall({ module, phase, selected, focused, setFocused, leaveRoom, reducedMotion }) {
  const doors = useRef()
  const light = useRef()
  const spot = useRef()
  const phaseStart = useRef(0)
  const previousPhase = useRef(phase)
  const texture = useTexture(asset('dark-deco-triptych.jpg'))
  const map = useMemo(() => {
    const cloned = texture.clone()
    cloned.colorSpace = THREE.SRGBColorSpace
    cloned.wrapS = THREE.RepeatWrapping
    cloned.repeat.set(1 / 3, 1)
    cloned.offset.set(module.id === 'profile' ? 0 : module.id === 'projects' ? 1 / 3 : 2 / 3, 0)
    cloned.anisotropy = 8
    cloned.needsUpdate = true
    return cloned
  }, [texture, module.id])
  useEffect(() => () => map.dispose(), [map])
  useFrame(({ clock }, delta) => {
    if (previousPhase.current !== phase) { previousPhase.current = phase; phaseStart.current = clock.elapsedTime }
    const open = phase === 'room' || (phase === 'entering' && clock.elapsedTime - phaseStart.current > (reducedMotion ? 0 : .62))
    doors.current.children[0].position.x = THREE.MathUtils.damp(doors.current.children[0].position.x, open ? -2.48 : -.95, reducedMotion ? 20 : 4.2, delta)
    doors.current.children[1].position.x = THREE.MathUtils.damp(doors.current.children[1].position.x, open ? 2.48 : .95, reducedMotion ? 20 : 4.2, delta)
    const glow = selected ? 2.3 + Math.sin(clock.elapsedTime * 1.4) * .35 : .36
    light.current.intensity = THREE.MathUtils.damp(light.current.intensity, glow, reducedMotion ? 20 : 2.5, delta)
    spot.current.intensity = THREE.MathUtils.damp(spot.current.intensity, selected ? 25 : 4.2, reducedMotion ? 20 : 2.15, delta)
  })
  return (
    <group>
      <mesh position={[0, 1.3, -2.05]}><planeGeometry args={[15, 7.2]} /><meshBasicMaterial map={map} color="#8a9fd5" transparent opacity={.4} /></mesh>
      <mesh position={[0, 1.3, -2]}><planeGeometry args={[15.2, 7.4]} /><meshBasicMaterial color="#03050b" transparent opacity={.2} /></mesh>
      <mesh position={[0, -1.78, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 18]} /><meshStandardMaterial color="#060919" metalness={.5} roughness={.5} /></mesh>
      <DecoFloor />
      {[-6.6, -4.7, 4.7, 6.6].map(x => <DecoPillar key={x} x={x} z={-.25} />)}
      <WallSconce x={-3.72} color={module.sideColor} /><WallSconce x={3.72} color={module.sideColor} />
      <Vitrine x={-3.45} variant={0} /><Vitrine x={3.45} variant={1} />
      {[-2.8, -1.4, 0, 1.4, 2.8].map(x => <mesh key={x} position={[x, 3.93, 1.2]}><boxGeometry args={[.055, .28, 7]} /><meshStandardMaterial color={GOLD} metalness={.82} roughness={.25} /></mesh>)}
      <mesh position={[0, 3.58, -.35]}><boxGeometry args={[10.2, .22, .62]} /><meshStandardMaterial color={GOLD} metalness={.8} roughness={.25} /></mesh>
      <mesh position={[0, 3.28, -.29]}><boxGeometry args={[6.2, .1, .54]} /><meshStandardMaterial color="#101a38" metalness={.62} roughness={.4} /></mesh>
      <mesh position={[0, 3.06, -.25]}><boxGeometry args={[5.45, .09, .48]} /><meshStandardMaterial color={GOLD} metalness={.8} roughness={.25} /></mesh>
      <mesh position={[0, -.98, -.3]}><boxGeometry args={[4.9, .24, .7]} /><meshStandardMaterial color={GOLD} metalness={.76} roughness={.3} /></mesh>
      <ArchiveTunnel accent={module.sideColor} />
      <group ref={doors}>
        <OrnateDoorLeaf x={-.95} moduleId={module.id} />
        <OrnateDoorLeaf x={.95} moduleId={module.id} />
      </group>
      <mesh position={[0, 3.2, .04]}><torusGeometry args={[2.28, .055, 10, 72, Math.PI]} /><meshBasicMaterial color={GOLD} toneMapped={false} /></mesh>
      {phase === 'corridor' && <DoorTitleLights />}
      {phase === 'corridor' && <Html center position={[0, 3.02, .44]} zIndexRange={[8, 0]}><div className={`door-identity door-identity--${module.id}`} style={{ '--door-accent': module.sideColor }}><i className="door-identity__aura" aria-hidden="true"><b /><b /><b /></i><span>{module.label}</span><strong><DepthText text={module.title} layers={18} depth={.72} faceColor="#f1e7cf" depthColor={module.sideColor} tilt={3} smoothing={.12} perspective={900} orbitSpeed={.06} fontSize="18px" fontWeight={400} /></strong></div></Html>}
      <pointLight ref={light} position={[0, 2.7, 1.2]} color={module.sideColor} intensity={2.5} distance={9} />
      <spotLight ref={spot} position={[0, 5.7, 3]} target-position={[0, 0, 0]} angle={.48} penumbra={.85} intensity={selected ? 25 : 4.2} color="#d7b66d" castShadow={false} />
      {phase === 'room' && <RoomBoard module={module} focused={focused} setFocused={setFocused} leaveRoom={leaveRoom} />}
    </group>
  )
}

function CameraRig({ phase, moveKey, direction, reducedMotion }) {
  const { camera, clock } = useThree()
  const start = useRef(0)
  const previous = useRef(moveKey)
  const phaseStart = useRef(0)
  const previousPhase = useRef(phase)
  useFrame((_, delta) => {
    if (previous.current !== moveKey) { previous.current = moveKey; start.current = clock.elapsedTime }
    if (previousPhase.current !== phase) { previousPhase.current = phase; phaseStart.current = clock.elapsedTime }
    const age = clock.elapsedTime - start.current
    const phaseAge = clock.elapsedTime - phaseStart.current
    const travel = age < .72 && !reducedMotion ? Math.sin(Math.min(1, age / .72) * Math.PI) : 0
    const room = phase === 'room' || (phase === 'entering' && phaseAge > (reducedMotion ? 0 : .94))
    camera.position.x = THREE.MathUtils.damp(camera.position.x, travel * direction * 1.9, 5, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, room ? 1.15 : 1.5, 4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, room ? 4.05 : 8.4, reducedMotion ? 20 : 3.2, delta)
    camera.lookAt(0, room ? 1.15 : .75, 0)
  })
  return null
}

function LightingCue({ selected, reducedMotion }) {
  const ambient = useRef()
  const key = useRef()
  useFrame((_, delta) => {
    const speed = reducedMotion ? 20 : 2.25
    ambient.current.intensity = THREE.MathUtils.damp(ambient.current.intensity, selected ? .56 : .18, speed, delta)
    key.current.intensity = THREE.MathUtils.damp(key.current.intensity, selected ? 2.2 : .48, speed, delta)
  })
  return (
    <>
      <ambientLight ref={ambient} intensity={selected ? .56 : .18} color="#405e9c" />
      <directionalLight ref={key} position={[-5, 7, 6]} intensity={selected ? 2.2 : .48} color="#d9b56a" />
    </>
  )
}

export default function Experience({ module, phase, selected, moving, moveKey, direction, reducedMotion, onSelect, focused, setFocused, leaveRoom }) {
  return (
    <>
      <color attach="background" args={['#03050b']} />
      <fog attach="fog" args={['#03050b', 7.5, 19]} />
      <LightingCue selected={selected} reducedMotion={reducedMotion} />
      <Hall module={module} phase={phase} selected={selected} focused={focused} setFocused={setFocused} leaveRoom={leaveRoom} reducedMotion={reducedMotion} />
      {phase !== 'room' && <Avatar selected={selected} moving={moving} direction={direction} reducedMotion={reducedMotion} onSelect={onSelect} phase={phase} />}
      <CameraRig phase={phase} moveKey={moveKey} direction={direction} reducedMotion={reducedMotion} />
      {!reducedMotion && selected && <CinematicEffects phase={phase} />}
    </>
  )
}
