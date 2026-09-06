import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PhotoHeroScene } from './PhotoHeroScene';

interface PhotoHeroCanvasProps {
  coverUrl: string;
  active: boolean;
  onTextureLoaded?: () => void;
  onError?: () => void;
}

function SceneFallback() {
  return null;
}

export const PhotoHeroCanvas: React.FC<PhotoHeroCanvasProps> = ({
  coverUrl,
  active,
  onTextureLoaded,
  onError,
}) => {
  const [frameloop, setFrameloop] = useState<'always' | 'never'>(active ? 'always' : 'never');

  useEffect(() => {
    setFrameloop(active ? 'always' : 'never');
  }, [active]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={frameloop}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: [0, 0, 2.8], fov: 45, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', () => onError?.(), { once: true });
        }}
      >
        <Suspense fallback={<SceneFallback />}>
          <PhotoHeroScene coverUrl={coverUrl} onTextureLoaded={onTextureLoaded} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default PhotoHeroCanvas;
