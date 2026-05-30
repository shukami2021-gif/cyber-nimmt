/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, SkillType, Skill } from '../types';
import { audio } from '../utils/audio';

interface SpecialSkillSelectorProps {
  player: Player;
  onSelectSkill: (skillId: SkillType | null) => void;
  onSetOffset: (offset: number) => void;
  offsetValue: number;
}

export const SKILL_LIST: Skill[] = [
  {
    id: 'VALUE_OFFSET',
    name: 'Value Offset',
    jpName: '数値リライター (EP -2)',
    description: '自分のカードの強さを ±5 の範囲で一時的に書き換える。安全な行に差し込むための極秘ハック。',
    cost: 2,
  },
  {
    id: 'ROW_PIRATE',
    name: 'Row Pirate',
    jpName: 'ハッカー・ロウ (EP -3)',
    description: '配置ルールを無視して、自分のカードを任意の列（現在5枚未満の列）に直接強行配置する。',
    cost: 3,
  },
  {
    id: 'BULL_TRAP',
    name: 'Bull Trap',
    jpName: 'トリプル・トラップ (EP -3)',
    description: '指定した列の先頭に「倍増トラップ」を仕掛ける。次にその列を引き取った対戦相手はペナルティ2倍！',
    cost: 3,
  },
  {
    id: 'EMP_SHIELD',
    name: 'EMP Shield',
    jpName: 'EMPバリア (EP -4)',
    description: 'このターン、万が一列を引き取ることになった場合、ペナルティポイントを100%遮断（0点）する。',
    cost: 4,
  },
  {
    id: 'NEXUS_LINK',
    name: 'Nexus Link',
    jpName: 'ネクサス・リンク (EP -4)',
    description: 'このターン引き取ったペナルティポイントの50%を、現在トップのプレイヤーに強制逆転転嫁する。',
    cost: 4,
  },
];

export const SpecialSkillSelector: React.FC<SpecialSkillSelectorProps> = ({
  player,
  onSelectSkill,
  onSetOffset,
  offsetValue,
}) => {
  const handleToggleSkill = (skillId: SkillType) => {
    const selectedSkill = SKILL_LIST.find((s) => s.id === skillId);
    if (!selectedSkill) return;

    if (player.activeSkill === skillId) {
      // Toggle off
      onSelectSkill(null);
      audio.playCardSelect();
    } else {
      // Try to turn on
      if (player.energy >= selectedSkill.cost) {
        onSelectSkill(skillId);
        audio.playHackActivated();
      }
    }
  };

  return (
    <div
      id="skill-selector-panel"
      className="bg-zinc-950/40 border border-zinc-800/70 rounded-2xl p-4 md:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-lg relative overflow-hidden"
    >
      {/* Visual cyber mesh background */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-fuchsia-950/5 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 border-b border-zinc-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-fuchsia-500 tracking-wider flex items-center gap-2 font-serif uppercase">
            <span className="inline-block w-2 h-2 bg-fuchsia-500 rounded-sm animate-pulse" />
            HACK TERMINAL // 拡張マトリクス・プログラム
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-sans">
            毎ラウンド開始時に +1 EP チャージ。カードのロード提出前にスキルを予約起動できます。
          </p>
        </div>

        {/* EP (Energy Points) Meter */}
        <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest font-mono">POWER CHARGE:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-4 transform skew-x-12 transition-all duration-300 rounded-sm ${
                  idx < player.energy
                    ? 'bg-gradient-to-t from-fuchsia-600 to-fuchsia-300 shadow-[0_0_10px_rgba(236,72,153,0.55)]'
                    : 'bg-zinc-850 border border-zinc-800'
                }`}
              />
            ))}
            <span className="text-fuchsia-500 font-bold text-sm ml-1.5 font-mono">{player.energy} EP</span>
          </div>
        </div>
      </div>

      {/* Skills catalog grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {SKILL_LIST.map((skill) => {
          const isSelected = player.activeSkill === skill.id;
          const meetsCost = player.energy >= skill.cost;
          const btnDisabled = !isSelected && !meetsCost;

          return (
            <div
              key={skill.id}
              className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                isSelected
                  ? 'bg-fuchsia-950/20 border-fuchsia-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                  : meetsCost
                  ? 'bg-zinc-900/45 border-zinc-805 hover:border-zinc-705 hover:bg-zinc-900'
                  : 'bg-zinc-950/30 border-zinc-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${isSelected ? 'text-fuchsia-400' : 'text-zinc-500'}`}>
                    {skill.name}
                  </span>
                  
                  {/* Energy cost pill */}
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-black ${
                    isSelected 
                      ? 'bg-fuchsia-500 text-black' 
                      : meetsCost 
                      ? 'bg-zinc-800 text-fuchsia-500' 
                      : 'bg-zinc-950 text-zinc-600'
                  }`}>
                    {skill.cost} EP
                  </span>
                </div>

                <h4 className={`text-xs font-bold ${isSelected ? 'text-fuchsia-400' : 'text-zinc-200'} mb-1.5 font-display`}>
                  {skill.jpName}
                </h4>
                
                <p className="text-[10px] text-zinc-400 leading-normal mb-3 font-sans">
                  {skill.description}
                </p>
              </div>

              {/* Sub-controller panel for VALUE_OFFSET configuration */}
              {skill.id === 'VALUE_OFFSET' && isSelected && (
                <div className="bg-zinc-950/60 border border-fuchsia-500/20 rounded-lg p-2 mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[8.5px] text-fuchsia-500/90 font-mono font-bold">REWRITE RANGE:</span>
                    <span className={`text-xs font-black font-mono ${offsetValue === 0 ? 'text-zinc-400' : offsetValue > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {offsetValue > 0 ? `+${offsetValue}` : offsetValue}
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <button
                      onClick={() => onSetOffset(Math.max(-5, offsetValue - 1))}
                      disabled={offsetValue === -5}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 disabled:opacity-30 p-1 text-[10px] font-black rounded border border-zinc-800 transition-colors cursor-pointer text-zinc-300"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => onSetOffset(0)}
                      disabled={offsetValue === 0}
                      className="bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 disabled:opacity-30 px-2 py-1 text-[9px] rounded border border-zinc-800 font-bold transition-colors cursor-pointer text-zinc-400"
                    >
                      RESET
                    </button>
                    <button
                      onClick={() => onSetOffset(Math.min(5, offsetValue + 1))}
                      disabled={offsetValue === 5}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 disabled:opacity-30 p-1 text-[10px] font-black rounded border border-zinc-800 transition-colors cursor-pointer text-zinc-300"
                    >
                      +1
                    </button>
                  </div>
                </div>
              )}

              {/* Install / Activate Trigger button */}
              <button
                onClick={() => handleToggleSkill(skill.id)}
                disabled={btnDisabled}
                className={`w-full py-1 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-black shadow-[0_0_12px_rgba(236,72,153,0.45)]'
                    : meetsCost
                    ? 'bg-zinc-800 hover:bg-fuchsia-655 hover:text-fuchsia-100 text-zinc-300 border border-zinc-700/60'
                    : 'bg-zinc-950 text-zinc-600 border border-zinc-900 cursor-not-allowed'
                }`}
              >
                {isSelected ? 'LOADED // UNLOAD' : 'LOAD TO MEMORY'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
