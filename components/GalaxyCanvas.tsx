'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GalaxyStar, GalaxyData } from '@/lib/types';

export type { GalaxyStar, GalaxyData };

interface Props {
  data: GalaxyData;
  onStarClick?: (star: GalaxyStar) => void;
  autoRotate?: boolean;
  backgroundStarsCount?: number;
  highlightStarId?: number;
}

// ==========================================
// Math Utilities
// ==========================================
function seededRand(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 4294967296;
  };
}

function resolveStarRegion(rng: () => number, weight: number) {
  if (weight > 0.65 && rng() < (weight - 0.45) * 1.7) return 'bulge';
  return rng() < 0.72 ? 'arm' : 'disk';
}

function generateStarPlacement(index: number, weight: number) {
  const rng         = seededRand(index * 2654435761 ^ 1013904223);
  const NUM_ARMS    = 4;
  const B_PITCH     = Math.tan((15 * Math.PI) / 180);
  const MAX_RADIUS  = 60;
  const CORE_RADIUS = 7;
  const SCALE_LEN   = 18;
  const DISK_HEIGHT = 1.6;
  const ARM_HW      = (22 * Math.PI) / 180;
  const region      = resolveStarRegion(rng, weight);

  if (region === 'bulge') {
    const theta = rng() * 2 * Math.PI;
    const phi   = Math.acos(2 * rng() - 1);
    const r     = CORE_RADIUS * Math.pow(rng(), 0.38) * (0.55 + weight * 0.75);
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi) * 0.62,
      z: r * Math.sin(phi) * Math.sin(theta),
      region: 'bulge',
    };
  }

  const u      = rng() * 0.97 + 0.015;
  const r      = Math.max(CORE_RADIUS * 1.1, Math.min(-SCALE_LEN * Math.log(1 - u), MAX_RADIUS));
  const armIdx = index % NUM_ARMS;
  let angle;

  if (region === 'arm') {
    const armBase   = (armIdx / NUM_ARMS) * 2 * Math.PI;
    const armCenter = (1 / B_PITCH) * Math.log(r / CORE_RADIUS) + armBase;
    const n         = rng() + rng() + rng() + rng() - 2;
    angle = armCenter + n * ARM_HW * (0.55 + r / MAX_RADIUS) * 0.5;
  } else {
    angle = rng() * 2 * Math.PI;
    if (rng() < 0.28) {
      const armBase   = (armIdx / NUM_ARMS) * 2 * Math.PI;
      const armCenter = (1 / B_PITCH) * Math.log(r / CORE_RADIUS) + armBase;
      angle = armCenter + (rng() - 0.5) * Math.PI * 0.9;
    }
  }

  const rF = r * (1 + (rng() - 0.5) * 0.07);
  const u1 = Math.max(rng(), 1e-9);
  const gZ = Math.sqrt(-2 * Math.log(u1)) * Math.cos(rng() * 2 * Math.PI);
  const y  = gZ * DISK_HEIGHT * (0.45 + (1 - weight) * 1.0);

  return { x: rF * Math.cos(angle), y, z: rF * Math.sin(angle), region };
}

/**
 * Distribute institutions evenly across the 4 spiral arms (inside to outside).
 * Uses seeded random for deterministic, non-collinear placement.
 */
function generateInstitutionPlacement(index: number, totalCount: number) {
  const NUM_ARMS    = 4;
  const B_PITCH     = Math.tan((15 * Math.PI) / 180);
  const CORE_RADIUS = 7;
  const MIN_R       = 14;
  const MAX_R       = 52;

  const armIdx      = index % NUM_ARMS;
  const posInArm    = Math.floor(index / NUM_ARMS);
  const totalPerArm = Math.ceil(totalCount / NUM_ARMS);
  const t           = (posInArm + 0.5) / totalPerArm;
  const r           = MIN_R + t * (MAX_R - MIN_R);

  const armBase   = (armIdx / NUM_ARMS) * 2 * Math.PI;
  const armCenter = (1 / B_PITCH) * Math.log(r / CORE_RADIUS) + armBase;

  const rnd1  = seededRand(index * 1234567 + 987654);
  const rnd2  = seededRand(index * 987654  + 1234567);
  const angle = armCenter + (rnd1() - 0.5) * 0.25;
  const y     = (rnd2() - 0.5) * 1.8;

  return { x: r * Math.cos(angle), y, z: r * Math.sin(angle) };
}

