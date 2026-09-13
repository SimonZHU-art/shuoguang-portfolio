import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'

export default function CinematicEffects({ phase }) {
  const inside = phase === 'room' || phase === 'entering'
  return (
    <EffectComposer multisampling={0}>
      {inside && <DepthOfField focusDistance={.07} focalLength={.018} bokehScale={.75} height={360} />}
      <Bloom intensity={.42} luminanceThreshold={.72} mipmapBlur />
      <Noise opacity={.014} />
      <Vignette eskil={false} offset={.22} darkness={.66} />
    </EffectComposer>
  )
}
