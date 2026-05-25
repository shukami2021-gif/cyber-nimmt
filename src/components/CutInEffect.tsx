/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { audio } from '../utils/audio';
import { CyberBullArt } from './CyberBullArt';

interface CutInEffectProps {
  active: boolean;
  triggerPlayerName: string;
  targetPlayerName: string;
  penaltyPoints: number;
  skillUsed: string | null;
  onComplete: () => void;
}

export const CutInEffect: React.FC<CutInEffectProps> = ({
  active,
  triggerPlayerName,
  targetPlayerName,
  penaltyPoints,
  skillUsed,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'gate' | 'warning' | 'blast' | 'fadeout'>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    // Trigger sequential cinematic phases
    setPhase('gate');
    audio.playWarningSiren();

    const t1 = setTimeout(() => {
      setPhase('warning');
    }, 400);

    const t2 = setTimeout(() => {
      setPhase('blast');
      audio.playExplosion();
    }, 1100);

    const t3 = setTimeout(() => {
      setPhase('fadeout');
    }, 2800);

    const t4 = setTimeout(() => {
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active, onComplete]);

  if (!active) return null;

  // Render randomized particles for the explosion phase
  const particles = Array.from({ length: 40 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const duration = 0.5 + Math.random() * 1.5;
    const colors = ['bg-rose-500', 'bg-cyan-400', 'bg-fuchsia-500', 'bg-purple-500', 'bg-yellow-400'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: i,
      dx,
      dy,
      duration,
      color: randomColor,
      size: Math.random() * 8 + 4,
    };
  });

  return (
    <div
      id="cut-in-container"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden font-mono"
    >
      {/* Dark Ambient Backdrop Blur */}
      <div
        className={`absolute inset-0 bg-black/90 transition-opacity duration-500 ${
          phase === 'idle' ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Futuristic Background Scanning Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_8px,6px_100%] opacity-60 pointer-events-none" />

      {/* Cyber Technical Grid Border */}
      <div className="absolute inset-10 border border-cyan-500/10 pointer-events-none flex flex-col justify-between p-4">
        <div className="flex justify-between text-[10px] text-cyan-400/40 select-none">
          <span>SECURE_LINK // ID: {Math.random().toString(36).substring(4, 10).toUpperCase()}</span>
          <span>NIMT_CRITICAL_HAZARD</span>
        </div>
        <div className="flex justify-between text-[10px] text-fuchsia-400/40 select-none">
          <span>SYSTEM_STATE_REWRITE_PENDING</span>
          <span>LATENCY: 1.02ms</span>
        </div>
      </div>

      {/* Left Tech Gate Block */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1/2 bg-zinc-950 border-r-2 border-cyan-500/40 flex items-center justify-end pr-10 transition-transform duration-500 ease-out z-10 ${
          phase === 'gate' || phase === 'warning' || phase === 'blast'
            ? 'translate-x-0'
            : phase === 'fadeout'
            ? '-translate-x-full'
            : '-translate-x-full'
        }`}
      >
        <span className="text-[200px] font-black text-zinc-900/40 select-none leading-none">NIM</span>
      </div>

      {/* Right Tech Gate Block */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1/2 bg-zinc-950 border-l-2 border-cyan-500/40 flex items-center justify-start pl-10 transition-transform duration-500 ease-out z-10 ${
          phase === 'gate' || phase === 'warning' || phase === 'blast'
            ? 'translate-x-0'
            : phase === 'fadeout'
            ? 'translate-x-full'
            : 'translate-x-full'
        }`}
      >
        <span className="text-[200px] font-black text-zinc-900/40 select-none leading-none">TO</span>
      </div>

      {/* Warning Chevron Band Across the screen */}
      <div
        className={`absolute inset-x-0 h-44 bg-gradient-to-r from-red-600 via-fuchsia-700 to-red-600 border-y-4 border-yellow-400 shadow-[0_0_30px_rgba(239,68,68,0.5)] flex flex-col justify-center transform -skew-y-3 transition-all duration-500 z-20 ${
          phase === 'warning' || phase === 'blast'
            ? 'scale-100 opacity-100'
            : 'scale-0 opacity-0'
        }`}
      >
        {/* Repeating Hazard diagonal stripes stripe background */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25),rgba(0,0,0,0.25)_20px,rgba(255,255,255,0.1)_20px,rgba(255,255,255,0.1)_40px)]" />

        <div className="relative z-30 flex flex-col items-center text-center">
          <span className="text-xl md:text-2xl font-black text-yellow-300 tracking-[0.25em] animate-pulse">
            ⚠️ WARNING // COGNITIVE HAZARD ⚠️
          </span>
          <span className="text-xs md:text-sm text-white/95 mt-1 tracking-widest font-bold">
            HIGH-DENSITY BULL STAMPEDE DETECTED
          </span>
        </div>
      </div>

      {/* Main Core Explosion Blast UI */}
      {phase === 'blast' && (
        <div className="relative z-30 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 px-6 max-w-5xl w-full">
          {/* Animated Exploding Particle System Behind */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {particles.map((p) => (
              <div
                key={p.id}
                className={`absolute rounded-full ${p.color} animate-ping`}
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  transform: `translate(${p.dx}px, ${p.dy}px)`,
                  transition: `all ${p.duration}s cubic-bezier(0.1, 0.8, 0.3, 1)`,
                  opacity: 0,
                }}
              />
            ))}
          </div>

          {/* Left Block: Cybermatic Bull graphic display */}
          <div className="w-56 h-56 flex-shrink-0 animate-[ping_1.5s_infinite_ease-in-out] relative">
            {/* Double overlay shadow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-xl blur opacity-30 animate-pulse" />
            <CyberBullArt className="w-full h-full border-4 border-fuchsia-500 shadow-[0_0_40px_rgba(219,39,119,0.7)]" glow={true} />
          </div>

          {/* Right Block: Stats and technical info */}
          <div className="flex flex-col text-left space-y-4 max-w-md bg-zinc-950/90 border border-rose-500/40 p-6 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.15)] backdrop-blur relative">
            {/* Top red warning light */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[9px] text-rose-400 font-bold">HACK_CRASH_ACTIVE</span>
            </div>

            <div>
              <span className="text-xs text-rose-400/70 font-semibold tracking-wider">INITIATOR</span>
              <h2 className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] uppercase">
                {triggerPlayerName}
              </h2>
            </div>

            {skillUsed && (
              <div className="inline-block bg-fuchsia-950/80 border border-fuchsia-500/50 rounded-md px-2 py-1 max-w-max">
                <span className="text-[10px] text-fuchsia-300 font-extrabold tracking-widest">
                  SKILL: {skillUsed} ACTIVATED
                </span>
              </div>
            )}

            <div className="border-t border-zinc-800 my-2" />

            <div>
              <span className="text-xs text-zinc-400/80 tracking-wider">TARGET HIT // REWRITING STATE</span>
              <h3 className="text-xl font-extrabold text-white uppercase mt-0.5">
                {targetPlayerName}
              </h3>
            </div>

            <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs text-red-300/90 font-bold uppercase tracking-wider">DAMAGE APPLIED:</span>
              <span className="text-4xl font-extrabold text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-bounce font-mono">
                -{penaltyPoints} <span className="text-xs text-rose-400/80">PTS</span>
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              "You played right into my cyber bull matrix. The 6th card anomaly has collapsed the memory buffer."
            </p>
          </div>
        </div>
      )}

      {/* Screen Glitch Overlay Flashes */}
      {phase === 'blast' && (
        <div className="absolute inset-0 bg-fuchsia-500/10 mix-blend-overlay pointer-events-none animate-[pulse_0.1s_infinite_alternate]" />
      )}
    </div>
  );
};