// ==========================================
// Main Component
// ==========================================
export default function GalaxyCanvas({
  data,
  onStarClick,
  autoRotate = true,
  backgroundStarsCount = 50000,
  highlightStarId,
}: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const tooltipRef     = useRef<HTMLDivElement>(null);
  const onStarClickRef = useRef(onStarClick);
  useEffect(() => { onStarClickRef.current = onStarClick; }, [onStarClick]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Device detection for responsive behaviour
    const isMobile = container.clientWidth < 768;
    const isTouch  = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 1. Scene Setup
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x00010a, 0.0008);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000,
    );
    camera.position.set(0, isMobile ? 115 : 90, isMobile ? 165 : 130);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setClearColor(0x00010a);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none'; // prevent page scroll on touch

    // Suppress Three.js / OrbitControls known bug: releasePointerCapture with stale pointer id
    const _domEl = renderer.domElement;
    const _origRelease = _domEl.releasePointerCapture.bind(_domEl);
    _domEl.releasePointerCapture = (id: number) => { try { _origRelease(id); } catch (_) { /* ignore */ } };

    const controls        = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance   = 600;
    controls.minDistance   = 10;

    const SCALE       = 2.0;

    // Focus camera on highlighted star if provided
    if (highlightStarId !== undefined) {
      const hlIdx = data.stars.findIndex(s => s.id === highlightStarId);
      if (hlIdx !== -1) {
        const p = generateInstitutionPlacement(hlIdx, data.stars.length);
        const tx = p.x * SCALE, ty = p.y * SCALE, tz = p.z * SCALE;
        camera.position.set(tx + 0, ty + 30, tz + 45);
        controls.target.set(tx, ty, tz);
      }
    }

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1.5 Deep Space Stars — fixed, randomly scattered across the universe sphere
    const DS_COUNT = isMobile ? 6000 : 12000;
    const dsGeo    = new THREE.BufferGeometry();
    const dsPos    = new Float32Array(DS_COUNT * 3);
    const dsCol    = new Float32Array(DS_COUNT * 3);
    const dsSz     = new Float32Array(DS_COUNT);
    const dsOp     = new Float32Array(DS_COUNT);
    const dsTmp    = new THREE.Color();

    for (let i = 0; i < DS_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 350 + Math.random() * 550;
      dsPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      dsPos[i * 3 + 1] = r * Math.cos(phi);
      dsPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const w = Math.random();
      dsTmp.set(w > 0.78 ? '#ffeedd' : w > 0.55 ? '#ddeeff' : '#ffffff');
      dsCol[i * 3]     = dsTmp.r;
      dsCol[i * 3 + 1] = dsTmp.g;
      dsCol[i * 3 + 2] = dsTmp.b;
      dsSz[i] = 0.4 + Math.random() * 1.1;
      dsOp[i] = 0.25 + Math.random() * 0.45;
    }
    dsGeo.setAttribute('position',    new THREE.BufferAttribute(dsPos, 3));
    dsGeo.setAttribute('customColor', new THREE.BufferAttribute(dsCol, 3));
    dsGeo.setAttribute('size',        new THREE.BufferAttribute(dsSz,  1));
    dsGeo.setAttribute('opacity',     new THREE.BufferAttribute(dsOp,  1));
    const dsMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3  customColor;
        attribute float opacity;
        varying vec3  vColor;
        varying float vOpacity;
        void main() {
          vColor   = customColor;
          vOpacity = opacity;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord.xy - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (0.5 - dist) * 2.0 * vOpacity;
          vec3  col   = mix(vColor, vec3(1.0), max(0.0, (0.15 - dist) * 5.0));
          gl_FragColor = vec4(col, alpha);
        }
      `,
      blending:    THREE.AdditiveBlending,
      depthTest:   false,
      transparent: true,
    });
    scene.add(new THREE.Points(dsGeo, dsMat));

    // 2. Background Star Shader
    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3  customColor;
        attribute float opacity;
        varying vec3  vColor;
        varying float vOpacity;
        void main() {
          vColor   = customColor;
          vOpacity = opacity;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vOpacity;
        void main() {
          vec2  uv   = gl_PointCoord.xy - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          float alpha = (0.5 - dist) * 2.0 * vOpacity;
          vec3  col   = mix(vColor, vec3(1.0), max(0.0, (0.2 - dist) * 3.0));
          gl_FragColor = vec4(col, alpha);
        }
      `,
      blending:    THREE.AdditiveBlending,
      depthTest:   false,
      transparent: true,
    });

    // 3. Background Stars (reduced on mobile for performance)
    const effectiveCount = isMobile ? Math.min(backgroundStarsCount, 20000) : backgroundStarsCount;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(effectiveCount * 3);
    const bgCol = new Float32Array(effectiveCount * 3);
    const bgSz  = new Float32Array(effectiveCount);
    const bgOp  = new Float32Array(effectiveCount);
    const c     = new THREE.Color();

    for (let i = 0; i < effectiveCount; i++) {
      const w = Math.random();
      const p = generateStarPlacement(i, w);

      bgPos[i * 3]     = p.x * SCALE;
      bgPos[i * 3 + 1] = p.y * SCALE;
      bgPos[i * 3 + 2] = p.z * SCALE;

      if      (p.region === 'bulge') c.set(w > 0.5 ? '#ffe8c0' : '#ff9940');
      else if (p.region === 'arm')   c.set(w > 0.6 ? '#00eeff' : w > 0.3 ? '#aa44ff' : '#4488ff');
      else                           c.set(w > 0.5 ? '#c8e8ff' : '#667acc');

      bgCol[i * 3]     = c.r;
      bgCol[i * 3 + 1] = c.g;
      bgCol[i * 3 + 2] = c.b;
      bgSz[i]          = (0.4 + w * 1.8) * (p.region === 'bulge' ? 1.1 : 1.7);
      bgOp[i]          = 0.12 + w * 0.32;
    }

    bgGeo.setAttribute('position',    new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('customColor', new THREE.BufferAttribute(bgCol, 3));
    bgGeo.setAttribute('size',        new THREE.BufferAttribute(bgSz, 1));
    bgGeo.setAttribute('opacity',     new THREE.BufferAttribute(bgOp, 1));
    masterGroup.add(new THREE.Points(bgGeo, bgMaterial));

    // 4. Dust Nebula
    const DUST_N  = 3000;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(DUST_N * 3);
    const dustCol = new Float32Array(DUST_N * 3);
    const dustSz  = new Float32Array(DUST_N);

    for (let i = 0; i < DUST_N; i++) {
      const p = generateStarPlacement(i * 99, 0.5);
      dustPos[i * 3]     = p.x * SCALE + (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 1] = p.y * SCALE * 3.0;
      dustPos[i * 3 + 2] = p.z * SCALE + (Math.random() - 0.5) * 10;

      const rnd = Math.random();
      c.setHex(rnd < 0.35 ? 0x0a0535 : rnd < 0.60 ? 0x05082a : rnd < 0.80 ? 0x150535 : 0x002535);
      dustCol[i * 3]     = c.r;
      dustCol[i * 3 + 1] = c.g;
      dustCol[i * 3 + 2] = c.b;
      dustSz[i]          = 40 + Math.random() * 70;
    }

    dustGeo.setAttribute('position',    new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('customColor', new THREE.BufferAttribute(dustCol, 3));
    dustGeo.setAttribute('size',        new THREE.BufferAttribute(dustSz, 1));

    const dustMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3  customColor;
        varying vec3 vColor;
        void main() {
          vColor = customColor;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord.xy - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist) * 0.22;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      transparent: true,
    });
    masterGroup.add(new THREE.Points(dustGeo, dustMat));

    // 5. Institution Stars (spread across spiral arms)
    const N      = data.stars.length;
    const iPos   = new Float32Array(N * 3);
    const iCol   = new Float32Array(N * 3);
    const iSz    = new Float32Array(N);
    const iOp    = new Float32Array(N);
    const glowSz = new Float32Array(N);

    data.stars.forEach((star, i) => {
      const p         = generateInstitutionPlacement(i, N);
      iPos[i * 3]     = p.x * SCALE;
      iPos[i * 3 + 1] = p.y * SCALE;
      iPos[i * 3 + 2] = p.z * SCALE;

      c.set(star.color || '#ffffff');
      iCol[i * 3]     = c.r;
      iCol[i * 3 + 1] = c.g;
      iCol[i * 3 + 2] = c.b;

      const base  = (star.size || 5) * 3.5;
      iSz[i]      = base;
      glowSz[i]   = base * 2.5;
      iOp[i]      = 1.0;
    });

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position',    new THREE.BufferAttribute(iPos.slice(), 3));
    coreGeo.setAttribute('customColor', new THREE.BufferAttribute(iCol, 3));
    coreGeo.setAttribute('size',        new THREE.BufferAttribute(iSz, 1));
    coreGeo.setAttribute('opacity',     new THREE.BufferAttribute(iOp, 1));

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position',    new THREE.BufferAttribute(iPos, 3));
    glowGeo.setAttribute('customColor', new THREE.BufferAttribute(iCol, 3));
    glowGeo.setAttribute('size',        new THREE.BufferAttribute(glowSz, 1));

    const coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3  customColor;
        attribute float opacity;
        varying vec3  vColor;
        varying float vOp;
        void main() {
          vColor = customColor;
          vOp    = opacity;
          vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3  vColor;
        varying float vOp;
        void main() {
          vec2  uv   = gl_PointCoord.xy - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          float pulse = 0.85 + 0.15 * sin(uTime * 3.0);
          float core  = smoothstep(0.18 * pulse, 0.0, dist);
          float halo  = smoothstep(0.5, 0.08, dist) * 0.55 * pulse;
          float alpha = clamp(core + halo, 0.0, 1.0) * vOp;
          vec3  col   = mix(vColor, vec3(1.0), core * 0.8);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      blending:    THREE.AdditiveBlending,
      depthTest:   false,
      transparent: true,
    });

 const glowMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: `
    attribute float size;
    attribute vec3  customColor;
    varying vec3 vColor;
    void main() {
      vColor = customColor;
      vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord.xy - vec2(0.5));
      if (dist > 0.5) discard;
      
      float pulse = 0.60 + 0.40 * sin(uTime * 2.0);
      float glow  = (0.5 - dist) * 2.0 * pulse;
      float alpha = glow * 0.85;
      if (alpha < 0.01) discard;
      // Cyan tech tint — mix institution color toward #00eeff
      vec3 cyanTint = vec3(0.0, 0.93, 1.0);
      vec3 finalCol = mix(vColor, cyanTint, 0.45);
      gl_FragColor  = vec4(finalCol, alpha);
    }
  `,
  blending:    THREE.AdditiveBlending,
  depthTest:   false,
  transparent: true,
});
    const coreSystem = new THREE.Points(coreGeo, coreMat);
    const glowSystem = new THREE.Points(glowGeo, glowMat);
    masterGroup.add(glowSystem);
    masterGroup.add(coreSystem);

    masterGroup.rotation.x = 0.2;
    masterGroup.rotation.z = 0.1;

    // Highlight ring for focused star
    let highlightRing: THREE.Mesh | null = null;
    if (highlightStarId !== undefined) {
      const hlIdx = data.stars.findIndex(s => s.id === highlightStarId);
      if (hlIdx !== -1) {
        const p  = generateInstitutionPlacement(hlIdx, data.stars.length);
        const ringGeo = new THREE.RingGeometry(3.5 * SCALE * 0.08, 4.5 * SCALE * 0.08, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
        highlightRing = new THREE.Mesh(ringGeo, ringMat);
        highlightRing.position.set(p.x * SCALE, p.y * SCALE, p.z * SCALE);
        highlightRing.lookAt(camera.position);
        masterGroup.add(highlightRing);
      }
    }

    const coreLight = new THREE.PointLight(0xd0e8ff, 18, 20 * SCALE);
    scene.add(coreLight);

    // Galactic nucleus — natural white bulge, no yellow, no over-glow
    // Outer diffuse halo
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = 256;
    const haloCx  = haloCanvas.getContext('2d')!;
    const haloGrd = haloCx.createRadialGradient(128, 128, 0, 128, 128, 128);
    haloGrd.addColorStop(0,    'rgba(210, 228, 255, 0.28)');
    haloGrd.addColorStop(0.40, 'rgba(160, 195, 255, 0.10)');
    haloGrd.addColorStop(1,    'rgba(0,   0,   0,   0)');
    haloCx.fillStyle = haloGrd;
    haloCx.fillRect(0, 0, 256, 256);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5 });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(10 * SCALE, 10 * SCALE, 1);
    masterGroup.add(haloSprite);
    // Tight bright nucleus centre
    const coreCvs = document.createElement('canvas');
    coreCvs.width = coreCvs.height = 128;
    const coreCx  = coreCvs.getContext('2d')!;
    const coreGrd = coreCx.createRadialGradient(64, 64, 0, 64, 64, 64);
    coreGrd.addColorStop(0,    'rgba(255, 255, 255, 0.90)');
    coreGrd.addColorStop(0.12, 'rgba(200, 220, 255, 0.55)');
    coreGrd.addColorStop(0.35, 'rgba(150, 180, 255, 0.12)');
    coreGrd.addColorStop(1,    'rgba(0,   0,   0,   0)');
    coreCx.fillStyle = coreGrd;
    coreCx.fillRect(0, 0, 128, 128);
    const coreSpriteTex = new THREE.CanvasTexture(coreCvs);
    const coreSpriteMat = new THREE.SpriteMaterial({
      map: coreSpriteTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.72,
    });
    const coreSprite = new THREE.Sprite(coreSpriteMat);
    coreSprite.scale.set(3.5 * SCALE, 3.5 * SCALE, 1);
    masterGroup.add(coreSprite);
