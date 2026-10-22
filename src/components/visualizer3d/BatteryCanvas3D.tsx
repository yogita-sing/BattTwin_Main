import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CellState } from '../../types/battery';
import { RotateCcw, Layers, Zap } from 'lucide-react';

interface BatteryCanvas3DProps {
  cells: CellState[];
  selectedCellId: string | null;
  onSelectCell: (cellId: string) => void;
  coolingType: string;
  isVetoed: boolean;
}

export const BatteryCanvas3D: React.FC<BatteryCanvas3DProps> = ({
  cells,
  selectedCellId,
  onSelectCell,
  coolingType,
  isVetoed,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodedFactor, setExplodedFactor] = useState<number>(0.0);
  const [showBusbars, setShowBusbars] = useState<boolean>(true);
  const [showPcm, setShowPcm] = useState<boolean>(coolingType === 'pcm_matrix');
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cellMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const busbarMeshesRef = useRef<THREE.Mesh[]>([]);
  const pcmMeshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const getCellColor = (tempC: number): THREE.Color => {
    if (tempC <= 28.0) return new THREE.Color(0x06b6d4); // cyan
    if (tempC <= 36.0) return new THREE.Color(0x10b981); // emerald green
    if (tempC <= 42.0) return new THREE.Color(0xf59e0b); // amber
    if (tempC < 45.0) return new THREE.Color(0xf97316); // orange
    return new THREE.Color(0xef4444); // crimson red
  };

  useEffect(() => {
    setShowPcm(coolingType === 'pcm_matrix');
  }, [coolingType]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 460;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(15, 25, 20);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.6);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    const grid = new THREE.GridHelper(20, 20, 0x1e293b, 0x0f172a);
    grid.position.y = -3.5;
    scene.add(grid);

    const batteryGroup = new THREE.Group();
    scene.add(batteryGroup);

    const cellRadius = 1.0;
    const cellHeight = 4.2;
    const cellGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 32);

    cellMeshesRef.current.clear();

    for (let s = 0; s < 4; s++) {
      for (let p = 0; p < 2; p++) {
        const cellId = `Cell_S${s + 1}_P${p + 1}`;
        const posX = (s - 1.5) * 2.8;
        const posZ = (p - 0.5) * 2.8;

        const cellMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          metalness: 0.7,
          roughness: 0.25,
          emissive: 0x0284c7,
          emissiveIntensity: 0.15,
        });

        const cellMesh = new THREE.Mesh(cellGeo, cellMat);
        cellMesh.position.set(posX, 0, posZ);
        cellMesh.castShadow = true;
        cellMesh.receiveShadow = true;
        cellMesh.userData = { cellId, s, p, basePosX: posX, basePosZ: posZ };

        const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.y = cellHeight / 2 + 0.15;
        cellMesh.add(capMesh);

        batteryGroup.add(cellMesh);
        cellMeshesRef.current.set(cellId, cellMesh);
      }
    }

    busbarMeshesRef.current = [];
    const busbarMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.3,
    });

    for (let s = 0; s < 4; s++) {
      const posX = (s - 1.5) * 2.8;
      const barGeo = new THREE.BoxGeometry(0.6, 0.15, 3.2);
      const barMesh = new THREE.Mesh(barGeo, busbarMat);
      barMesh.position.set(posX, cellHeight / 2 + 0.35, 0);
      barMesh.userData = { baseY: cellHeight / 2 + 0.35, type: 'busbar_top' };
      batteryGroup.add(barMesh);
      busbarMeshesRef.current.push(barMesh);
    }

    const pcmGeo = new THREE.BoxGeometry(11.8, cellHeight * 0.9, 6.2);
    const pcmMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      transmission: 0.5,
      roughness: 0.2,
      ior: 1.4,
    });
    const pcmMesh = new THREE.Mesh(pcmGeo, pcmMat);
    pcmMesh.position.set(0, 0, 0);
    batteryGroup.add(pcmMesh);
    pcmMeshRef.current = pcmMesh;

    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      batteryGroup.rotation.y += deltaX * 0.008;
      batteryGroup.rotation.x += deltaY * 0.008;
      batteryGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, batteryGroup.rotation.x));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const cellMeshes = Array.from(cellMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(cellMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.cellId) {
          onSelectCell(hit.userData.cellId);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(8, Math.min(30, camera.position.z + e.deltaY * 0.01));
    };
    domEl.addEventListener('wheel', onWheel);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isRotating && !isDragging) {
        batteryGroup.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    cells.forEach((cell) => {
      const mesh = cellMeshesRef.current.get(cell.cell_id);
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        const color = getCellColor(cell.temperature_c);
        mesh.material.color = color;

        if (cell.cell_id === selectedCellId) {
          mesh.material.emissive = new THREE.Color(0x38bdf8);
          mesh.material.emissiveIntensity = 0.55;
        } else {
          mesh.material.emissive = color;
          mesh.material.emissiveIntensity = cell.temperature_c >= 45.0 ? 0.4 : 0.15;
        }
      }
    });
  }, [cells, selectedCellId]);

  useEffect(() => {
    cellMeshesRef.current.forEach((mesh) => {
      const { basePosX, basePosZ } = mesh.userData;
      mesh.position.x = basePosX * (1 + explodedFactor * 0.4);
      mesh.position.z = basePosZ * (1 + explodedFactor * 0.4);
    });

    busbarMeshesRef.current.forEach((bar) => {
      bar.visible = showBusbars;
      bar.position.y = bar.userData.baseY + explodedFactor * 2.5;
    });

    if (pcmMeshRef.current) {
      pcmMeshRef.current.visible = showPcm;
      pcmMeshRef.current.scale.set(
        1 + explodedFactor * 0.3,
        1 + explodedFactor * 0.1,
        1 + explodedFactor * 0.3
      );
    }
  }, [explodedFactor, showBusbars, showPcm]);

  return (
    <div className="relative w-full h-full min-h-[440px] bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase font-mono">
              3D 4S2P Thermal Visualizer
            </span>
          </div>

          {isVetoed && (
            <div className="flex items-center space-x-1.5 bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold animate-bounce">
              <Zap className="w-3.5 h-3.5" />
              <span>VETO LIMIT TRIPPED</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 transition-all ${
              isRotating ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Auto Rotation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowBusbars(!showBusbars)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              showBusbars ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Busbars
          </button>

          <button
            onClick={() => setShowPcm(!showPcm)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              showPcm ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PCM Matrix
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Exploded View & Temperature Legend Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Exploded View Slider */}
        <div className="pointer-events-auto flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 shadow-lg">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-300">Exploded View:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodedFactor}
            onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
            className="w-28 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-xs font-mono text-cyan-400 w-8">
            {Math.round(explodedFactor * 100)}%
          </span>
        </div>

        {/* Temperature Gradient Legend */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs shadow-lg font-mono">
          <span className="text-slate-400">Temp:</span>
          <span className="text-cyan-400">25°C</span>
          <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-red-500 shadow-inner"></div>
          <span className="text-red-400">≥45°C</span>
        </div>
      </div>
    </div>
  );
};
