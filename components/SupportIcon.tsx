'use client';

import React from 'react';

interface SupportIconProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SupportIcon({
  size = 48,
  color = '#6366F1',
  secondaryColor = '#4E8D9C',
  className,
  style,
}: SupportIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <linearGradient id="headsetGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f4ff" />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={color} floodOpacity="0.35" />
        </filter>
        <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle cx="32" cy="32" r="30" fill="none" stroke={color} strokeWidth="1.5" opacity="0.12" />

      {/* Main circle background */}
      <circle cx="32" cy="32" r="27" fill="url(#bgGrad)" filter="url(#dropShadow)" />

      {/* Subtle inner ring */}
      <circle cx="32" cy="32" r="24" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.2" />

      {/* Headset arc - top */}
      <path
        d="M22 30 C22 21 26.5 17 32 17 C37.5 17 42 21 42 30"
        fill="none"
        stroke="url(#headsetGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#softGlow)"
      />

      {/* Left ear cup */}
      <rect x="16" y="27" width="8" height="11" rx="4" fill="url(#headsetGrad)" />
      <rect x="18" y="29" width="4.5" height="7" rx="2.25" fill={color} opacity="0.45" />

      {/* Right ear cup */}
      <rect x="40" y="27" width="8" height="11" rx="4" fill="url(#headsetGrad)" />
      <rect x="41.5" y="29" width="4.5" height="7" rx="2.25" fill={color} opacity="0.45" />

      {/* Microphone boom */}
      <path
        d="M27 34 C27 37.5 29 40 34 40"
        fill="none"
        stroke="url(#headsetGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="34" cy="40" r="2.5" fill="url(#headsetGrad)" />

      {/* Support dots below headset */}
      <circle cx="32" cy="47" r="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="26" cy="50" r="1.8" fill="#ffffff" opacity="0.5" />
      <circle cx="38" cy="50" r="1.8" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
