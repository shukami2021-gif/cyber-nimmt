/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../types';
import { audio } from '../utils/audio';

interface GameCardProps {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isRevealed?: boolean;
  highlightDelay?: number;
  offsetIndicator?: number; // Show skill modification (+3 , -2 etc)
}

export const GameCard: React.FC<GameCardProps> = ({
  card,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
  isRevealed = true,
  offsetIndicator = 0,
}) => {
  const { value, penalty } = card;

  // Sound triggering on select
  const handleActivation = () => {
    if (disabled) return;
    audio.playCardSelect();
    if (onClick) onClick();
  };

  // Determine hazard color scheme based on cow/bull head penalty count
  let colorTheme = {
    border: 'border-zinc-805/80 shadow-[0_4px_16px_rgba(0,0,0,0.55)]',
    bg: 'bg-gradient-to-b from-zinc-900 to-zinc-950 backdrop-blur-md',
    text: 'text-zinc-200 group-hover:text-fuchsia-200 font-display font-semibold',
    glow: 'group-hover:border-zinc-700 shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
    tagBg: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50',
    badgeGlow: 'shadow-[0_0_6px_rgba(255,255,255,0.15)]',
  };

  if (penalty === 2) {
    // 2 bull heads
    colorTheme = {
      border: 'border-fuchsia-900/40 shadow-[0_4px_18px_rgba(0,0,0,0.6)]',
      bg: 'bg-gradient-to-b from-[#1c1a16] to-zinc-950',
      text: 'text-fuchsia-500 font-serif font-bold',
      glow: 'group-hover:border-fuchsia-700 shadow-[0_0_12px_rgba(219,39,119,0.15)]',
      tagBg: 'bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-900/45',
      badgeGlow: 'shadow-[0_0_8px_rgba(236,72,153,0.4)]',
    };
  } else if (penalty === 3) {
    // 3 bull heads
    colorTheme = {
      border: 'border-emerald-950/60 shadow-[0_4px_20px_rgba(0,0,0,0.65)]',
      bg: 'bg-gradient-to-b from-[#0e1f18] to-zinc-950',
      text: 'text-emerald-400 font-serif font-bold',
      glow: 'group-hover:border-emerald-700 shadow-[0_0_14px_rgba(16,185,129,0.15)]',
      tagBg: 'bg-emerald-950/85 text-emerald-300 border border-emerald-900/40',
      badgeGlow: 'shadow-[0_0_10px_#10b981]',
    };
  } else if (penalty === 5) {
    // 5 bull heads (Row breakers!)
    colorTheme = {
      border: 'border-purple-900/50 shadow-[0_4px_22px_rgba(0,0,0,0.7)]',
      bg: 'bg-gradient-to-b from-[#1c1229] to-[#08050e]',
      text: 'text-purple-300 font-serif font-extrabold',
      glow: 'group-hover:border-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      tagBg: 'bg-purple-950/90 text-purple-200 border border-purple-800/40 animate-pulse',
      badgeGlow: 'shadow-[0_0_12px_#a855f7]',
    };
  } else if (penalty >= 7) {
    // 7 bull heads (NIMT CRITICAL!)
    colorTheme = {
      border: 'border-rose-950 shadow-[0_4px_25px_rgba(239,68,68,0.35)]',
      bg: 'bg-gradient-to-b from-[#290c12] to-[#040103]',
      text: 'text-rose-500 font-serif font-black tracking-widest',
      glow: 'group-hover:border-rose-700 shadow-[0_0_25px_rgba(244,63,94,0.3)]',
      tagBg: 'bg-rose-950 text-rose-300 border border-rose-900/50',
      badgeGlow: 'shadow-[0_0_15px_#f43f5e]',
    };
  }

  // Size configurations
  const dimensions = {
    sm: 'w-16 h-24 text-base rounded-lg',
    md: 'w-24 h-36 text-2xl rounded-xl',
    lg: 'w-32 h-48 text-4xl rounded-2xl',
  }[size];

  // Draw bull/cow heads glow indicators
  const renderBulls = () => {
    return (
      <div className="flex flex-wrap justify-center gap-0.5 max-w-full px-1">
        {Array.from({ length: penalty }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              penalty >= 5
                ? 'bg-rose-500'
                : penalty === 3
                ? 'bg-emerald-400'
                : penalty === 2
                ? 'bg-fuchsia-500'
                : 'bg-zinc-400'
            } ${colorTheme.badgeGlow}`}
            title={`${penalty} Hazard Level`}
          />
        ))}
      </div>
    );
  };

  if (!isRevealed) {
    // Cyber hidden card back design showing a gorgeous cow outline and locked tech glyph
    return (
      <div
        id={`card-hidden-${value}`}
        className={`relative ${dimensions} flex flex-col items-center justify-center cursor-not-allowed select-none bg-gradient-to-br from-[#121316] via-[#1a1b20] to-[#0d0e11] border border-fuchsia-600/20 shadow-[0_8px_24px_rgba(0,0,0,0.85)] ${
          selected ? 'ring-2 ring-fuchsia-500 scale-105 border-fuchsia-400' : ''
        }`}
      >
        {/* Subtle grid mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] opacity-10" />
        
        {/* Cow watermark pattern */}
        <svg viewBox="0 0 100 100" className="w-12 h-12 text-fuchsia-500/15 absolute pointer-events-none">
          <path d="M 30 20 Q 5 10 10 -15 Q 25 10 35 25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M 70 20 Q 95 10 90 -15 Q 75 10 65 25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="50 15, 75 55, 65 85, 35 85, 25 55" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,2" />
          <ellipse cx="50" cy="85" rx="10" ry="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>

        <span className="text-[10px] text-fuchsia-600/40 tracking-[0.2em] font-serif select-none">REWRITER</span>
        <div className="w-6 h-0.5 bg-fuchsia-500/30 rounded mt-1" />
      </div>
    );
  }

  return (
    <button
      id={`card-visible-${value}`}
      disabled={disabled}
      onClick={handleActivation}
      className={`group relative ${dimensions} flex flex-col justify-between p-2 select-none font-sans transition-all duration-300 transform outline-none text-left ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-2'
      } ${
        selected
          ? 'ring-4 ring-fuchsia-500 scale-105 z-10 border-fuchsia-400 shadow-[0_0_25px_rgba(236,72,153,0.5)] bg-[#1c1917]'
          : `border border-zinc-800/80 ${colorTheme.bg} ${colorTheme.glow}`
      }`}
    >
      {/* Background Cyber Cow holographic design embedded directly into the card body */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-zinc-500/5 group-hover:text-fuchsia-500/10 transition-colors duration-500 pointer-events-none"
      >
        {/* Detailed cyber Cow Horns engraving */}
        <path d="M 30 35 Q 5 15 10 -10 Q 25 20 38 35" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M 70 35 Q 95 15 90 -10 Q 75 20 62 35" fill="none" stroke="currentColor" strokeWidth="2" />
        {/* Head contours */}
        <polygon points="50 30, 72 58, 62 82, 38 82, 28 58" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="50" cy="82" rx="10" ry="5" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Extra geometric bull engravings to make it very cool */}
        <line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="15" y1="58" x2="38" y2="58" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
        <line x1="85" y1="58" x2="62" y2="58" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
        <polygon points="50 34, 58 48, 42 48" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none rounded-xl" />

      {/* Top row: Cow Bull Heads & Modifier Skill Indicators */}
      <div className="flex items-center justify-between w-full z-10">
        {/* Danger rating tag */}
        <span className={`text-[9px] px-1.5 py-0.5 rounded leading-none font-mono font-semibold uppercase ${colorTheme.tagBg}`}>
          ✖-{penalty}
        </span>
        
        {/* Skill modification popover (+3 offset or reverse indicators) */}
        {offsetIndicator !== 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold leading-none animate-bounce ${
            offsetIndicator > 0 ? 'bg-fuchsia-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {offsetIndicator > 0 ? `+${offsetIndicator}` : offsetIndicator}
          </span>
        )}
      </div>

      {/* Center Row: Game Card Major Number */}
      <div className="flex flex-col items-center justify-center my-auto w-full z-10 text-center select-none">
        <span className={`text-3xl md:text-4xl tracking-tight font-serif ${colorTheme.text} transition-colors duration-300 relative`}>
          {value}
          
          {/* Small offset display helper */}
          {offsetIndicator !== 0 && (
            <span className="absolute -top-3 -right-5 text-[8px] text-zinc-500 font-mono">
              ({value + offsetIndicator})
            </span>
          )}
        </span>
      </div>

      {/* Bottom Row: Cow/Bull Heads Array Visual */}
      <div className="w-full flex justify-center pb-0.5 z-10">
        {renderBulls()}
      </div>

      {/* Bottom corner technical detail watermark */}
      <span className="absolute bottom-1.5 right-2 text-[8px] text-zinc-600/35 group-hover:text-fuchsia-500/50 transition-colors duration-300 select-none font-mono">
        BULL.{value}
      </span>
    </button>
  );
};

