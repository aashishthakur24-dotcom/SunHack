import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment, Float } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function GlassCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.2}>
      <mesh ref={meshRef} scale={2.6}>
        <boxGeometry args={[1, 1, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.6}
          chromaticAberration={0.25}
          anisotropy={0.4}
          distortion={0.5}
          distortionScale={0.6}
          temporalDistortion={0.1}
          iridescence={1.2}
          iridescenceIOR={1.2}
          iridescenceThicknessRange={[0, 1600]}
          color="#00f0ff"
          roughness={0.08}
          transmission={0.95}
        />
      </mesh>
      {/* Glowing wireframe */}
      <mesh scale={2.65}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.18} />
      </mesh>
    </Float>
  );
}

function NeuralParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.018;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#8b5cf6" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

/** Exported as an isolated right-side 3D canvas — no absolute fill */
export default function HeroScene({ isolated = false }: { isolated?: boolean }) {
  if (isolated) {
    return (
      <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={1} color="#00f0ff" />
            <pointLight position={[-5, -5, 5]} intensity={0.6} color="#8b5cf6" />
            <pointLight position={[0, 5, -5]} intensity={0.3} color="#ffffff" />
            <GlassCube />
            <NeuralParticles />
            <Environment preset="night" />
          </Suspense>
        </Canvas>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#00f0ff" />
          <pointLight position={[-5, -5, 5]} intensity={0.5} color="#8b5cf6" />
          <GlassCube />
          <NeuralParticles />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}
