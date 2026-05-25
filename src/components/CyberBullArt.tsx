/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface CyberBullArtProps {
  className?: string;
  glow?: boolean;
}

export const CyberBullArt: React.FC<CyberBullArtProps> = ({ className = "w-full h-full", glow = true }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = "/src/assets/images/cyber_bull_art_1779462912207.png";

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-zinc-950/40 border border-cyan-500/20 ${glow ? 'shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] transition-all duration-500' : ''} ${className}`}>
      {/* Background Matrix/Grid Line Art */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-40 pointer-events-none" />

      {!imageError ? (
        <img
          key="generated-bull-image"
          id="cyber-bull-image"
          src={imageUrl}
          alt="Cybernetic Bull Avatar"
          className="w-full h-full object-cover select-none pointer-events-none rounded-xl"
          referrerPolicy="no-referrer"
          onError={() => {
            console.warn("AI generated image failed to load, falling back to procedural glowing vector art.");
            setImageError(true);
          }}
        />
      ) : (
        /* Majestic vector asset rendering backup if path is ever missing */
        <svg
          key="fallback-bull-svg"
          id="fallback-bull-svg"
          viewBox="0 0 200 200"
          className="w-4/5 h-4/5 text-cyan-400 select-none pointer-events-none"
        >
          <defs>
            <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Cyber Bull Head Vector */}
          <g filter="url(#neonGlow)" stroke="url(#cyberGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Left Horn */}
            <path d="M 60 70 Q 20 40 30 10 Q 55 40 75 60" />
            {/* Right Horn */}
            <path d="M 140 70 Q 180 40 170 10 Q 145 40 125 60" />
            
            {/* Outer Head Armor Plates */}
            <polygon points="100 40, 130 65, 140 100, 120 145, 100 175, 80 145, 60 100, 70 65" />
            
            {/* Forehead Cyber Sensor Matrix */}
            <polygon points="100 65, 115 85, 100 105, 85 85" className="fill-fuchsia-500/20" />
            
            {/* Eyes (Glowing cyan bars) */}
            <line x1="75" y1="95" x2="90" y2="100" stroke="#00ffff" strokeWidth="4" />
            <line x1="125" y1="95" x2="110" y2="100" stroke="#00ffff" strokeWidth="4" />
            
            {/* Nose Cover Plate */}
            <path d="M 90 125 H 110 L 115 145 H 85 Z" />
            
            {/* Bull Nose Ring */}
            <path d="M 90 150 A 15 15 0 0 0 110 150" stroke="#f43f5e" strokeWidth="3" />
            
            {/* Futuristic Tech Grid Overlay Accents */}
            <line x1="100" y1="10" x2="100" y2="35" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="40" y1="110" x2="20" y2="120" />
            <line x1="160" y1="110" x2="180" y2="120" />
          </g>

          {/* Ambient grid background detail */}
          <circle cx="100" cy="100" r="85" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="5,10" className="opacity-30" />
        </svg>
      )}

      {/* Futuristic Scanner Scanline beam */}
      <div className="absolute left-0 w-full h-[2px] bg-cyan-500/50 shadow-[0_0_8px_#06b6d4] animate-[bounce_3s_infinite_ease-in-out] pointer-events-none opacity-60" />
    </div>
  );
};
