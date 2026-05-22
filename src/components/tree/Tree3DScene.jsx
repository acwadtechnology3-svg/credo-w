import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Text } from '@react-three/drei'
import * as THREE from 'three'

function NetworkNode({ position, color, label, isRoot, onClick }) {
  const mesh = useRef()
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.15
    }
  })
  return (
    <Float speed={isRoot ? 1.2 : 2} rotationIntensity={0.1} floatIntensity={0.4}>
      <mesh ref={mesh} position={position} onClick={onClick}>
        <sphereGeometry args={[isRoot ? 0.35 : 0.22, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isRoot ? 0.85 : 0.55}
          metalness={0.6}
          roughness={0.2}
        />
        {label && (
          <Text position={[0, 0.45, 0]} fontSize={0.12} color="#F5F4FF" anchorX="center">
            {label}
          </Text>
        )}
      </mesh>
    </Float>
  )
}

function BvParticle({ curve, color }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      const t = (state.clock.elapsedTime * 0.25) % 1
      ref.current.position.copy(curve.getPointAt(t))
    }
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function TreeStructure({ tree, config, onNodeSelect }) {
  const nodes = useMemo(() => {
    const list = []
    const walk = (n, depth = 0, x = 0, branch = 'center') => {
      if (!n || depth > (config.maxDepth || 4)) return
      const spread = 2.2 / (depth + 1)
      const y = -depth * 1.4
      list.push({
        id: n.id,
        position: [x, y, 0],
        color:
          branch === 'L'
            ? config.nodeColors?.left || '#C4B8FF'
            : branch === 'R'
              ? config.nodeColors?.right || '#6BE4FF'
              : config.nodeColors?.self || '#7B6CF6',
        label: n.username?.slice(0, 8) || '—',
        isRoot: depth === 0,
        userId: n.user_id,
      })
      if (n.left) walk(n.left, depth + 1, x - spread, 'L')
      if (n.right) walk(n.right, depth + 1, x + spread, 'R')
    }
    if (tree) walk(tree)
    return list
  }, [tree, config])

  const particles = useMemo(() => {
    if (!config.particleFlow) return []
    return [
      { curve: new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1.5, -1.4, 0)]), color: '#C4B8FF' },
      { curve: new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.5, -1.4, 0)]), color: '#6BE4FF' },
    ]
  }, [config.particleFlow])

  return (
    <group>
      {nodes.map((n) => (
        <NetworkNode
          key={n.id}
          position={n.position}
          color={n.color}
          label={n.label}
          isRoot={n.isRoot}
          onClick={() => onNodeSelect?.(n)}
        />
      ))}
      {particles.map((p, i) => (
        <BvParticle key={i} curve={p.curve} color={p.color} />
      ))}
    </group>
  )
}

export default function Tree3DScene({ tree, config = {}, onNodeSelect, className = '' }) {
  return (
    <div className={`tree-3d-canvas ${className}`}>
      <Canvas camera={{ position: [0, 1.5, 6], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#05060D']} />
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 6, 4]} intensity={1.2} color="#7B6CF6" />
        <pointLight position={[-4, -2, 2]} intensity={0.6} color="#6BE4FF" />
        <Suspense fallback={null}>
          <TreeStructure tree={tree} config={config} onNodeSelect={onNodeSelect} />
        </Suspense>
        <OrbitControls enablePan enableZoom maxDistance={12} minDistance={3} />
      </Canvas>
    </div>
  )
}
