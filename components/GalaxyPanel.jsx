// GalaxyPanel.jsx
import React, { useEffect, useRef, useState } from "react";

function project3Dto2D(pos, width, height, scale = 6, center = { x: 0, y: 0 }) {
  // بسيط: إسقاط أورثوغرافي مع تحجيم ومركز
  return {
    x: Math.round(width / 2 + (pos.x - center.x) * scale),
    y: Math.round(height / 2 + (pos.y - center.y) * scale)
  };
}

export default function GalaxyPanel({
  api = "/api/galaxy?panel=true",
  width = 1000,
  height = 700,
  devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
}) {
  const canvasRef = useRef(null);
  const [data, setData] = useState({ stars: [], links: [], center: { x: 0, y: 0, z: 0 } });
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch(api)
      .then(r => r.json())
      .then(json => {
        if (!mounted) return;
        // ensure arrays exist
        setData({
          stars: (json.stars || []).map(s => ({ ...s })),
          links: json.links || [],
          center: json.center || { x: 0, y: 0, z: 0 }
        });
      })
      .catch(err => {
        console.error("Failed to load galaxy panel:", err);
      });
    return () => { mounted = false; };
  }, [api]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = devicePixelRatio;
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(DPR, DPR);

    // prepare projected positions
    const proj = new Map();
    const scale = Math.min(width, height) / 120; // ضبط مبدئي
    const center = data.center || { x: 0, y: 0, z: 0 };

    data.stars.forEach(s => {
      const p = project3Dto2D(s.position, width, height, scale, center);
      proj.set(s.id, { ...p, star: s });
    });

    // clear
    ctx.clearRect(0, 0, width, height);
    // background (optional)
    ctx.fillStyle = "#071028";
    ctx.fillRect(0, 0, width, height);

    // draw links first (so stars are on top)
    ctx.lineCap = "round";
    data.links.forEach(link => {
      const a = proj.get(link.from);
      const b = proj.get(link.to);
      if (!a || !b) return;
      // style by type/strength
      ctx.beginPath();
      ctx.strokeStyle = "rgba(140,180,255,0.6)";
      ctx.lineWidth = (link.strength || 1) * 1.2;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    // draw stars
    data.stars.forEach(s => {
      const p = proj.get(s.id);
      if (!p) return;
      const radius = Math.max(1, (s.size || 4) * 0.9);
      // halo
      const brightness = Math.max(0.18, Math.min(1, s.brightness || 0.5));
      ctx.beginPath();
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3);
      grad.addColorStop(0, hexToRgba(s.color || "#fff", 0.95 * brightness));
      grad.addColorStop(0.4, hexToRgba(s.color || "#fff", 0.45 * brightness));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(p.x - radius * 3, p.y - radius * 3, radius * 6, radius * 6);

      // core
      ctx.beginPath();
      ctx.fillStyle = s.is_institution ? (hoverId === s.id ? "#fff" : s.color || "#fff") : "#888";
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // stroke for institutions
      if (s.is_institution) {
        ctx.lineWidth = hoverId === s.id ? 2 : 1;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.stroke();
      }

      // screen_active indicator (small red dot top-right)
      if (s.screen_active) {
        const dotR = Math.max(2, radius * 0.6);
        ctx.beginPath();
        ctx.fillStyle = "#ff4d4d";
        ctx.arc(p.x + radius * 0.9, p.y - radius * 0.9, dotR, 0, Math.PI * 2);
        ctx.fill();
        // optional pulsing ring
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,77,77,0.25)";
        ctx.lineWidth = 1;
        ctx.arc(p.x + radius * 0.9, p.y - radius * 0.9, dotR + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // helper: convert hex to rgba
    function hexToRgba(hex, alpha = 1) {
      const h = hex.replace("#", "");
      const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r},${g},${b},${alpha})`;
    }

    // store proj map for click handler via ref
    canvas._proj = proj;
  }, [data, width, height, hoverId, devicePixelRatio]);

  // click handler: hit test nearest interactive star
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onClick = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const proj = canvas._proj;
      if (!proj) return;
      let best = null;
      let bestDist = Infinity;
      for (const [id, p] of proj.entries()) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy);
        const r = Math.max(4, (p.star.size || 4) * 0.9) + 6;
        if (d < r && d < bestDist && p.star.interactive) {
          best = p.star;
          bestDist = d;
        }
      }
      if (best) {
        // افتح صفحة المؤسسة أو نفّذ أي إجراء تريده
        window.open(`/institutions/${best.id}`, "_blank");
      }
    };

    const onMove = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const proj = canvas._proj;
      if (!proj) return;
      let found = null;
      for (const [id, p] of proj.entries()) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy);
        const r = Math.max(4, (p.star.size || 4) * 0.9) + 6;
        if (d < r && p.star.interactive) {
          found = p.star.id;
          break;
        }
      }
      setHoverId(found);
      canvas.style.cursor = found ? "pointer" : "default";
    };

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [data]);

  return (
    <div style={{ width, height, position: "relative", background: "#071028", borderRadius: 8, overflow: "hidden" }}>
      <canvas ref={canvasRef} />
      {/* optional overlay legend */}
      <div style={{ position: "absolute", left: 12, top: 12, color: "#cfe", fontSize: 13 }}>
        <div>المجرة الحضارية — لوحة المؤسسات</div>
        <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff4d4d" }} />
            <div style={{ color: "#cfe" }}>بث نشط</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff" }} />
            <div style={{ color: "#cfe" }}>مؤسسة</div>
          </div>
        </div>
      </div>
    </div>
  );
}
