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

// ── Importance score: higher = placed closer to center, larger, brighter ──
function scoreStarImportance(star: GalaxyStar): number {
  let s = 0;
  if (star.is_active)     s += 12;
  if (star.screen_active) s += 8;
  s += Math.min(star.total_agreements || 0, 25);
  s += Math.min((star.connections?.length || 0) * 0.8, 15);
  s += Math.min((star.weight || 0) * 0.5, 10);
  s += Math.min((star.brightness || 0) * 0.3, 8);
  return s;
}

// ── Spiral placement: sortedIndex 0 = most important = innermost ──
// Handles any N from 1 to 1_000_000 without crowding
function placeOnArm(sortedIndex: number, total: number) {
  const ARMS     = 6;
  const armIdx   = sortedIndex % ARMS;
  const posInArm = Math.floor(sortedIndex / ARMS);
  const perArm   = Math.ceil(total / ARMS) || 1;
  const t        = (posInArm + 0.5) / perArm;

  // Power curve: top institutions near center, bulk spread wide
  const tCurved = Math.pow(t, 0.60);
  const r       = 48 + tCurved * 545;

  const armOffset = (armIdx / ARMS) * Math.PI * 2;
  const pitch     = Math.tan((13 * Math.PI) / 180);
  const angle     = (1 / pitch) * Math.log(Math.max(r / 12, 1)) + armOffset;

  // Jitter scales with radius: tight near center, generous at edges
  const jScale = Math.max(5, r * 0.078);
  const jx = Math.sin(sortedIndex * 2.3456 + 1.1) * jScale;
  const jz = Math.cos(sortedIndex * 1.7891 + 2.3) * jScale;
  const jy = Math.sin(sortedIndex * 5.6789 + 3.7) * Math.max(2, r * 0.013);

  return { x: r * Math.cos(angle) + jx, y: jy, z: r * Math.sin(angle) + jz };
}

