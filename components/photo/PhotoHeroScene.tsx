import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const PARTICLE_COUNT = 120;
const GOLD = new THREE.Color('#e6c896');
const GOLD_DIM = new THREE.Color('#B08D55');
/** 視差旋轉時略超出畫面，避免露邊；勿再額外放大 */
const OVERSCAN = 1.03;

interface CoverPlaneProps {
  url: string;
  onLoaded?: () => void;
}

function CoverPlane({ url, onLoaded }: CoverPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(url);
  const { viewport, pointer } = useThree();
  const loadedRef = useRef(false);
  const [imageAspect, setImageAspect] = useState(16 / 9);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const img = texture.image as HTMLImageElement | ImageBitmap | undefined;
    if (img && 'width' in img && img.width > 0 && img.height > 0) {
      setImageAspect(img.width / img.height);
      if (!loadedRef.current) {
        loadedRef.current = true;
        onLoaded?.();
      }
    }
  }, [texture, onLoaded]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetX = pointer.y * 0.04;
    const targetY = pointer.x * 0.05;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetX,
      1 - Math.exp(-4 * delta)
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetY,
      1 - Math.exp(-4 * delta)
    );
  });

  // 等同 CSS object-fit: cover — 依實際照片比例填滿視窗，多餘部分裁切
  const [planeW, planeH] = useMemo(() => {
    const viewAspect = viewport.width / viewport.height;
    let w: number;
    let h: number;
    if (imageAspect > viewAspect) {
      h = viewport.height;
      w = h * imageAspect;
    } else {
      w = viewport.width;
      h = w / imageAspect;
    }
    return [w * OVERSCAN, h * OVERSCAN];
  }, [viewport.width, viewport.height, imageAspect]);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[planeW, planeH, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function GoldenDust() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 + 0.5;
      speeds[i] = 0.15 + Math.random() * 0.35;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, speeds, phases };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const speed = speeds[i];
      const phase = phases[i];
      pos[i3 + 1] += Math.sin(t * speed + phase) * 0.002;
      pos[i3] += Math.cos(t * speed * 0.7 + phase) * 0.0015;
      if (pos[i3 + 1] > 4) pos[i3 + 1] = -4;
      if (pos[i3 + 1] < -4) pos[i3 + 1] = 4;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={GOLD}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

interface PhotoHeroSceneProps {
  coverUrl: string;
  onTextureLoaded?: () => void;
}

export function PhotoHeroScene({ coverUrl, onTextureLoaded }: PhotoHeroSceneProps) {
  return (
    <>
      <color attach="background" args={['#0c0b0a']} />
      <ambientLight intensity={0.35} color={GOLD_DIM} />
      <CoverPlane url={coverUrl} onLoaded={onTextureLoaded} />
      <GoldenDust />
    </>
  );
}
