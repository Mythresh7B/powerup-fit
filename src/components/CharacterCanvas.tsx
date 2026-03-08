import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, useAnimations } from '@react-three/drei';
import { Suspense, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getLevelColour, isAnimatedLevel } from '@/lib/levelColour';
import { useIsMobile } from '@/hooks/use-mobile';

const MODEL_PATH = '/models/warrior_rpg_lowpoly.glb';

function Model({ level }: { level: number }) {
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  const isMobile = useIsMobile();
  const levelColour = useMemo(() => new THREE.Color(getLevelColour(level)), [level]);
  const animated = isAnimatedLevel(level);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  // Apply level colour tint
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).color) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.color.lerp(levelColour, 0.25);
          mesh.material = mat;
        }
      }
    });
  }, [scene, levelColour]);

  // Breathing animation if no skeletal animations, or animated level hue cycling
  useFrame(({ clock }) => {
    if (names.length === 0 && groupRef.current) {
      groupRef.current.position.y = -1.0 + Math.sin(clock.elapsedTime * 1.2) * 0.03;
    }

    if (animated) {
      const t = clock.elapsedTime;
      const hueShift = Math.sin(t * 2.1) * 0.5 + 0.5; // 0..1
      const col = new THREE.Color().lerpColors(
        new THREE.Color('#F59E0B'),
        new THREE.Color('#EF4444'),
        hueShift
      );
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat?.color) {
            mat.color.lerp(col, 0.15);
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        position={[0, -1.0, 0]}
        scale={isMobile ? 1.1 : 1.4}
      />
    </group>
  );
}

interface CharacterCanvasProps {
  level: number;
}

const CharacterCanvas = ({ level }: CharacterCanvasProps) => {
  const isMobile = useIsMobile();
  const height = isMobile ? 280 : 400;

  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.5], fov: 45 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height, background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[3, 8, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 3, -3]} intensity={0.4} color="#8B5CF6" />

      <Suspense fallback={null}>
        <Model level={level} />
        <Environment preset="city" />
        <ContactShadows position={[0, -1.0, 0]} opacity={0.4} scale={3} blur={2} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
};

useGLTF.preload(MODEL_PATH);

export default CharacterCanvas;