// ── Visual size by rank fraction (0 = most important, 1 = least) ──
function rankToSize(rf: number): number {
  if (rf < 0.008) return 20;
  if (rf < 0.020) return 15;
  if (rf < 0.050) return 10;
  if (rf < 0.120) return 6.5;
  if (rf < 0.300) return 4;
  if (rf < 0.600) return 2.8;
  return 1.8;
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

    // ── Institution Stars ─────────────────────────────────────
    // Sort by importance: top institutions placed at centre of spiral
    const sortedStars = [...data.stars].sort(
      (a, b) => scoreStarImportance(b) - scoreStarImportance(a),
    );
    const N = sortedStars.length;

    // Pre-compute positions (deterministic) & build id→sortedIdx map
    const starPositions = sortedStars.map((_, i) => placeOnArm(i, N));
    const idToSortedIdx = new Map<number, number>();
    sortedStars.forEach((star, i) => idToSortedIdx.set(star.id, i));

    const iPos    = new Float32Array(N * 3);
    const iCol   = new Float32Array(N * 3);
    const iSz    = new Float32Array(N);
    const iOp    = new Float32Array(N);
    const iImp   = new Float32Array(N); // importance 0→1
    const glowSz = new Float32Array(N);

    // Reuse one Color object — avoids 1M+ allocations at large N
    const _tmpCol = new THREE.Color();
    sortedStars.forEach((star, i) => {
      const p = starPositions[i];
      iPos[i*3] = p.x; iPos[i*3+1] = p.y; iPos[i*3+2] = p.z;

      _tmpCol.set(star.color || '#4fc3f7');
      iCol[i*3] = _tmpCol.r; iCol[i*3+1] = _tmpCol.g; iCol[i*3+2] = _tmpCol.b;

      const rf   = i / Math.max(N - 1, 1);
      const base = rankToSize(rf);
      iSz[i]    = base;
      glowSz[i] = base * (rf < 0.05 ? 3.5 : rf < 0.15 ? 2.8 : 2.2);
      iOp[i]    = rf < 0.05 ? 1.0 : rf < 0.30 ? 0.92 : 0.78;
      iImp[i]   = Math.pow(1 - rf, 1.5);
    });

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position',    new THREE.BufferAttribute(iPos.slice(), 3));
    coreGeo.setAttribute('customColor', new THREE.BufferAttribute(iCol, 3));
    coreGeo.setAttribute('size',        new THREE.BufferAttribute(iSz, 1));
    coreGeo.setAttribute('opacity',     new THREE.BufferAttribute(iOp, 1));
    coreGeo.setAttribute('importance',  new THREE.BufferAttribute(iImp, 1));

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position',    new THREE.BufferAttribute(iPos, 3));
    glowGeo.setAttribute('customColor', new THREE.BufferAttribute(iCol, 3));
    glowGeo.setAttribute('size',        new THREE.BufferAttribute(glowSz, 1));
    glowGeo.setAttribute('importance',  new THREE.BufferAttribute(iImp, 1));

    const coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        attribute vec3  customColor;
        attribute float opacity;
        attribute float importance;
        varying vec3  vColor;
        varying float vOp;
        varying float vImp;
        void main() {
          vColor = customColor;
          vOp    = opacity;
          vImp   = importance;
          // GPU-side pulse: unique phase per star from position, works for any N
          float phase  = position.x * 0.137 + position.z * 0.247;
          float pAmp   = importance > 0.5 ? 0.15 : 0.07;
          float pulse  = 1.0 + pAmp * sin(uTime * 2.5 + phase);
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pulse * (300.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3  vColor;
        varying float vOp;
        varying float vImp;
        void main() {
          vec2  uv   = gl_PointCoord.xy - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          float pulse = 0.85 + 0.15 * sin(uTime * 3.0 + vImp * 6.28);
          float core  = smoothstep(0.18 * pulse, 0.0, dist);
          float halo  = smoothstep(0.5, 0.08, dist) * 0.55 * pulse;
          float alpha = clamp(core + halo, 0.0, 1.0) * vOp;
          // Top stars blend toward white-blue core
          float whiteness = vImp * 0.75;
          vec3  col = mix(vColor, vec3(0.85, 0.95, 1.0), core * whiteness);
          col = mix(col, vec3(1.0), core * (1.0 - whiteness) * 0.5);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      blending: THREE.AdditiveBlending, depthTest: false, transparent: true,
    });

    const glowMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3  customColor;
        attribute float importance;
        varying vec3  vColor;
        varying float vImp;
        void main() {
          vColor = customColor;
          vImp   = importance;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3  vColor;
        varying float vImp;
        void main() {
          float dist = length(gl_PointCoord.xy - vec2(0.5));
          if (dist > 0.5) discard;
          float pulse = 0.55 + 0.45 * sin(uTime * 2.0 + vImp * 6.28);
          float glow  = (0.5 - dist) * 2.0 * pulse;
          float alpha = glow * (0.55 + vImp * 0.35);
          if (alpha < 0.01) discard;
          // Top institutions glow gold/white; others their own color
          vec3 topTint  = vec3(1.0, 0.88, 0.55);
          vec3 cyanTint = vec3(0.0, 0.93, 1.0);
          vec3 tint     = mix(cyanTint, topTint, vImp * 0.6);
          vec3 finalCol = mix(vColor, tint, 0.5);
          gl_FragColor  = vec4(finalCol, alpha);
        }
      `,
      blending: THREE.AdditiveBlending, depthTest: false, transparent: true,
    });

    const coreSystem = new THREE.Points(coreGeo, coreMat);
    const glowSystem = new THREE.Points(glowGeo, glowMat);
    scene.add(glowSystem);
    scene.add(coreSystem);

    // Raycasting subset — only top min(N,50000) stars so hover is O(50k) not O(N)
    const MAX_RAYCAST_STARS = Math.min(N, 50000);
    const rayGeo = new THREE.BufferGeometry();
    rayGeo.setAttribute('position', new THREE.BufferAttribute(iPos.slice(0, MAX_RAYCAST_STARS * 3), 3));
    const raySystem = new THREE.Points(rayGeo, new THREE.PointsMaterial({ visible: false }));
    scene.add(raySystem);

    // ── Connection Lines ──────────────────────────────────────
    const edges     = new Set<string>();
    const lineVerts : number[] = [];
    const lineColors: number[] = [];

    // Only draw lines for top important stars — cap prevents OOM at large N
    const MAX_LINK_STARS = Math.min(N, 3000);
    sortedStars.slice(0, MAX_LINK_STARS).forEach((star, i) => {
      if (!star.connections?.length) return;
      const pA = starPositions[i];
      star.connections.forEach(connId => {
        const j = idToSortedIdx.get(connId);
        if (j === undefined) return;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (edges.has(key)) return;
        edges.add(key);
        const pB = starPositions[j];
        lineVerts.push(pA.x, pA.y, pA.z);
        const cA = new THREE.Color(star.color || '#4fc3f7');
        lineColors.push(cA.r, cA.g, cA.b);
        lineVerts.push(pB.x, pB.y, pB.z);
        const cB = new THREE.Color(sortedStars[j].color || '#4fc3f7');
        lineColors.push(cB.r, cB.g, cB.b);
      });
    });

    const linksMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor      = color;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          float pulse = 0.35 + 0.20 * sin(uTime * 1.8);
          gl_FragColor = vec4(vColor, pulse);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      linewidth: 1,
    });

    let linksSystem: THREE.LineSegments | null = null;
    if (lineVerts.length > 0) {
      const linksGeo = new THREE.BufferGeometry();
      linksGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts),  3));
      linksGeo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(lineColors), 3));
      linksSystem = new THREE.LineSegments(linksGeo, linksMat);
      scene.add(linksSystem);
    }

    // Highlight ring (uses sortedIdx)
    if (highlightStarId !== undefined) {
      const hlIdx = idToSortedIdx.get(highlightStarId);
      if (hlIdx !== undefined) {
        const { x, y, z } = starPositions[hlIdx];
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
      raycaster.params.Points!.threshold = Math.max(4, sph.radius * 0.012);
      const hits = raycaster.intersectObject(raySystem);
      if (hits.length > 0) {
        const s = sortedStars[hits[0].index!];
        renderer.domElement.style.cursor = 'pointer';
        if (tooltipRef.current && s) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = (e.clientX + 16) + 'px';
          tooltipRef.current.style.top  = (e.clientY - 10) + 'px';
          // const agreements = (s.total_agreements || 0).toLocaleString('ar-SA');
          // const links      = (s.connections?.length || 0).toLocaleString('ar-SA');
          const location   = [s.city, s.country].filter(Boolean).join('، ');
          tooltipRef.current.innerHTML = `
            <strong style="color:${s.color||'#4fc3f7'};display:block;margin-bottom:4px">${s.name_ar || s.name}</strong>
            <span style="display:block;font-size:0.75rem;color:#8aa4bc">${s.type || ''}</span>
            ${location ? `<span style="display:block;font-size:0.75rem;color:#8aa4bc">📍 ${location}</span>` : ''}
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
        const hits = raycaster.intersectObject(raySystem);
        if (hits.length > 0) {
          onStarClickRef.current?.(sortedStars[hits[0].index!]);
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

      // Animate institution stars
      coreMat.uniforms.uTime.value = time;
      glowMat.uniforms.uTime.value = time;
      if (linksSystem) linksMat.uniforms.uTime.value = time;
      // Pulse is now GPU-side in the vertex shader — no CPU loop needed for any N

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
