'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GalaxyStar, GalaxyData } from '@/lib/types';

export type { GalaxyStar, GalaxyData };

interface Props {
  data: GalaxyData;
  onStarClick?: (star: GalaxyStar) => void;
  autoRotate?: boolean;
  backgroundStarsCount?: number;
  highlightStarId?: number;
}

// Deterministic spiral-arm placement for institution stars
function placeOnArm(index: number, total: number) {
  const ARMS  = 5;
  const armIdx    = index % ARMS;
  const posInArm  = Math.floor(index / ARMS);
  const perArm    = Math.ceil(total / ARMS) || 1;
  const t         = (posInArm + 0.5) / perArm;
  const r         = 30 + t * 240;
  const armOffset = (armIdx / ARMS) * Math.PI * 2;
  const pitch     = Math.tan((15 * Math.PI) / 180);
  const angle     = (1 / pitch) * Math.log(Math.max(r / 10, 1)) + armOffset;
  // Deterministic jitter via sin/cos of index
  const jx = Math.sin(index * 2.3456 + 1) * 14;
  const jz = Math.cos(index * 1.7891 + 2) * 14;
  const jy = Math.sin(index * 5.6789 + 3) * 3;
  return { x: r * Math.cos(angle) + jx, y: jy, z: r * Math.sin(angle) + jz };
}

