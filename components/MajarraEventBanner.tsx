'use client';

import { useEffect, useState } from 'react';

// ============================================================
// إعلان فعاليات المجرة الحضارية — 12 / 12
// بانر زجاجي متحرك أعلى الصفحة الرئيسية
// ============================================================
const EVENT_URL = 'https://event.hadmaj.com/majarra-event-2026/';
const EVENT_DATE = new Date(2026, 11, 12, 0, 0, 0).getTime(); // 12 ديسمبر 2026
const STORAGE_KEY = 'majarra-event-banner-collapsed';

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  ended: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');

function getCountdown(target: number): Countdown {
  const diff = target - Date.now();

  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', ended: true };
  }

  const total = Math.floor(diff / 1000);

  return {
    days: pad(Math.floor(total / 86400)),
    hours: pad(Math.floor((total % 86400) / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
    seconds: pad(total % 60),
    ended: false,
  };
}

export default function MajarraEventBanner() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true);
    } catch {}

    setReady(true);

    const tick = () => setCountdown(getCountdown(EVENT_DATE));
    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {}
  };

  if (!ready) return null;

  const cells = [
    { value: countdown?.days ?? '--', label: 'يوم' },
    { value: countdown?.hours ?? '--', label: 'ساعة' },
    { value: countdown?.minutes ?? '--', label: 'دقيقة' },
    { value: countdown?.seconds ?? '--', label: 'ثانية' },
  ];

  return (
    <div className={`mjl-wrap${collapsed ? ' mjl-wrap--collapsed' : ''}`}>
      {collapsed ? (
        <div className="mjl-pillbar">
          <a
            className="mjl-pill"
            href={EVENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="فعاليات المجرة الحضارية — 12 / 12"
          >
            <span className="mjl-pill-star" aria-hidden="true">✦</span>
            <span>
              فعالية <b>12 / 12</b> — المجرة الحضارية
            </span>
          </a>
          <button
            type="button"
            className="mjl-pill-expand"
            onClick={() => toggleCollapsed(false)}
            aria-label="إظهار إعلان الفعالية"
            title="إظهار الإعلان"
          >
            ⌃
          </button>
        </div>
      ) : (
        <div className="mjl-banner" role="region" aria-label="إعلان فعاليات المجرة الحضارية">
          <a className="mjl-banner-link" href={EVENT_URL} target="_blank" rel="noopener noreferrer">
            <span className="mjl-nebula" aria-hidden="true" />
            <span className="mjl-shine" aria-hidden="true" />
            <span className="mjl-spark" style={{ width: 3, height: 3, top: '24%', right: '36%', animationDelay: '0.2s' }} aria-hidden="true" />
            <span className="mjl-spark" style={{ width: 2, height: 2, top: '68%', right: '52%', animationDelay: '1.1s' }} aria-hidden="true" />
            <span className="mjl-spark" style={{ width: 4, height: 4, top: '18%', right: '62%', animationDelay: '1.9s' }} aria-hidden="true" />
            <span className="mjl-spark" style={{ width: 2, height: 2, top: '74%', right: '28%', animationDelay: '2.5s' }} aria-hidden="true" />

            <span className="mjl-emblem" aria-hidden="true">
              <svg width="54" height="54" viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="mjl-gold" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFF3C4" />
                    <stop offset="0.45" stopColor="#FFD700" />
                    <stop offset="0.75" stopColor="#FFB300" />
                    <stop offset="1" stopColor="#C9962E" />
                  </linearGradient>
                  <radialGradient id="mjl-core" cx="0.5" cy="0.5" r="0.5">
                    <stop stopColor="#FFF9DC" />
                    <stop offset="0.45" stopColor="#FFD700" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#FFB300" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="32" cy="32" r="12" fill="url(#mjl-core)" />
                <g className="mjl-orbit mjl-orbit--a">
                  <ellipse cx="32" cy="32" rx="26" ry="11.5" stroke="url(#mjl-gold)" strokeWidth="1.4" opacity="0.9" />
                  <circle cx="58" cy="32" r="2.4" fill="#EDF7BD" />
                </g>
                <g className="mjl-orbit mjl-orbit--b">
                  <ellipse cx="32" cy="32" rx="24" ry="10.5" stroke="#85C79A" strokeWidth="1.1" opacity="0.6" transform="rotate(60 32 32)" />
                  <circle cx="32" cy="8" r="1.9" fill="#FFD700" />
                </g>
                <path
                  d="M32 23.5l2.3 6.2 6.2 2.3-6.2 2.3-2.3 6.2-2.3-6.2-6.2-2.3 6.2-2.3z"
                  fill="#FFF3C4"
                  opacity="0.95"
                />
              </svg>
            </span>

            <span className="mjl-content">
              <span className="mjl-tag">
                <span className="mjl-dot" aria-hidden="true" />
                إعلان رسمي
              </span>
              <span className="mjl-title">فعاليات المجرة الحضارية</span>
              <span className="mjl-meta">
                <span>
                  📅 <b>12 ديسمبر 2026</b>
                </span>
                <span className="mjl-sep" aria-hidden="true">•</span>
                <span className="mjl-meta-extra">لقاء المؤسسات والقادة والمبدعين في مجرة واحدة</span>
              </span>
            </span>

            {countdown?.ended ? (
              <span className="mjl-live">🎉 انطلقت الفعالية</span>
            ) : (
              <span className="mjl-countdown" aria-label="الوقت المتبقي للفعالية">
                {cells.map(cell => (
                  <span className="mjl-cd" key={cell.label}>
                    <span className="mjl-cd-num">{cell.value}</span>
                    <span className="mjl-cd-lbl">{cell.label}</span>
                  </span>
                ))}
              </span>
            )}

            <span className="mjl-cta">
              <span className="mjl-cta-long">التفاصيل والتسجيل</span>
              <span className="mjl-cta-short">التفاصيل</span>
              <span className="mjl-cta-arrow" aria-hidden="true">←</span>
            </span>
          </a>

          <button
            type="button"
            className="mjl-close"
            onClick={() => toggleCollapsed(true)}
            aria-label="إخفاء إعلان الفعالية"
            title="إخفاء الإعلان"
          >
            ✕
          </button>
        </div>
      )}

      <style>{BANNER_CSS}</style>
    </div>
  );
}

