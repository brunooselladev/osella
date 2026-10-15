'use client'

// A soft, warm room for reflections and for the glass fruit to refract. Rendered once (frames=1)
// into the scene's environment map; the day scales its intensity.

// ===== External modules =====
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

// ===== Component: Reflections =====

export const Reflections = () => (
  <Environment frames={1} resolution={256}>
    {/* a warm grey sphere so nothing reflects pure black */}
    <mesh scale={30}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial color="#d9c6a6" side={THREE.BackSide} />
    </mesh>
    {/* the roof glass, both side walls, the end wall, and the floor */}
    <Lightformer form="rect" intensity={2.4} color="#fff6e6" position={[0, 6, 10]} rotation-x={Math.PI / 2} scale={[6, 20, 1]} />
    <Lightformer form="rect" intensity={1.4} color="#fbeed6" position={[-5, 2.5, 10]} rotation-y={Math.PI / 2} scale={[20, 2.6, 1]} />
    <Lightformer form="rect" intensity={1.1} color="#f7e6c8" position={[5, 2.5, 10]} rotation-y={-Math.PI / 2} scale={[20, 2.6, 1]} />
    <Lightformer form="rect" intensity={0.6} color="#ffd8a8" position={[0, 1.2, -6]} scale={[4, 2.4, 1]} />
    <Lightformer form="rect" intensity={0.5} color="#2b2c25" position={[0, -2, 10]} rotation-x={-Math.PI / 2} scale={[8, 22, 1]} />
  </Environment>
)