export default function GalaxyCanvas({
  data,
  onStarClick,
  autoRotate = true,
  backgroundStarsCount = 12000,
  highlightStarId,
}: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const tooltipRef     = useRef<HTMLDivElement>(null);
  const onStarClickRef = useRef(onStarClick);
  useEffect(() => { onStarClickRef.current = onStarClick; }, [onStarClick]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let w = container.clientWidth;
    let h = container.clientHeight;

    // ── Scene ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog   = new THREE.FogExp2(0x000010, 0.0008);

    // ── Camera ───────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 3000);
    const sph    = { theta: 0.3, phi: 1.2, radius: 480 };
    const camTarget = new THREE.Vector3(0, 0, 0);
    camera.position.set(0, 120, 480);
    camera.lookAt(0, 0, 0);

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000005, 1);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cursor      = 'grab';
    renderer.domElement.style.touchAction = 'none';

    const clock = new THREE.Clock();

    // ── Background Star Field ─────────────────────────────────
    {
      const count   = backgroundStarsCount;
      const sfPos   = new Float32Array(count * 3);
      const sfCol   = new Float32Array(count * 3);
      const sfSz    = new Float32Array(count);
      const palette = [
        new THREE.Color(0xffffff), new THREE.Color(0xadd8e6),
        new THREE.Color(0xffe4b5), new THREE.Color(0xffb347),
        new THREE.Color(0xff6b6b), new THREE.Color(0xe0e0ff),
        new THREE.Color(0xfffacd),
      ];
      for (let i = 0; i < count; i++) {
        const r  = 600 + Math.random() * 1200;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        sfPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
        sfPos[i*3+1] = r * Math.sin(ph) * Math.sin(th) * 0.4;
        sfPos[i*3+2] = r * Math.cos(ph);
        const c = palette[Math.floor(Math.random() * palette.length)];
        sfCol[i*3] = c.r; sfCol[i*3+1] = c.g; sfCol[i*3+2] = c.b;
        sfSz[i] = Math.random() < 0.05 ? Math.random() * 3 + 2 : Math.random() * 1.5 + 0.5;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(sfPos, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(sfCol, 3));
      geo.setAttribute('size',     new THREE.BufferAttribute(sfSz,  1));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 1.2, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })));
    }

    // ── Milky Way ─────────────────────────────────────────────
    const ARMS = 5, PER_ARM = 3500, CORE_N = 4000;
    const mwTotal = ARMS * PER_ARM + CORE_N;
    const mwPos   = new Float32Array(mwTotal * 3);
    const mwCol   = new Float32Array(mwTotal * 3);
    const mwSz    = new Float32Array(mwTotal);
    let mwIdx = 0;

    for (let arm = 0; arm < ARMS; arm++) {
      const off = (arm / ARMS) * Math.PI * 2;
      for (let i = 0; i < PER_ARM; i++) {
        const t      = i / PER_ARM;
        const angle  = off + t * Math.PI * 4;
        const radius = t * 300 + 20;
        const spread = (1 - t * 0.5) * 25;
        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
        const y = (Math.random() - 0.5) * 12 * (1 - t * 0.7);
        mwPos[mwIdx*3] = x; mwPos[mwIdx*3+1] = y; mwPos[mwIdx*3+2] = z;
        const wm = 1 - t * 0.6;
        mwCol[mwIdx*3]   = 0.6 + wm * 0.4;
        mwCol[mwIdx*3+1] = 0.55 + wm * 0.2;
        mwCol[mwIdx*3+2] = 0.9 - wm * 0.3;
        mwSz[mwIdx] = Math.random() * 2 + 0.5;
        mwIdx++;
      }
    }
    // Galactic core bulge
    for (let i = 0; i < CORE_N; i++) {
      const th = Math.random() * Math.PI * 2;
      const r  = Math.random() * 60;
      const f  = 1 - r / 60;
      mwPos[mwIdx*3]   = Math.cos(th) * r + (Math.random() - 0.5) * 10;
      mwPos[mwIdx*3+1] = (Math.random() - 0.5) * 20 * f;
      mwPos[mwIdx*3+2] = Math.sin(th) * r * 0.6 + (Math.random() - 0.5) * 10;
      mwCol[mwIdx*3]   = 1.0;
      mwCol[mwIdx*3+1] = 0.75 + Math.random() * 0.2;
      mwCol[mwIdx*3+2] = 0.2 + Math.random() * 0.3;
      mwSz[mwIdx] = Math.random() * 3 + 1;
      mwIdx++;
    }
    const mwGeo = new THREE.BufferGeometry();
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos.slice(0, mwIdx*3), 3));
    mwGeo.setAttribute('color',    new THREE.BufferAttribute(mwCol.slice(0, mwIdx*3), 3));
    mwGeo.setAttribute('size',     new THREE.BufferAttribute(mwSz.slice(0, mwIdx),    1));
    const milkyWay = new THREE.Points(mwGeo, new THREE.PointsMaterial({
      size: 1.8, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(milkyWay);

    // Core glow spheres
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(30, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff8c30, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }),
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }),
    ));

    // ── Nebulae Clouds ────────────────────────────────────────
    const nebulaeData = [
      { pos: [180,  40,  -80] as const, hex: 0x4fc3f7, size: 60 },
      { pos: [-200, -30,  60] as const, hex: 0x7c4dff, size: 80 },
      { pos: [60,   80, -220] as const, hex: 0xff6b9d, size: 50 },
      { pos: [-100, 60, -160] as const, hex: 0x26c6da, size: 45 },
      { pos: [250, -40,  -40] as const, hex: 0xab47bc, size: 55 },
    ];
    nebulaeData.forEach(({ pos, hex, size }) => {
      const count = 800;
      const nPos  = new Float32Array(count * 3);
      const nCol  = new Float32Array(count * 3);
      const col   = new THREE.Color(hex);
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r  = Math.pow(Math.random(), 0.5) * size;
        nPos[i*3]   = pos[0] + r * Math.sin(ph) * Math.cos(th);
        nPos[i*3+1] = pos[1] + r * Math.sin(ph) * Math.sin(th) * 0.4;
        nPos[i*3+2] = pos[2] + r * Math.cos(ph);
        nCol[i*3] = col.r; nCol[i*3+1] = col.g; nCol[i*3+2] = col.b;
      }
      const nGeo = new THREE.BufferGeometry();
      nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
      nGeo.setAttribute('color',    new THREE.BufferAttribute(nCol, 3));
      scene.add(new THREE.Points(nGeo, new THREE.PointsMaterial({
        size: 3, vertexColors: true, transparent: true, opacity: 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })));
    });

    // ── Lights ───────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x112244, 2));
    const ptLight = new THREE.PointLight(0xff8c30, 3, 200);
    scene.add(ptLight);

    // ── Institution Stars (3D spheres matching reference) ────
    type InstMesh = {
      mesh: THREE.Mesh;
      glow: THREE.Mesh;
      mid:  THREE.Mesh;
      ring: THREE.Mesh | null;
      star: GalaxyStar;
      phase: number;
    };
    const instMeshes: InstMesh[] = [];
    const rayTargets: THREE.Mesh[]  = []; // only core meshes for raycasting

    data.stars.forEach((star, i) => {
      const impact = Math.min((star.size || 5) / 10, 1);
      const s3d    = 3 + impact * 22;                          // 3–25
      const color  = new THREE.Color(star.color || '#4fc3f7');
      const { x, y, z } = placeOnArm(i, data.stars.length);

      // Core sphere
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(s3d, 16, 16),
        new THREE.MeshBasicMaterial({ color }),
      );
      mesh.position.set(x, y, z);
      (mesh as any).__star = star;
      scene.add(mesh);
      rayTargets.push(mesh);

      // Outer glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(s3d * 3.5, 16, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      glow.position.set(x, y, z);
      scene.add(glow);

      // Mid glow
      const mid = new THREE.Mesh(
        new THREE.SphereGeometry(s3d * 2, 16, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      mid.position.set(x, y, z);
      scene.add(mid);

      // Orbital ring for high-impact stars
      let ring: THREE.Mesh | null = null;
      if (impact > 0.6) {
        ring = new THREE.Mesh(
          new THREE.RingGeometry(s3d * 3, s3d * 4, 32),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        ring.position.set(x, y, z);
        ring.rotation.x = Math.PI / 3;
        scene.add(ring);
      }

      instMeshes.push({ mesh, glow, mid, ring, star, phase: Math.random() * Math.PI * 2 });
    });

    // Highlight ring
    if (highlightStarId !== undefined) {
      const hlIdx = data.stars.findIndex(s => s.id === highlightStarId);
      if (hlIdx !== -1) {
        const { x, y, z } = placeOnArm(hlIdx, data.stars.length);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(6, 8, 32),
          new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
        );
        ring.position.set(x, y, z);
        ring.lookAt(camera.position);
        scene.add(ring);
        const dist = Math.sqrt(x*x + y*y + z*z);
        sph.theta  = Math.atan2(z, x);
        sph.phi    = Math.acos(Math.max(-1, Math.min(1, y / Math.max(dist, 0.01))));
        sph.radius = 120;
        camTarget.set(x * 0.3, y * 0.3, z * 0.3);
      }
    }

    // ── Manual Orbit Controls ─────────────────────────────────
    const drag   = { active: false, downX: 0, downY: 0, moved: false };
    let lastX = 0, lastY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      drag.active = true;
      drag.downX  = e.clientX;
      drag.downY  = e.clientY;
      drag.moved  = false;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (drag.active) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        sph.theta -= dx * 0.004;
        sph.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - dy * 0.004));
        lastX = e.clientX;
        lastY = e.clientY;
        if (Math.hypot(e.clientX - drag.downX, e.clientY - drag.downY) > 5) drag.moved = true;
      }

      // Hover tooltip (desktop only)
      if ((e as PointerEvent).pointerType === 'touch') return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(rayTargets);
      if (hits.length > 0) {
        const s: GalaxyStar = (hits[0].object as any).__star;
        renderer.domElement.style.cursor = 'pointer';
        if (tooltipRef.current && s) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = (e.clientX + 16) + 'px';
          tooltipRef.current.style.top  = (e.clientY - 10) + 'px';
          const emp  = ((s as any).employees || 0).toLocaleString('ar-SA');
          const proj = ((s as any).projects  || 0).toLocaleString('ar-SA');
          tooltipRef.current.innerHTML = `
            <strong style="color:${s.color||'#4fc3f7'};display:block;margin-bottom:4px">${s.name_ar || s.name}</strong>
            <span style="display:block;font-size:0.75rem;color:#8aa4bc">${(s as any).category || s.type || ''}</span>
            <span style="display:block;font-size:0.75rem;color:#aac">👥 ${emp} موظف</span>
            <span style="display:block;font-size:0.75rem;color:#aac">📁 ${proj} مشروع</span>
          `;
        }
      } else {
        if (!drag.active) renderer.domElement.style.cursor = 'grab';
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasDrag = drag.moved;
      drag.active = false;
      drag.moved  = false;
      renderer.domElement.style.cursor = 'grab';
      if (!wasDrag) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(rayTargets);
        if (hits.length > 0) {
          onStarClickRef.current?.((hits[0].object as any).__star);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      sph.radius = Math.max(80, Math.min(1200, sph.radius + e.deltaY * 0.3));
    };

    const onResize = () => {
      w = container.clientWidth; h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove',  onPointerMove);
    window.addEventListener('pointerup',    onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', onResize);

    // ── Animation Loop ────────────────────────────────────────
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Rotate milky way slowly
      milkyWay.rotation.y = time * 0.02;

      // Pulse institution stars
      instMeshes.forEach(m => {
        const pulse = 1 + Math.sin(time * 2.5 + m.phase) * 0.08;
        m.mesh.scale.setScalar(pulse);
        m.glow.scale.setScalar(pulse * 1.05);
        if (m.ring) {
          m.ring.rotation.z = time * 0.4;
          m.ring.rotation.x = Math.PI / 3 + Math.sin(time * 0.3) * 0.1;
        }
      });

      // Auto rotate
      if (autoRotate) sph.theta -= 0.0003;

      // Update camera position from spherical coords
      camera.position.set(
        camTarget.x + sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta),
        camTarget.y + sph.radius * Math.cos(sph.phi),
        camTarget.z + sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta),
      );
      camera.lookAt(camTarget);

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel as EventListener);
      window.removeEventListener('resize', onResize);
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [data, autoRotate, highlightStarId, backgroundStarsCount]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000005' }}
    >
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'fixed',
          zIndex: 500,
          background: 'rgba(10,20,50,0.92)',
          border: '1px solid rgba(79,195,247,0.4)',
          borderRadius: 10,
          padding: '10px 14px',
          pointerEvents: 'none',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          direction: 'rtl',
          fontFamily: "'Tajawal', sans-serif",
          fontSize: '0.85rem',
          maxWidth: 185,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}
