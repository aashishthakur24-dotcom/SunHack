import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { motion, useInView } from "framer-motion";

interface GraphNode { pos: [number, number, number]; color: string; }

function GraphNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const nodes: GraphNode[] = useMemo(() => [
    { pos: [0, 0, 0], color: "#52dac4" },
    { pos: [2, 1.5, -1], color: "#a855f7" },
    { pos: [-2, 1, 0.5], color: "#34d399" },
    { pos: [1.5, -1.5, 1], color: "#fbbf24" },
    { pos: [-1.5, -1, -1], color: "#60a5fa" },
    { pos: [0, 2, 1], color: "#f87171" },
    { pos: [-1, -2, 0], color: "#52dac4" },
    { pos: [2.5, 0, -0.5], color: "#a855f7" },
    { pos: [-0.5, 0.8, 2], color: "#34d399" },
  ], []);

  const edges = useMemo(() => {
    const e: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const d = new THREE.Vector3(...nodes[i].pos).distanceTo(new THREE.Vector3(...nodes[j].pos));
        if (d < 3.2) e.push([i, j]);
      }
    return e;
  }, [nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04 + mouse.x * 0.25;
      groupRef.current.rotation.x = mouse.y * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <mesh key={i} position={n.pos as [number, number, number]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={1.2} />
        </mesh>
      ))}
      {edges.map(([a, b], i) => {
        const start = new THREE.Vector3(...nodes[a].pos);
        const end = new THREE.Vector3(...nodes[b].pos);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const dir = end.clone().sub(start);
        const len = dir.length();
        return (
          <mesh key={i} position={mid} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())}>
            <cylinderGeometry args={[0.007, 0.007, len, 4]} />
            <meshStandardMaterial color="#52dac4" emissive="#52dac4" emissiveIntensity={0.4} transparent opacity={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function KnowledgeGraph() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad relative overflow-hidden" style={{ background: "#000" }} id="graph">
      {/* Teal + violet dual radials */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 80% 50%, rgba(168,85,247,0.05) 0%, transparent 60%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 20% 50%, rgba(82,218,196,0.04) 0%, transparent 60%)" }} />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p
            className="slash-label mb-5"
            style={{
              display: "inline-flex",
              background: "rgba(168,85,247,0.06)",
              borderColor: "rgba(168,85,247,0.2)",
              color: "hsl(252, 83%, 68%)",
            }}
          >
            Knowledge Graph
          </p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.05 }}
          >
            Connected{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(135deg, hsl(var(--teal)), hsl(var(--violet)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              intelligence
            </em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "1rem", fontFamily: "'Inter', sans-serif", maxWidth: "38rem", margin: "1rem auto 0" }}>
            Explore the web of knowledge that powers every decision. Move your cursor to interact.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="slash-card"
          style={{
            height: "clamp(320px, 45vw, 520px)",
            overflow: "hidden",
            padding: 0,
            boxShadow: "0 0 0 1px rgba(82,218,196,0.08), 0 0 60px rgba(82,218,196,0.04), 0 0 120px rgba(168,85,247,0.04)",
          }}
        >
          {/* Instruction overlay */}
          <div
            style={{
              position: "absolute",
              top: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}>
              Move cursor to rotate
            </span>
          </div>

          <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.15} />
              <pointLight position={[3, 3, 3]} intensity={0.6} color="#52dac4" />
              <pointLight position={[-3, -3, 3]} intensity={0.4} color="#a855f7" />
              <pointLight position={[0, 0, -3]} intensity={0.2} color="#ffffff" />
              <GraphNodes />
            </Suspense>
          </Canvas>
        </motion.div>
      </div>
    </section>
  );
}
