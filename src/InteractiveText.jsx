import DepthText from './DepthText'

export default function InteractiveText({ children, className = '', accent = '#b98a31', floating = false }) {
  return (
    <DepthText
      text={String(children)}
      layers={floating ? 24 : 8}
      depth={floating ? .82 : .34}
      tilt={floating ? 6 : 9}
      smoothing={floating ? .12 : .16}
      perspective={floating ? 960 : 720}
      autoOrbit={floating}
      orbitSpeed={floating ? .075 : 0}
      pointerTracking
      faceColor="currentColor"
      depthColor={accent}
      fontSize="inherit"
      fontWeight="inherit"
      shadow={false}
      className={`interactive-depth-text ${floating ? 'floating-subtitle' : ''} ${className}`.trim()}
    />
  )
}