/* ============================================================
   STYLES — Majarra Event Banner
   ============================================================ */
const BANNER_CSS = `
  @property --mjl-angle {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
  }

  .mjl-wrap {
    position: fixed;
    top: 92px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 45;
    width: min(890px, calc(100vw - 48px));
    direction: rtl;
    font-family: 'Cairo', 'Tajawal', 'Segoe UI', system-ui, sans-serif;
    animation: mjlDrop 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .mjl-wrap--collapsed { width: auto; }

  @keyframes mjlDrop {
    from { opacity: 0; transform: translate(-50%, -16px) scale(0.97); }
    to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
  }

  .mjl-banner {
    position: relative;
    padding: 1.5px;
    border-radius: 22px;
    background: conic-gradient(from var(--mjl-angle, 0deg),
      rgba(255,215,0,0.95),
      rgba(133,199,154,0.85),
      rgba(78,141,156,0.95),
      rgba(40,28,89,0.85),
      rgba(255,215,0,0.95));
    box-shadow:
      0 18px 50px rgba(0,0,0,0.55),
      0 0 44px rgba(255,215,0,0.13),
      0 0 90px rgba(78,141,156,0.16);
    animation: mjlBorderSpin 9s linear infinite;
  }

  @keyframes mjlBorderSpin { to { --mjl-angle: 360deg; } }

  .mjl-banner-link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 13px 18px 13px 34px;
    border-radius: 20.5px;
    overflow: hidden;
    isolation: isolate;
    text-decoration: none;
    background:
      radial-gradient(120% 170% at 88% -30%, rgba(255,215,0,0.13), transparent 55%),
      radial-gradient(120% 170% at 6% 130%, rgba(78,141,156,0.20), transparent 60%),
      linear-gradient(135deg, rgba(17,14,48,0.97) 0%, rgba(7,7,26,0.98) 55%, rgba(24,19,64,0.96) 100%);
  }

  .mjl-nebula {
    position: absolute;
    inset: -45% -8%;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 76% 40%, rgba(237,247,189,0.16), transparent 42%),
      radial-gradient(circle at 18% 62%, rgba(78,141,156,0.24), transparent 48%),
      radial-gradient(circle at 46% 120%, rgba(255,215,0,0.10), transparent 55%);
    filter: blur(4px);
    animation: mjlNebula 10s ease-in-out infinite alternate;
  }

  @keyframes mjlNebula {
    from { opacity: 0.65; transform: translate3d(0, 0, 0) scale(1); }
    to   { opacity: 1;    transform: translate3d(-2%, -1%, 0) scale(1.05); }
  }

  .mjl-shine {
    position: absolute;
    top: -40%;
    bottom: -40%;
    left: -45%;
    width: 32%;
    z-index: 1;
    pointer-events: none;
    transform: skewX(-16deg);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), rgba(237,247,189,0.22), transparent);
    animation: mjlShine 6.5s ease-in-out infinite;
  }

  @keyframes mjlShine {
    0%, 58%   { left: -45%; opacity: 0; }
    64%       { opacity: 1; }
    94%, 100% { left: 125%; opacity: 0; }
  }

  .mjl-spark {
    position: absolute;
    z-index: 1;
    pointer-events: none;
    border-radius: 50%;
    background: #FFF3C4;
    box-shadow: 0 0 10px rgba(255,215,0,0.9);
    animation: mjlTwinkle 3.4s ease-in-out infinite;
  }

  @keyframes mjlTwinkle {
    0%, 100% { opacity: 0.15; transform: scale(0.8); }
    50%      { opacity: 0.95; transform: scale(1.2); }
  }
` + `
  /* ---------- الشعار المداري ---------- */
  .mjl-emblem {
    position: relative;
    z-index: 2;
    flex: 0 0 auto;
    width: 58px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 50%, rgba(255,215,0,0.16), rgba(78,141,156,0.10) 55%, transparent 72%);
    box-shadow: inset 0 0 0 1px rgba(255,215,0,0.18);
  }

  .mjl-emblem::after {
    content: '';
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    box-shadow: 0 0 26px rgba(255,215,0,0.35);
    animation: mjlPulseGlow 3.4s ease-in-out infinite;
  }

  @keyframes mjlPulseGlow {
    0%, 100% { opacity: 0.4; transform: scale(0.94); }
    50%      { opacity: 0.95; transform: scale(1.05); }
  }

  .mjl-orbit {
    transform-box: view-box;
    transform-origin: 32px 32px;
  }

  .mjl-orbit--a { animation: mjlOrbitSpin 12s linear infinite; }
  .mjl-orbit--b { animation: mjlOrbitSpin 8s linear infinite reverse; }

  @keyframes mjlOrbitSpin { to { transform: rotate(360deg); } }

  /* ---------- النصوص ---------- */
  .mjl-content {
    position: relative;
    z-index: 2;
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }

  .mjl-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(255,215,0,0.12);
    border: 1px solid rgba(255,215,0,0.28);
    color: #FFD700;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1.7;
  }

  .mjl-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #85C79A;
    box-shadow: 0 0 8px #85C79A;
    animation: mjlBlink 1.8s ease-in-out infinite;
  }

  @keyframes mjlBlink {
    0%, 100% { opacity: 0.35; }
    50%      { opacity: 1; }
  }

  .mjl-title {
    font-size: 1.12rem;
    font-weight: 900;
    line-height: 1.4;
    letter-spacing: -0.01em;
    background-image: linear-gradient(100deg, #FFF6D0 0%, #FFD700 34%, #FFE9A3 55%, #FFD700 74%, #C9962E 100%);
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 10px rgba(255,215,0,0.22));
    animation: mjlShimmer 7s linear infinite;
  }

  @keyframes mjlShimmer {
    from { background-position: 0% 50%; }
    to   { background-position: 220% 50%; }
  }

  .mjl-meta {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    font-size: 0.72rem;
    font-weight: 600;
    color: #9fb2c4;
    line-height: 1.6;
  }

  .mjl-meta b { color: #EDF7BD; font-weight: 800; }
  .mjl-sep { color: rgba(133,199,154,0.65); }

  /* ---------- العدّاد التنازلي ---------- */
  .mjl-countdown {
    position: relative;
    z-index: 2;
    flex: 0 0 auto;
    display: flex;
    align-items: stretch;
    gap: 5px;
  }

  .mjl-cd {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 38px;
    padding: 4px 0 3px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02));
    border: 1px solid rgba(255,215,0,0.20);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .mjl-cd-num {
    font-size: 0.92rem;
    font-weight: 800;
    line-height: 1;
    color: #FFF3C4;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 12px rgba(255,215,0,0.35);
  }

  .mjl-cd-lbl {
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #7e93a6;
  }

  .mjl-live {
    position: relative;
    z-index: 2;
    flex: 0 0 auto;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(133,199,154,0.16);
    border: 1px solid rgba(133,199,154,0.45);
    color: #EDF7BD;
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
  }



  /* ---------- زر الدعوة ---------- */
  .mjl-cta {
    position: relative;
    z-index: 2;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 18px;
    overflow: hidden;
    border-radius: 999px;
    background: linear-gradient(135deg, #FFE27A 0%, #FFD700 42%, #FFB300 100%);
    color: #241a05;
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.01em;
    white-space: nowrap;
    box-shadow: 0 6px 20px rgba(255,185,0,0.32), inset 0 1px 0 rgba(255,255,255,0.55);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .mjl-cta::after {
    content: '';
    position: absolute;
    top: -50%;
    bottom: -50%;
    left: -60%;
    width: 40%;
    transform: skewX(-18deg);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent);
    animation: mjlCtaShine 3.8s ease-in-out infinite;
  }

  @keyframes mjlCtaShine {
    0%, 55%   { left: -60%; }
    85%, 100% { left: 120%; }
  }

  .mjl-cta-short { display: none; }

  .mjl-cta-arrow {
    font-size: 0.95rem;
    line-height: 1;
    transition: transform 0.25s ease;
  }

  .mjl-banner-link:hover .mjl-cta {
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 10px 28px rgba(255,185,0,0.48), inset 0 1px 0 rgba(255,255,255,0.6);
  }

  .mjl-banner-link:hover .mjl-cta-arrow { transform: translateX(-4px); }

  /* ---------- زر الإخفاء ---------- */
  .mjl-close {
    position: absolute;
    top: 7px;
    left: 9px;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: #8fa3b5;
    font-size: 0.62rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mjl-close:hover {
    background: rgba(255,90,90,0.2);
    border-color: rgba(255,90,90,0.45);
    color: #ff9a9a;
  }

  /* ---------- الحالة المُصغّرة ---------- */
  .mjl-pillbar {
    display: flex;
    align-items: center;
    gap: 6px;
    animation: mjlDrop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .mjl-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    border-radius: 999px;
    text-decoration: none;
    background: linear-gradient(135deg, rgba(17,14,48,0.96), rgba(8,9,28,0.96));
    border: 1px solid rgba(255,215,0,0.35);
    color: #EDF7BD;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 12px 30px rgba(0,0,0,0.5), 0 0 24px rgba(255,215,0,0.12);
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
  }

  .mjl-pill:hover {
    border-color: rgba(255,215,0,0.7);
    transform: translateY(-1px);
    box-shadow: 0 16px 34px rgba(0,0,0,0.55), 0 0 32px rgba(255,215,0,0.22);
  }

  .mjl-pill b { color: #FFD700; font-weight: 900; }

  .mjl-pill-star {
    color: #FFD700;
    font-size: 0.85rem;
    animation: mjlTwinkle 2.8s ease-in-out infinite;
  }

  .mjl-pill-expand {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    color: #cbd8e4;
    font-size: 0.7rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mjl-pill-expand:hover {
    background: rgba(255,215,0,0.16);
    border-color: rgba(255,215,0,0.5);
    color: #FFD700;
  }

  /* ============================================================
     الاستجابة للأحجام المختلفة
     ============================================================ */
  @media (max-width: 1000px) {
    .mjl-countdown { display: none; }
  }

  @media (max-width: 820px) {
    .mjl-wrap { top: 84px; width: min(680px, calc(100vw - 28px)); }
    .mjl-banner-link { gap: 12px; padding: 11px 14px 11px 32px; }
    .mjl-title { font-size: 1.02rem; }
    .mjl-meta { font-size: 0.68rem; }
  }

  @media (max-width: 620px) {
    .mjl-wrap { top: 70px; width: calc(100vw - 18px); }
    .mjl-banner { border-radius: 18px; }
    .mjl-banner-link {
      gap: 10px;
      padding: 9px 11px 9px 30px;
      border-radius: 16.5px;
    }
    .mjl-emblem { width: 44px; height: 44px; }
    .mjl-emblem svg { width: 40px; height: 40px; }
    .mjl-content { gap: 2px; }
    .mjl-tag { font-size: 0.55rem; padding: 1px 7px; letter-spacing: 0.05em; }
    .mjl-title { font-size: 0.95rem; }
    .mjl-meta { font-size: 0.64rem; gap: 5px; }
    .mjl-meta-extra, .mjl-sep { display: none; }
    .mjl-cta { padding: 9px 13px; font-size: 0.74rem; gap: 5px; }
    .mjl-cta-long { display: none; }
    .mjl-cta-short { display: inline; }
    .mjl-cta-arrow { font-size: 0.85rem; }
    .mjl-close { top: 5px; left: 6px; width: 18px; height: 18px; font-size: 0.55rem; }
    .mjl-live { font-size: 0.64rem; padding: 6px 9px; }
  }

  @media (max-width: 420px) {
    .mjl-wrap { top: 62px; width: calc(100vw - 12px); }
    .mjl-banner-link { padding: 8px 9px 8px 26px; gap: 8px; }
    .mjl-emblem { width: 38px; height: 38px; }
    .mjl-emblem svg { width: 34px; height: 34px; }
    .mjl-tag { display: none; }
    .mjl-title { font-size: 0.88rem; }
    .mjl-meta { font-size: 0.6rem; }
    .mjl-cta { padding: 8px 10px; font-size: 0.68rem; }
    .mjl-close { width: 16px; height: 16px; top: 4px; left: 5px; }
    .mjl-pill { padding: 7px 12px; font-size: 0.7rem; }
    .mjl-pill-expand { width: 24px; height: 24px; font-size: 0.6rem; }
  }

  /* احترام تفضيل تقليل الحركة */
  @media (prefers-reduced-motion: reduce) {
    .mjl-wrap,
    .mjl-banner,
    .mjl-nebula,
    .mjl-shine,
    .mjl-spark,
    .mjl-emblem::after,
    .mjl-orbit,
    .mjl-title,
    .mjl-dot,
    .mjl-cta::after,
    .mjl-pill-star,
    .mjl-pillbar {
      animation: none !important;
    }
  }
`;


