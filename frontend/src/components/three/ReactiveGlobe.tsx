"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// ─── Arc: one animated great-circle path ─────────────────────────────────────

interface ArcProps {
  startPhi:   number;
  startTheta: number;
  endPhi:     number;
  endTheta:   number;
  color:      string;
  speed:      number;
  offset:     number;
}

function Arc({ startPhi, startTheta, endPhi, endTheta, color, speed, offset }: ArcProps) {
  const progress = useRef(offset);
  const RADIUS   = 1.02;

  const { allPoints, lineObj } = useMemo(() => {
    const toVec = (phi: number, theta: number) =>
      new THREE.Vector3(
        RADIUS * Math.sin(phi) * Math.cos(theta),
        RADIUS * Math.cos(phi),
        RADIUS * Math.sin(phi) * Math.sin(theta)
      );

    const start = toVec(startPhi, startTheta);
    const end   = toVec(endPhi,   endTheta);
    const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const lift  = start.distanceTo(end) * 0.5;
    mid.normalize().multiplyScalar(RADIUS + lift);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts   = curve.getPoints(64);

    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions[i * 3]     = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1.0 });
    const obj = new THREE.Line(geo, mat);

    return { allPoints: pts, lineObj: obj };
  }, [startPhi, startTheta, endPhi, endTheta, color]);

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * speed) % 1;

    const windowSize = 0.28;
    const tail  = progress.current;
    const head  = (tail + windowSize) % 1;
    const total = allPoints.length;
    const s     = Math.floor(tail * total);
    const e     = Math.floor(head * total);

    const slice: THREE.Vector3[] =
      e > s ? allPoints.slice(s, e + 1) : [...allPoints.slice(s), ...allPoints.slice(0, e + 1)];

    if (slice.length >= 2) {
      const pos = new Float32Array(slice.length * 3);
      slice.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
      lineObj.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      lineObj.geometry.attributes.position.needsUpdate = true;
    }
  });

  return <primitive object={lineObj} />;
}

// ─── Globe mesh ───────────────────────────────────────────────────────────────

function GlobeMesh() {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color:       new THREE.Color("#ff2785"),
        transparent: true,
        opacity:     0.12,
        side:        THREE.BackSide,
      }),
    []
  );

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.07;
    if (wireRef.current) wireRef.current.rotation.y += delta * 0.07;
  });

  return (
    <group>
      <mesh scale={[1.22, 1.22, 1.22]}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhongMaterial
          color="#0a1628"
          emissive="#1a2a4a"
          emissiveIntensity={0.5}
          shininess={20}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.002, 24, 24]} />
        <meshBasicMaterial color="#2f5cff" wireframe transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

// ─── Arcs ─────────────────────────────────────────────────────────────────────

const COLORS = ["#ff2785", "#2f5cff", "#ff55a3", "#5a87ff", "#ff2785", "#2f5cff"];

function Arcs() {
  const arcs = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        startPhi:   Math.random() * Math.PI,
        startTheta: Math.random() * Math.PI * 2,
        endPhi:     Math.random() * Math.PI,
        endTheta:   Math.random() * Math.PI * 2,
        color:      COLORS[i % COLORS.length],
        speed:      0.1 + Math.random() * 0.18,
        offset:     Math.random(),
      })),
    []
  );

  return (
    <>
      {arcs.map((props, i) => (
        <Arc key={i} {...props} />
      ))}
    </>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]}    color="#ff2785" intensity={3.5} />
      <pointLight position={[-3, -2, -3]} color="#2f5cff" intensity={2.5} />
      <pointLight position={[0, 3, -3]}   color="#ff55a3" intensity={1.2} />
      <Stars radius={90} depth={50} count={3000} factor={3.5} saturation={0} fade speed={0.3} />
      <GlobeMesh />
      <Arcs />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ReactiveGlobe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <Scene />
    </Canvas>
  );
}