// 5.1 روابط الاتفاقيات (خطوط رمادية خفيفة)
    let linksMesh: THREE.LineSegments | null = null;
    let linksMaterial: THREE.LineBasicMaterial | null = null;
    if (data.links && data.links.length > 0) {
      const linksPositions: number[] = [];
      const starPositions = new Map<number, { x: number; y: number; z: number }>();
      data.stars.forEach(star => {
        const p = generateInstitutionPlacement(star.id - 1, data.stars.length);
        starPositions.set(star.id, { x: p.x * SCALE, y: p.y * SCALE, z: p.z * SCALE });
      });
      data.links.forEach(link => {
        const from = starPositions.get(link.from);
        const to   = starPositions.get(link.to);
        if (from && to) {
          linksPositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
        }
      });
      if (linksPositions.length > 0) {
        const linksGeometry = new THREE.BufferGeometry();
        linksGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linksPositions, 3));
        // Thin elegant silver lines — subtle interstellar connection
        linksMaterial = new THREE.LineBasicMaterial({
          color:       0x99bbdd,
          opacity:     0.12,
          transparent: true,
          blending:    THREE.AdditiveBlending,
          depthWrite:  false,
        });
        linksMesh = new THREE.LineSegments(linksGeometry, linksMaterial);
        masterGroup.add(linksMesh);
      }
    }
    // 6. Raycasting / Interaction
    const raycaster   = new THREE.Raycaster();
    raycaster.params.Points!.threshold = isTouch ? 8 : 4; // wider target on touch
    const mouse        = new THREE.Vector2();
    let hoveredIdx: number | null = null;
    let pointerDownAt  = { x: 0, y: 0 };

    // Shared hover logic — used by mouse-move (desktop) and pointer-down (touch)
    const updateHover = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(coreSystem);
      if (hits.length > 0) {
        const idx = hits[0].index!;
        if (idx !== hoveredIdx) {
          hoveredIdx = idx;
          const s = data.stars[idx];
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'block';
            const nameEl = document.createElement('strong');
            nameEl.style.color   = s.color || '#fff';
            nameEl.textContent   = s.name_ar || s.name;
            const typeEl = document.createElement('span');
            typeEl.style.cssText = 'display:block;font-size:0.78rem;color:#aaa;margin-top:4px';
            typeEl.textContent   = `النوع: ${s.type}`;
            tooltipRef.current.replaceChildren(nameEl, typeEl);
          }
        }
        return true;
      }
      hoveredIdx = null;
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      return false;
    };

    // Position tooltip: follows cursor on desktop, pinned to bottom-center on mobile
    const positionTooltip = (clientX: number, clientY: number) => {
      if (!tooltipRef.current) return;
      if (isMobile) {
        tooltipRef.current.style.left      = '50%';
        tooltipRef.current.style.transform = 'translateX(-50%)';
        tooltipRef.current.style.bottom    = '110px';
        tooltipRef.current.style.top       = 'auto';
      } else {
        tooltipRef.current.style.left      = `${clientX + 15}px`;
        tooltipRef.current.style.top       = `${clientY + 15}px`;
        tooltipRef.current.style.bottom    = 'auto';
        tooltipRef.current.style.transform = '';
      }
    };

    const onPointerMove = (e: MouseEvent) => {
      // Touch devices: no hover on move — handled via tap in onPointerDown
      if ((e as PointerEvent).pointerType === 'touch') return;
      if (updateHover(e.clientX, e.clientY)) {
        document.body.style.cursor = 'pointer';
        positionTooltip(e.clientX, e.clientY);
      } else {
        document.body.style.cursor = 'default';
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownAt = { x: e.clientX, y: e.clientY };
      // On touch: show tooltip immediately on tap
      if ((e as PointerEvent).pointerType === 'touch') {
        updateHover(e.clientX, e.clientY);
        positionTooltip(e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      const d = Math.hypot(e.clientX - pointerDownAt.x, e.clientY - pointerDownAt.y);
      // Allow up to 10px drift (fingers are less precise than mouse)
      if (d < 10 && hoveredIdx !== null) onStarClickRef.current?.(data.stars[hoveredIdx]);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup',   onPointerUp);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // 7. Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      coreMat.uniforms.uTime.value = t;
      glowMat.uniforms.uTime.value = t;

      // Subtle link shimmer
      if (linksMesh && linksMaterial) {
        linksMaterial.opacity = 0.08 + 0.06 * Math.sin(t * 0.9);
      }
      const sz = coreGeo.attributes.size.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const base = (data.stars[i].size || 5) * 3.5;
        sz[i] = base + Math.sin(t * 2.5 + i * 0.7) * base * 0.15;
      }
      coreGeo.attributes.size.needsUpdate = true;

      if (autoRotate) masterGroup.rotation.y -= 0.0003;

      // Keep highlight ring facing the camera
      if (highlightRing) highlightRing.lookAt(camera.position);

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Cleanup
    return () => {
      window.removeEventListener('resize',       onResize);
      window.removeEventListener('pointermove',  onPointerMove);
      window.removeEventListener('pointerdown',  onPointerDown);
      window.removeEventListener('pointerup',    onPointerUp);
      cancelAnimationFrame(animId);

      bgGeo.dispose();
      dustGeo.dispose();
      coreGeo.dispose();
      glowGeo.dispose();
      bgMaterial.dispose();
      dustMat.dispose();
      coreMat.dispose();
      glowMat.dispose();
      haloMat.dispose(); haloTex.dispose();
      coreSpriteMat.dispose(); coreSpriteTex.dispose();
      dsGeo.dispose(); dsMat.dispose();
      if (linksMaterial) linksMaterial.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      document.body.style.cursor = 'default';
    };
  }, [data, autoRotate, backgroundStarsCount]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
      <div
        ref={tooltipRef}
        style={{
          display:        'none',
          position:       'fixed',
          background:     'rgba(10, 15, 30, 0.92)',
          color:          'white',
          padding:        '12px 18px',
          borderRadius:   '10px',
          pointerEvents:  'none',
          border:         '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          boxShadow:      '0 6px 24px rgba(0,0,0,0.7)',
          zIndex:         10,
          fontFamily:     "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          direction:      'rtl',
          minWidth:       '170px',
        }}
      />
    </div>
  );
}
