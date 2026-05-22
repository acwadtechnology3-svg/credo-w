import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion'

function WLogoMesh({ mouse }) {
  const group = useRef()
  const matRef = useRef()

  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 1.2
    const h = 0.9
    s.moveTo(-w, h)
    s.lineTo(-w * 0.55, -h)
    s.lineTo(0, h * 0.35)
    s.lineTo(w * 0.55, -h)
    s.lineTo(w, h)
    s.lineTo(w * 0.65, h)
    s.lineTo(0, -h * 0.15)
    s.lineTo(-w * 0.65, h)
    s.closePath()
    return s
  }, [])

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 4,
    }),
    []
  )

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.35) * 0.25 + (mouse.current.x || 0) * 0.35
    group.current.rotation.x = (mouse.current.y || 0) * 0.2
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.35 + Math.sin(t * 1.2) * 0.15
    }
  })

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          ref={matRef}
          color="#c8c8d8"
          metalness={0.92}
          roughness={0.18}
          emissive="#7c3aed"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Purple gem inserts at peaks */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.22]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.12, 0.2, 3]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#ec4899"
            emissiveIntensity={1.2}
            metalness={0.3}
            roughness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  )
}

function OrbitRing({ radius, speed, tilt = 0 }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed
  })
  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh ref={ref}>
        <torusGeometry args={[radius, 0.008, 8, 128]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.35} />
      </mesh>
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

function Scene({ mouse }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-3, 2, -4]} intensity={0.6} color="#a855f7" />
      <pointLight position={[0, 2, 3]} intensity={1.2} color="#7c3aed" distance={8} />
      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
        <WLogoMesh mouse={mouse} />
      </Float>
      <OrbitRing radius={1.65} speed={0.25} tilt={0.6} />
      <OrbitRing radius={1.95} speed={-0.18} tilt={-0.4} />
      <OrbitRing radius={2.25} speed={0.12} tilt={0.2} />
      <Environment preset="city" />
    </>
  )
}

function HeroCanvas({ onMouseMove }) {
  const mouse = useRef({ x: 0, y: 0 })

  const handlePointerMove = (e) => {
    mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
    mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    onMouseMove?.(e)
  }

  return (
    <Canvas
      className="ld-hero-canvas"
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onPointerMove={handlePointerMove}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Scene mouse={mouse} />
      </Suspense>
    </Canvas>
  )
}

export default function HeroLogoScene(props) {
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return (
      <div
        className="ld-hero-canvas ld-glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 420,
          background: 'linear-gradient(160deg, rgba(124,58,237,0.3), rgba(3,3,8,0.95))',
        }}
      >
        <span
          className="ld-gradient-text"
          style={{ fontSize: 'clamp(6rem, 18vw, 10rem)', fontWeight: 900, fontFamily: 'var(--ld-font-display)' }}
        >
          W
        </span>
      </div>
    )
  }

  return <HeroCanvas {...props} />
}
