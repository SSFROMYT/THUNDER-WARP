import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { SpriteState, ThreeDObject } from '../types';
import { ResetIcon } from './Icons';
import * as THREE from 'three';

interface StageProps {
  sprites: SpriteState[];
  onReset: () => void;
  variables: Record<string, string | number>;
  monitors: Record<string, boolean>;
  onSpritePositionChange: (id: string, updates: { x: number, y: number }) => void;
  setCanvasContext: (ctx: CanvasRenderingContext2D | null) => void;
  threeDObjects: ThreeDObject[];
  isGenerating: boolean;
  askingState: { question: string; spriteId: string; } | null;
  onAnswerSubmit: (answer: string) => void;
  onSpriteClick: (id: string) => void;
}

const renderCostume = (costume: string) => {
    if (costume.startsWith('data:image/')) {
        return <img src={costume} alt="sprite costume" className="w-12 h-12 object-contain" draggable="false" />;
    }
    return <div className="text-4xl">{costume}</div>;
};


export const Stage: React.FC<StageProps> = ({ sprites, onReset, variables, monitors, onSpritePositionChange, setCanvasContext, threeDObjects, isGenerating, askingState, onAnswerSubmit, onSpriteClick }) => {
  const [draggedSpriteId, setDraggedSpriteId] = useState<string | null>(null);
  const dragState = useRef<{
    initialMouseX: number;
    initialMouseY: number;
    initialSpriteX: number;
    initialSpriteY: number;
  }>({ initialMouseX: 0, initialMouseY: 0, initialSpriteX: 0, initialSpriteY: 0 });
  const penCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeDContainerRef = useRef<HTMLDivElement>(null);
  const threeDSceneRef = useRef<{
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      meshes: Map<string, THREE.Mesh>
  } | null>(null);

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 480, height: 360 });
  const scale = stageDimensions.width / 480;
  
  const stageWidth = 480;
  const stageHeight = 360;

  useLayoutEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        const { width, height } = stageRef.current.getBoundingClientRect();
        setStageDimensions({ width, height });
        
        // Update 3D renderer
        if (threeDSceneRef.current) {
            threeDSceneRef.current.renderer.setSize(width, height);
            threeDSceneRef.current.camera.aspect = width / height;
            threeDSceneRef.current.camera.updateProjectionMatrix();
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (stageRef.current) {
      resizeObserver.observe(stageRef.current);
    }
    handleResize(); // Initial size

    return () => resizeObserver.disconnect();
  }, []);


  useEffect(() => {
    if (penCanvasRef.current) {
        setCanvasContext(penCanvasRef.current.getContext('2d'));
    }
  }, [setCanvasContext]);

  // Three.js setup effect
  useEffect(() => {
    if (!threeDContainerRef.current) return;
    
    const { width, height } = threeDContainerRef.current.getBoundingClientRect();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    threeDContainerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    
    threeDSceneRef.current = { scene, camera, renderer, meshes: new Map() };

    let animationFrameId: number;
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };
    animate();

    return () => {
        cancelAnimationFrame(animationFrameId);
        if (threeDContainerRef.current) {
          threeDContainerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, []);

  // Sync Three.js scene with threeDObjects prop
  useEffect(() => {
    if (!threeDSceneRef.current) return;
    const { scene, meshes } = threeDSceneRef.current;
    
    const currentObjectIds = new Set(threeDObjects.map(obj => obj.id));
    
    // Remove old meshes
    meshes.forEach((mesh, id) => {
        if (!currentObjectIds.has(id)) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
            meshes.delete(id);
        }
    });

    // Add new meshes
    threeDObjects.forEach(obj => {
        if (!meshes.has(obj.id)) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(obj.textureData, (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(4, 4);

                let geometry: THREE.BufferGeometry;
                let material = new THREE.MeshStandardMaterial({ map: texture });
                
                if (obj.type === 'floor') {
                    geometry = new THREE.PlaneGeometry(10, 10);
                    texture.repeat.set(8, 8);
                } else { // box
                    geometry = new THREE.BoxGeometry(1, 1, 1);
                }

                const mesh = new THREE.Mesh(geometry, material);
                
                if (obj.type === 'floor') {
                    mesh.rotation.x = -Math.PI / 2;
                } else {
                    mesh.position.y = 0.5;
                }
                
                scene.add(mesh);
                meshes.set(obj.id, mesh);
            });
        }
    });

  }, [threeDObjects]);


  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggedSpriteId) return;
      const touch = 'touches' in e ? e.touches[0] : e;

      const dx = (touch.clientX - dragState.current.initialMouseX) / scale;
      const dy = (touch.clientY - dragState.current.initialMouseY) / scale;
      
      const newX = dragState.current.initialSpriteX + dx;
      const newY = dragState.current.initialSpriteY - dy; // Y is inverted

      onSpritePositionChange(draggedSpriteId, { x: newX, y: newY });
    };

    const handleEnd = () => {
      setDraggedSpriteId(null);
    };
    
    if (draggedSpriteId) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [draggedSpriteId, onSpritePositionChange, scale]);
  
  useEffect(() => {
    if (askingState && inputRef.current) {
        inputRef.current.focus();
    }
  }, [askingState]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, sprite: SpriteState) => {
    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    dragState.current = {
        initialMouseX: touch.clientX,
        initialMouseY: touch.clientY,
        initialSpriteX: sprite.x,
        initialSpriteY: sprite.y,
    };
    setDraggedSpriteId(sprite.id);
  };

  const handleAnswerFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAnswerSubmit(inputValue);
      setInputValue('');
  };


  return (
    <div 
        ref={stageRef}
        className="w-full bg-black rounded-lg shadow-inner flex-shrink-0 relative overflow-hidden select-none"
        style={{ aspectRatio: '4 / 3' }}
    >
        {/* 3D Canvas Container */}
        <div ref={threeDContainerRef} className="absolute top-0 left-0 w-full h-full" />
        
        {/* Pen Canvas */}
        <canvas
            ref={penCanvasRef}
            width={stageDimensions.width}
            height={stageDimensions.height}
            className="absolute top-0 left-0 pointer-events-none"
        />
        {/* Sprites (DOM elements) */}
        <div className="absolute top-0 left-0 w-full h-full">
            {sprites.map(sprite => {
                const { id, x, y, rotation, visible, message, costume, size } = sprite;
                
                const clampedX = Math.max(-stageWidth / 2, Math.min(stageWidth / 2, x));
                const clampedY = Math.max(-stageHeight / 2, Math.min(stageHeight / 2, y));

                const transformX = clampedX * scale + stageDimensions.width / 2;
                const transformY = -clampedY * scale + stageDimensions.height / 2;

                return (
                    <div
                        key={id}
                        onClick={(e) => { e.stopPropagation(); onSpriteClick(id); }}
                        onMouseDown={(e) => handlePointerDown(e, sprite)}
                        onTouchStart={(e) => handlePointerDown(e, sprite)}
                        className={`absolute ${draggedSpriteId === id ? '' : 'transition-transform duration-50'} cursor-grab active:cursor-grabbing`}
                        style={{
                            left: `${transformX}px`,
                            top: `${transformY}px`,
                            transform: `translate(-50%, -50%) rotate(${rotation - 90}deg) scale(${(size / 100) * scale})`,
                            opacity: visible ? 1 : 0,
                            zIndex: 10 + (draggedSpriteId === id ? 10 : 1),
                        }}
                    >
                        <div className="relative">
                            {renderCostume(costume)}
                            {message && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-panel-dark text-white text-xs rounded-lg px-2 py-1 shadow-lg border border-slate-600">
                                    {message}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-panel-dark -mb-[1px]" style={{filter: 'drop-shadow(0 1px 0 rgba(0, 0, 0, 0.1))'}}></div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
        {/* UI and Overlays */}
        {isGenerating && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-yellow-300 z-30">
                <div className="text-2xl animate-pulse">⚡ Generating Object... ⚡</div>
                <p className="text-sm mt-2">The AI is warping reality...</p>
            </div>
        )}
        {askingState && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-panel-dark/90 flex items-center gap-2 z-30">
                <form onSubmit={handleAnswerFormSubmit} className="w-full flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your answer here..."
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-electric-yellow focus:outline-none placeholder-slate-400"
                    />
                    <button type="submit" className="p-2 bg-electric-yellow text-space-dark rounded-md hover:bg-yellow-400 transition-colors w-10 h-10 flex items-center justify-center font-bold text-lg">
                        ✓
                    </button>
                </form>
            </div>
        )}
        <button onClick={onReset} className="absolute top-2 right-2 p-1.5 bg-black/30 rounded-full hover:bg-black/50 text-white transition-colors z-20" title="Reset Stage">
            <ResetIcon />
        </button>
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-20" style={{ transform: `scale(${Math.min(1, scale)})`, transformOrigin: 'top left' }}>
            {Object.entries(variables)
                .filter(([name]) => monitors[name])
                .map(([name, value]) => {
                    const isAnswer = name === 'answer';
                    const bgColor = isAnswer ? 'bg-blue-400' : 'bg-orange-500';
                    const valueBgColor = isAnswer ? 'bg-blue-600' : 'bg-orange-700';

                    return (
                        <div key={name} className={`${bgColor} text-white text-xs font-bold rounded-md px-2 py-1 shadow-md flex items-center`}>
                            {name}
                            <span className={`ml-2 ${valueBgColor} text-white rounded-sm px-1.5 py-0.5 font-mono`}>{String(value)}</span>
                        </div>
                    );
            })}
        </div>
    </div>
  );
};