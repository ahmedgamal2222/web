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

    // 1. Scene Setup
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x020205, 0.0012);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000,
    );
    camera.position.set(0, 90, 130);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020205);
    container.appendChild(renderer.domElement);

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

    // 3. Background Stars
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(backgroundStarsCount * 3);
    const bgCol = new Float32Array(backgroundStarsCount * 3);
    const bgSz  = new Float32Array(backgroundStarsCount);
    const bgOp  = new Float32Array(backgroundStarsCount);
    const c     = new THREE.Color();

    for (let i = 0; i < backgroundStarsCount; i++) {
      const w = Math.random();
      const p = generateStarPlacement(i, w);

      bgPos[i * 3]     = p.x * SCALE;
      bgPos[i * 3 + 1] = p.y * SCALE;
      bgPos[i * 3 + 2] = p.z * SCALE;

      if      (p.region === 'bulge') c.set(w > 0.5 ? '#FFD2A1' : '#FF9B4E');
      else if (p.region === 'arm')   c.set(w > 0.5 ? '#9BB0FF' : '#CAD7FF');
      else                           c.set('#FFFFFF');

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
      c.setHex(rnd < 0.6 ? 0x11111a : rnd < 0.8 ? 0x0a1530 : 0x2a0a15);
      dustCol[i * 3]     = c.r;
      dustCol[i * 3 + 1] = c.g;
      dustCol[i * 3 + 2] = c.b;
      dustSz[i]          = 30 + Math.random() * 50;
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
          float alpha = smoothstep(0.5, 0.0, dist) * 0.10;
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
      
      // توهج بسيط - يزيد كلما اقتربنا من المركز
      float glow = (0.5 - dist) * 2.0 * pulse;
      
      float alpha = glow * 0.8;
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(vColor, alpha);
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

    const coreLight = new THREE.PointLight(0xffeedd, 1.5, 180 * SCALE);
    scene.add(coreLight);
// 5.1 روابط الاتفاقيات (خطوط رمادية خفيفة)
if (data.links && data.links.length > 0) {
  console.log(`🎨 رسم ${data.links.length} رابط`);
  
  const linksPositions: number[] = [];
  
  // تجميع مواقع النجوم في Map للوصول السريع
  const starPositions = new Map();
  data.stars.forEach(star => {
    const p = generateInstitutionPlacement(star.id - 1, data.stars.length); // استخدام نفس خوارزمية التموضع
    starPositions.set(star.id, {
      x: p.x * SCALE,
      y: p.y * SCALE,
      z: p.z * SCALE
    });
  });

  // بناء خطوط الروابط
  data.links.forEach(link => {
    const fromPos = starPositions.get(link.from);
    const toPos = starPositions.get(link.to);
    
    if (fromPos && toPos) {
      linksPositions.push(
        fromPos.x, fromPos.y, fromPos.z,
        toPos.x, toPos.y, toPos.z
      );
    }
  });

  if (linksPositions.length > 0) {
    const linksGeometry = new THREE.BufferGeometry();
    linksGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linksPositions, 3));

    // رابط رمادي خفيف
    const linksMaterial = new THREE.LineBasicMaterial({ 
      color: 0xaaaaaa,  // رمادي فاتح
      opacity: 0.25,     // شفافية خفيفة
      transparent: true
    });

    const linksMesh = new THREE.LineSegments(linksGeometry, linksMaterial);
    masterGroup.add(linksMesh);
    console.log('✅ تمت إضافة الروابط');
  }
}
    // 6. Raycasting / Interaction
    const raycaster   = new THREE.Raycaster();
    raycaster.params.Points!.threshold = 4;
    const mouse        = new THREE.Vector2();
    let hoveredIdx: number | null = null;
    let pointerDownAt  = { x: 0, y: 0 };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x    =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y    = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(coreSystem);

      if (hits.length > 0) {
        document.body.style.cursor = 'pointer';
        const idx = hits[0].index!;
        if (idx !== hoveredIdx) {
          hoveredIdx = idx;
          const s    = data.stars[idx];
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'block';
            const nameEl  = document.createElement('strong');
            nameEl.style.color   = s.color || '#fff';
            nameEl.textContent   = s.name_ar || s.name;
            const typeEl  = document.createElement('span');
            typeEl.style.cssText = 'display:block;font-size:0.78rem;color:#aaa;margin-top:4px';
            typeEl.textContent   = `النوع: ${s.type}`;
            tooltipRef.current.replaceChildren(nameEl, typeEl);
          }
        }
      } else {
        document.body.style.cursor = 'default';
        hoveredIdx = null;
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      }

      if (tooltipRef.current && hoveredIdx !== null) {
        tooltipRef.current.style.left = `${e.clientX + 15}px`;
        tooltipRef.current.style.top  = `${e.clientY + 15}px`;
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownAt = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const d = Math.hypot(e.clientX - pointerDownAt.x, e.clientY - pointerDownAt.y);
      if (d < 5 && hoveredIdx !== null) onStarClickRef.current?.(data.stars[hoveredIdx]);
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
