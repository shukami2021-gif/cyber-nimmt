/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, Player, GameRow, GameState, SkillType, PlayAction, TurnReport } from './types';
import { audio } from './utils/audio';
import { CyberBullArt } from './components/CyberBullArt';
import { GameCard } from './components/GameCard';
import { CutInEffect } from './components/CutInEffect';
import { SpecialSkillSelector, SKILL_LIST } from './components/SpecialSkillSelector';
import { Play, RotateCcw, Volume2, VolumeX, Swords, GraduationCap, Flame, HelpCircle } from 'lucide-react';

// Help functions to initialize deck
function getCardPenalty(value: number): number {
  if (value === 55) return 7;
  if (value % 11 === 0) return 5;
  if (value % 10 === 0) return 3;
  if (value % 10 === 5) return 2;
  return 1;
}

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (let i = 1; i <= 104; i++) {
    d.push({ value: i, penalty: getCardPenalty(i) });
  }
  return d;
}

function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [isPlayingSound, setIsPlayingSound] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    round: 1,
    gameEnded: false,
    currentPhase: 'SETUP',
    rows: [],
    players: [],
    deck: [],
    activePlacingIndex: -1,
    placingQueue: [],
    pendingRowPlayerId: null,
    logs: [],
    cutInInfo: null,
  });

  // Active selected card in Human hand during planning phase
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);

  // Skill states for the human player
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [skillOffsetValue, setSkillOffsetValue] = useState<number>(0);

  // Start a new game
  const handleStartGame = (userArchetypeId: SkillType = 'VALUE_OFFSET') => {
    audio.playGameStart();
    const cleanDeck = buildDeck();
    const shuffled = shuffleDeck(cleanDeck);

    // Initial game rows
    const initialRows: GameRow[] = [
      { id: 1, cards: [shuffled.pop()!], hasTrap: false },
      { id: 2, cards: [shuffled.pop()!], hasTrap: false },
      { id: 3, cards: [shuffled.pop()!], hasTrap: false },
      { id: 4, cards: [shuffled.pop()!], hasTrap: false },
    ];

    // Define archetypes matching skills
    const selectArchetype = (type: SkillType) => {
      return SKILL_LIST.find((s) => s.id === type) || SKILL_LIST[0];
    };

    // Build 4 players
    const humanPlayer: Player = {
      id: 'player',
      name: 'ハッカー候補生 (あなた)',
      isHuman: true,
      hand: [],
      score: 66, // Standard Nimmt HP Survival points
      penaltyPoints: 0,
      energy: 3, // Start with 3 EP to try features out immediately
      activeSkill: null,
      selectedCard: null,
      avatarColor: 'from-cyan-500 to-blue-600 shadow-[0_0_12px_#06b6d4]',
      archetype: selectArchetype(userArchetypeId),
    };

    const cpus: Player[] = [
      {
        id: 'cpu_cobalt',
        name: 'AI_01_COBALT',
        isHuman: false,
        hand: [],
        score: 66,
        penaltyPoints: 0,
        energy: 2,
        activeSkill: null,
        selectedCard: null,
        avatarColor: 'from-sky-500 to-indigo-600 shadow-[0_0_10px_#0369a1]',
        archetype: selectArchetype('VALUE_OFFSET'),
      },
      {
        id: 'cpu_crimson',
        name: 'AI_02_CRIMSON',
        isHuman: false,
        hand: [],
        score: 66,
        penaltyPoints: 0,
        energy: 2,
        activeSkill: null,
        selectedCard: null,
        avatarColor: 'from-rose-500 to-pink-700 shadow-[0_0_10px_#b91c1c]',
        archetype: selectArchetype('NEXUS_LINK'),
      },
      {
        id: 'cpu_emerald',
        name: 'AI_03_EMERALD',
        isHuman: false,
        hand: [],
        score: 66,
        penaltyPoints: 0,
        energy: 2,
        activeSkill: null,
        selectedCard: null,
        avatarColor: 'from-emerald-500 to-teal-700 shadow-[0_0_10px_#047857]',
        archetype: selectArchetype('BULL_TRAP'),
      },
    ];

    // Deal 10 cards to each player
    const allPlayers = [humanPlayer, ...cpus];
    for (let roundIdx = 0; roundIdx < 10; roundIdx++) {
      allPlayers.forEach((p) => {
        p.hand.push(shuffled.pop()!);
      });
    }

    // Sort hand cards in ascending order for comfortable viewing
    allPlayers.forEach((p) => {
      p.hand.sort((a, b) => a.value - b.value);
    });

    setGameState({
      round: 1,
      gameEnded: false,
      currentPhase: 'PLAY_CARD',
      rows: initialRows,
      players: allPlayers,
      deck: shuffled,
      activePlacingIndex: -1,
      placingQueue: [],
      pendingRowPlayerId: null,
      logs: [
        'SYSTEM_BOOT: サイバー・ニムト：ネクサス・ドライブが起動しました。',
        'ディーラー: 全プレイヤーに10枚のデュアルカードを支給しました。ハックアビリティを確認してください。',
      ],
      cutInInfo: null,
    });

    setSelectedHandCard(null);
    setSelectedSkill(null);
    setSkillOffsetValue(0);
  };

  const handleToggleSound = () => {
    const isMuted = audio.toggleMute();
    setIsPlayingSound(!isMuted);
  };

  // Human commits their selected card (Planning phase done)
  const handleCommitCard = () => {
    if (!selectedHandCard) return;

    // Construct human action
    let finalCard = { ...selectedHandCard };
    let modifier = 0;

    const updatedPlayers = gameState.players.map((p) => {
      if (p.isHuman) {
        let skillsCost = 0;
        if (selectedSkill) {
          const matchedSkill = SKILL_LIST.find((s) => s.id === selectedSkill);
          skillsCost = matchedSkill ? matchedSkill.cost : 0;
        }

        // Apply visual offset
        if (selectedSkill === 'VALUE_OFFSET') {
          modifier = skillOffsetValue;
          finalCard.value = Math.max(1, Math.min(104, finalCard.value + modifier));
        }

        return {
          ...p,
          selectedCard: finalCard,
          activeSkill: selectedSkill,
          offsetValue: modifier,
          energy: Math.max(0, p.energy - skillsCost),
          hand: p.hand.filter((c) => c.value !== selectedHandCard.value),
        };
      }
      return p;
    });

    // CPU decides card selection + smart skill triggers!
    const updatedPlayersWithCpu = updatedPlayers.map((p) => {
      if (!p.isHuman) {
        // High quality CPU evaluation
        // Analyze target rows to play safely
        const rowEnds = gameState.rows.map((r) => r.cards[r.cards.length - 1].value);
        let bestCard: Card = p.hand[0];
        let bestDistance = 999;
        let bestRowIdx = -1;

        // Try to place card slightly higher than row ends
        p.hand.forEach((card) => {
          rowEnds.forEach((end, rIdx) => {
            const distance = card.value - end;
            if (distance > 0 && distance < bestDistance) {
              bestDistance = distance;
              bestCard = card;
              bestRowIdx = rIdx;
            }
          });
        });

        // If no safe higher cards, play the smallest card to try and pick cleanest row
        if (bestRowIdx === -1) {
          // Play the lowest card
          bestCard = p.hand[0];
        }

        // CPU Smart Skills activator!
        let cpuActiveSkill: SkillType | null = null;
        let cpuOffset = 0;
        let targetCard = { ...bestCard };

        if (p.energy >= 3 && Math.random() > 0.4) {
          // Chance of activating custom archetype skills
          if (p.archetype.id === 'BULL_TRAP' && p.energy >= 3) {
            cpuActiveSkill = 'BULL_TRAP';
          } else if (p.archetype.id === 'NEXUS_LINK' && p.energy >= 4) {
            cpuActiveSkill = 'NEXUS_LINK';
          } else if (p.archetype.id === 'VALUE_OFFSET' && p.energy >= 2) {
            // Try to make it slide safely!
            // If best card misses all row ends by a thin gap, try to offset it!
            let offsetApplied = false;
            p.hand.forEach((card) => {
              rowEnds.forEach((end) => {
                const diff = end - card.value;
                if (diff > 0 && diff <= 5) {
                  // We can increase value to pass it!
                  cpuActiveSkill = 'VALUE_OFFSET';
                  cpuOffset = diff + 1; // Slide cleanly past
                  targetCard.value = Math.min(104, card.value + cpuOffset);
                  bestCard = card;
                  offsetApplied = true;
                }
              });
            });

            if (!offsetApplied) {
              cpuActiveSkill = null;
            }
          }
        }

        // Apply score deduction for skills
        let cpuCost = 0;
        if (cpuActiveSkill) {
          const matchedSk = SKILL_LIST.find((s) => s.id === cpuActiveSkill);
          cpuCost = matchedSk ? matchedSk.cost : 0;
        }

        return {
          ...p,
          selectedCard: targetCard,
          activeSkill: cpuActiveSkill,
          offsetValue: cpuOffset,
          energy: Math.max(0, p.energy - cpuCost),
          hand: p.hand.filter((c) => c.value !== bestCard.value),
        };
      }
      return p;
    });

    // Build immediate visual staging queue of all actions
    const currentActions: PlayAction[] = updatedPlayersWithCpu.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      card: p.selectedCard!,
      originalCard: selectedHandCard && p.isHuman ? selectedHandCard : p.selectedCard!, // tracking original for human visualization
      activeSkill: p.activeSkill,
      offsetUsed: p.offsetValue,
    }));

    // Sort queue based on revealed card values (ascending order)
    const sortedQueue = [...currentActions].sort((a, b) => a.card.value - b.card.value);

    // Transition state
    setGameState((prev) => {
      const newLogs = [...prev.logs];
      newLogs.push('-----------------------------');
      newLogs.push(`ROUND ${prev.round} : 全員のハックプログラムが公開されました。`);
      
      currentActions.forEach((act) => {
        if (act.activeSkill) {
          const skillObj = SKILL_LIST.find((s) => s.id === act.activeSkill);
          newLogs.push(`ハック: [${act.playerName}] がスキル『${skillObj?.jpName}』を展開しました！`);
        }
      });

      return {
        ...prev,
        players: updatedPlayersWithCpu,
        currentPhase: 'REVEALING',
        placingQueue: sortedQueue,
        activePlacingIndex: 0,
        logs: newLogs,
      };
    });
  };

  // Perform a single automated step of card placement in revealing order
  const handleNextPlacingStep = () => {
    const { activePlacingIndex, placingQueue, rows, players } = gameState;

    if (activePlacingIndex >= placingQueue.length) {
      // All cards are placed for this turn! Check if round ends
      handleEndTurn();
      return;
    }

    const nextAction = placingQueue[activePlacingIndex];
    if (!nextAction) return;

    const placingPlayer = players.find((p) => p.id === nextAction.playerId)!;
    const cardToPlace = nextAction.card;

    // Check if player activated Row Pirate skill: forced manual or automatic choice
    if (nextAction.activeSkill === 'ROW_PIRATE') {
      if (placingPlayer.isHuman) {
        // Human chooses row directly
        setGameState((prev) => ({
          ...prev,
          currentPhase: 'ROW_CHOICE',
          pendingRowPlayerId: placingPlayer.id,
          logs: [...prev.logs, `ハッカー・ロウ: [あなた] のカード ${cardToPlace.value} の強行配置先を指定してください。`],
        }));
        return;
      } else {
        // CPU just picks the row with the fewest cards currently
        let targetRowIndex = 0;
        let minCards = 999;
        rows.forEach((r, idx) => {
          if (r.cards.length < minCards) {
            minCards = r.cards.length;
            targetRowIndex = idx;
          }
        });

        placeCardInRow(targetRowIndex, nextAction);
        return;
      }
    }

    // Standard positioning rules:
    // Find rows where the end card value is < card to place
    const validRowsIndices: number[] = [];
    rows.forEach((r, idx) => {
      const endCard = r.cards[r.cards.length - 1];
      if (cardToPlace.value > endCard.value) {
        validRowsIndices.push(idx);
      }
    });

    if (validRowsIndices.length === 0) {
      // Card is smaller than all row-end cards! Player must pick which row to overwrite
      if (placingPlayer.isHuman) {
        // human choice
        setGameState((prev) => ({
          ...prev,
          currentPhase: 'ROW_CHOICE',
          pendingRowPlayerId: placingPlayer.id,
          logs: [...prev.logs, `バッファ・オーバーフロー: あなたのカード (${cardToPlace.value}) は全ての列の終端より小さいため、リセットする列を番号で選択してください。`],
        }));
      } else {
        // CPU automatically chooses row with the least cumulative penalty points
        let minPenaltyRowIndex = 0;
        let minPenaltySum = 999;

        rows.forEach((r, idx) => {
          const sum = r.cards.reduce((acc, c) => acc + c.penalty, 0);
          if (sum < minPenaltySum) {
            minPenaltySum = sum;
            minPenaltyRowIndex = idx;
          }
        });

        // Instantly clear and place
        placeCardInRow(minPenaltyRowIndex, nextAction);
      }
    } else {
      // Find row with minimum distance
      let targetRowIndex = -1;
      let minDistance = 999;

      validRowsIndices.forEach((idx) => {
        const r = rows[idx];
        const endCard = r.cards[r.cards.length - 1];
        const dist = cardToPlace.value - endCard.value;
        if (dist < minDistance) {
          minDistance = dist;
          targetRowIndex = idx;
        }
      });

      placeCardInRow(targetRowIndex, nextAction);
    }
  };

  // Place action in the selected row
  const placeCardInRow = (rowIndex: number, action: PlayAction) => {
    setGameState((prev) => {
      const updatedRows = prev.rows.map((r, idx) => {
        if (idx === rowIndex) {
          const isRowFull = r.cards.length >= 5;
          const isTooSmall = !action.card || (r.cards.length > 0 && action.card.value < r.cards[r.cards.length - 1].value);
          const isForcedPirate = action.activeSkill === 'ROW_PIRATE';

          // Initialize new placement list
          let newCards = [...r.cards];
          
          if (isRowFull) {
            // Takes previous 5 cards, placing card becomes the new primary starting block
            newCards = [action.card];
          } else if (isTooSmall && !isForcedPirate) {
            // Clears complete row and restarts
            newCards = [action.card];
          } else {
            // Standard slot added
            newCards.push(action.card);
          }

          return {
            ...r,
            cards: newCards,
            hasTrap: action.activeSkill === 'BULL_TRAP' ? true : r.hasTrap,
            trapPlacedBy: action.activeSkill === 'BULL_TRAP' ? action.playerId : r.trapPlacedBy,
          };
        }
        return r;
      });

      // Calculate state changes and penalizations
      const matchingRow = prev.rows[rowIndex];
      const is6thCard = matchingRow.cards.length >= 5;
      const isTooSmall = !is6thCard && matchingRow.cards.length > 0 && action.card.value < matchingRow.cards[matchingRow.cards.length - 1].value;
      
      let takingCards: Card[] = [];
      let shielded = action.activeSkill === 'EMP_SHIELD';
      let linkActive = action.activeSkill === 'NEXUS_LINK';

      if (is6thCard) {
        takingCards = [...matchingRow.cards];
      } else if (isTooSmall && action.activeSkill !== 'ROW_PIRATE') {
        takingCards = [...matchingRow.cards];
      }

      // Compute total absolute penalty points
      let penaltyBase = takingCards.reduce((sum, c) => sum + c.penalty, 0);
      
      // Check trap multipliers on this row
      let trapTriggered = false;
      if (penaltyBase > 0 && matchingRow.hasTrap) {
        trapTriggered = true;
        penaltyBase *= 2; // Doubled
        // Remove trap after activated
        updatedRows[rowIndex].hasTrap = false;
        updatedRows[rowIndex].trapPlacedBy = undefined;
      }

      // Check skill actions: EMP shield sets points to 0!
      let finalPenalty = shielded ? 0 : penaltyBase;
      let linkedToTargetId: string | undefined = undefined;
      let linkedToTargetName: string | undefined = undefined;
      let linkPointsShare = 0;

      // Handle Nexus Link skill redirection
      if (linkActive && finalPenalty > 0) {
        // Find current top competitor rank (fewest minus points, highest remaining health score)
        const competitors = prev.players.filter((p) => p.id !== action.playerId);
        competitors.sort((a, b) => b.score - a.score); // highest first
        const leadPlayer = competitors[0];

        if (leadPlayer) {
          linkedToTargetId = leadPlayer.id;
          linkedToTargetName = leadPlayer.name;
          linkPointsShare = Math.floor(finalPenalty / 2);
          finalPenalty = finalPenalty - linkPointsShare; // Hacker gets halved penalty
        }
      }

      // Apply points to gamers' scores (decrease survival score / HP counter)
      let currentTriggeredCutIn = prev.cutInInfo;
      const updatedPlayers = prev.players.map((p) => {
        let scoreToDeduct = 0;

        if (p.id === action.playerId) {
          scoreToDeduct = finalPenalty;
        } else if (linkedToTargetId && p.id === linkedToTargetId) {
          scoreToDeduct = linkPointsShare;
        }

        // Gather statistics
        const newScore = Math.max(0, p.score - scoreToDeduct);
        const addedPenalties = p.penaltyPoints + scoreToDeduct;

        // Custom cut-in activator:
        // Trigger spectacular cut-in overlay if:
        // 1. High damage (> 6 points) applied to a target competitor.
        // 2. Or human successfully redirected high score onto a target CPU.
        if (scoreToDeduct >= 6 && p.id !== 'player') {
          currentTriggeredCutIn = {
            active: true,
            triggerPlayerName: action.playerName,
            targetPlayerName: p.name,
            penaltyPoints: scoreToDeduct,
            skillUsed: action.activeSkill,
          };
        }

        return {
          ...p,
          score: newScore,
          penaltyPoints: addedPenalties,
          // Give minor +1 EP back whenever taking cards to support recovery! Override charge
          energy: p.id === action.playerId && scoreToDeduct > 0 ? Math.min(6, p.energy + 2) : p.energy,
        };
      });

      // Construct and insert log descriptions
      const newLogs = [...prev.logs];
      if (is6thCard) {
        newLogs.push(`列崩壊(Anomaly): [${action.playerName}] のカード (${action.card.value}) が6列目のスロットに進入！`);
        if (shielded) {
          newLogs.push(`盾発動: [${action.playerName}] が EMPシールドで ${penaltyBase} ペナルティを完全吸収！`);
        } else {
          newLogs.push(`ペナルティ: [${action.playerName}] が ${finalPenalty} 点の減算。`);
        }
      } else if (isTooSmall && action.activeSkill !== 'ROW_PIRATE') {
        newLogs.push(`バッファ消去: [${action.playerName}] カード (${action.card.value}) で列 ${rowIndex + 1} の履歴を強制リブート！`);
        if (shielded) {
          newLogs.push(`盾発動: [${action.playerName}] はEMP盾でノーダメージ！`);
        } else {
          newLogs.push(`ペナルティ: [${action.playerName}] に ${finalPenalty} 点の負荷。`);
        }
      } else {
        newLogs.push(`配置: [${action.playerName}] が列 ${rowIndex + 1} の終端に ${action.card.value} をロード。`);
      }

      if (trapTriggered) {
        newLogs.push(`⚠️トラップ発動⚠️: 指定列のトラップが爆破！受けるペナルティが2倍に増幅された！`);
      }

      if (linkedToTargetId && linkPointsShare > 0) {
        newLogs.push(`リンク接続: [${action.playerName}] がペナルティの半分 (${linkPointsShare}点) をネットワーク連結により [${linkedToTargetName}] に転嫁！`);
      }

      audio.playCardSelect();

      return {
        ...prev,
        rows: updatedRows,
        players: updatedPlayers,
        activePlacingIndex: prev.activePlacingIndex + 1,
        currentPhase: 'PLACING',
        logs: newLogs,
        cutInInfo: currentTriggeredCutIn,
      };
    });
  };

  // Dedicated manual prompt for Row choice (too small card, or Row Pirate active)
  const handleSelectRowReset = (rowIndex: number) => {
    const { activePlacingIndex, placingQueue } = gameState;
    const currentAction = placingQueue[activePlacingIndex];
    if (!currentAction) return;

    placeCardInRow(rowIndex, currentAction);
  };

  // Wrap up current turn placements and recharge players energy
  const handleEndTurn = () => {
    setGameState((prev) => {
      // Charges +1 EP each round for survival strategies up to 6 EP
      const chargedPlayers = prev.players.map((p) => {
        return {
          ...p,
          energy: Math.min(6, p.energy + 1),
          activeSkill: null,
          selectedCard: null,
        };
      });

      const nextRound = prev.round + 1;
      const isGameOver = nextRound > 10 || chargedPlayers.some((p) => p.score <= 0);

      const logsUpdate = [...prev.logs];
      if (isGameOver) {
        logsUpdate.push('=== MATCH COMPLETED ===');
        logsUpdate.push('ディーラー: ゲームが終了しました。メイングリッドの順位表を確認してください。');
      } else {
        logsUpdate.push(`ラウンド ${nextRound} 開始: 各プレイヤーの cyber matrix コアに +1 EP チャージしました。`);
      }

      return {
        ...prev,
        round: nextRound,
        players: chargedPlayers,
        currentPhase: isGameOver ? 'GAME_OVER' : 'PLAY_CARD',
        logs: logsUpdate,
      };
    });

    setSelectedHandCard(null);
    setSelectedSkill(null);
    setSkillOffsetValue(0);
  };

  // Helper restart option
  const handleResetGame = () => {
    setGameState({
      round: 1,
      gameEnded: false,
      currentPhase: 'SETUP',
      rows: [],
      players: [],
      deck: [],
      activePlacingIndex: -1,
      placingQueue: [],
      pendingRowPlayerId: null,
      logs: [],
      cutInInfo: null,
    });
  };

  // Quick automated cheat/demo buttons to test cut-in triggers
  const triggerDemoCutin = () => {
    setGameState((prev) => ({
      ...prev,
      cutInInfo: {
        active: true,
        triggerPlayerName: 'ハッカー候補生 (あなた)',
        targetPlayerName: 'AI_02_CRIMSON',
        penaltyPoints: 14,
        skillUsed: 'NEXUS_LINK',
      },
    }));
  };

  const humanPlayer = gameState.players.find((p) => p.isHuman);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-2 md:p-6 font-sans selection:bg-amber-500/20 selection:text-amber-200 transition-colors duration-500 relative">
      
      {/* Delicate background decorative grid and radiant gold core */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* Top Header Controls bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border-b border-zinc-800/80 pb-4 mb-6 gap-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* Logo element with spinning glowing icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-900 border border-amber-500/35 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-delicate-glow">
            <Swords className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-zinc-100 to-amber-500 font-serif uppercase leading-none">
              Nimmt Board Game
            </h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mt-1 font-mono">
              SOPHISTICATED DECK DUEL // LUXURY EDITION 2.6
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Help button */}
          <button
            onClick={() => setShowHowTo(!showHowTo)}
            id="how-to-btn"
            className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            ルール説明
          </button>

          {/* Sound trigger Toggle */}
          <button
            id="mute-toggle-btn"
            onClick={handleToggleSound}
            className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-zinc-300"
          >
            {isPlayingSound ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
            {isPlayingSound ? 'SOUND ON' : 'SOUND MUTED'}
          </button>

          {/* Setup screen direct restart button */}
          {gameState.currentPhase !== 'SETUP' && gameState.currentPhase !== 'CHAR_SELECT' && (
            <button
              id="restart-game-btn"
              onClick={handleResetGame}
              className="flex items-center gap-1 bg-rose-950/15 border border-rose-500/20 hover:bg-rose-900/40 hover:border-rose-500/50 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              システム再起動
            </button>
          )}
        </div>
      </header>

      {/* Main Play Area Container */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* Left Columns (8 grid slots): Field and Player stats */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Rule tutorial visual overlay popover */}
          {showHowTo && (
            <div id="how-to-tutorial-card" className="bg-gradient-to-br from-zinc-905 via-zinc-950 to-black border border-amber-500/35 rounded-2xl p-5 md:p-6 shadow-[0_12px_48px_rgba(0,0,0,0.85)] relative z-20">
              <button
                onClick={() => setShowHowTo(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
              <h2 className="text-base md:text-lg font-black text-amber-500 mb-3 flex items-center gap-2 font-serif uppercase tracking-wide">
                <GraduationCap className="w-5 h-5 text-amber-500" />
                サイバー・ニムトの基本ルールと革新システム
              </h2>
              <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed font-sans">
                <p>
                  このゲームはドイツの名作ボードゲーム「ニムト(6nimmt!)」をベースに、プレイヤーに強力な電脳ハック能力を与えた革新的なサイバーカードバトルです。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2 font-mono">
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 text-zinc-400">
                    <span className="text-amber-500 font-bold block mb-1 font-serif">■ ニムトの根本ルール</span>
                    1. 全員が一度に手札から1枚選んで同時に提出。<br />
                    2. 値の小さいカードから順番に配置。<br />
                    3. カードは「末尾の数値が最も近く、かつ大きい列」の末尾に吸い込まれます。<br />
                    4. 列の「6枚目」を置いてしまうと、それまでの5枚を食べることになりペナルティ（マイナス点）となります！
                  </div>
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-amber-500/10 text-zinc-400">
                    <span className="text-amber-400 font-bold block mb-1 font-serif">■ 本作独自の斬新な要素</span>
                    1. <b className="text-amber-300">サイバースキル EP</b>: 各自チャージされるEPを消費し、数値の変更・強行割り込み・EMPバリア・トラップ配置・マイナス相手転嫁がいつでも起動可能。<br />
                    2. <b className="text-rose-400">大ダメージ・カットイン</b>: 対戦相手に6点以上の連続マイナスかトラップを踏み倒させたとき、画面をハックするかっこいいカットインが炸裂！
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TITLE SCREEN (SETUP PHASE) */}
          {gameState.currentPhase === 'SETUP' && (
            <div id="cyber-title-screen" className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-3xl p-8 md:p-12 text-center space-y-8 relative overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.9)] animate-delicate-glow">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />
              
              <div className="max-w-xl mx-auto space-y-4">
                <span className="text-[10px] bg-amber-950/60 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold tracking-widest uppercase inline-block font-sans">
                  SECURE NET PROTOCOL // VER 2.0.4
                </span>
                
                <h1 className="text-5xl md:text-6xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-zinc-200 to-zinc-500 tracking-wider uppercase leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                  サイバーニムト
                </h1>
                
                <h2 className="text-sm font-bold text-amber-500 uppercase tracking-[0.25em] font-display">
                  電脳ニムト：ネクサス・ドライブ
                </h2>
                
                <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-md mx-auto">
                  ドイツの名作『6nimmt!』が電脳化された。特殊アビリティを搭載したハックプログラムを駆使し、対戦相手に大マイナス点を強引に擦り込む、新感覚の電脳サイバーカードデュエル。
                </p>
              </div>

              {/* Glowing Cyber Bull Mascot Image block inside the title screen */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full max-w-xs mx-auto -z-10" />
                <div className="w-40 h-40 transform transition-all duration-500 hover:scale-[1.05] hover:rotate-2 relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-fuchsia-500/10 rounded-3xl blur-xl" />
                  <CyberBullArt glow={true} className="border-2 border-amber-500/20 shadow-2xl rounded-2xl" />
                </div>
                <span className="text-[9px] text-zinc-650 tracking-widest font-mono mt-3">
                  CYBER_COW_INTEGRITY_CORE_V1.DLL
                </span>
              </div>

              {/* Game highlight cards display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto text-left font-sans">
                <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl space-y-1.5 animate-pulse">
                  <span className="text-amber-500 font-bold text-xs uppercase font-display block">1. アビリティ・ハック</span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    毎ターン EP がチャージ。数値の書き換え、割り込み配置、ペナルティ反転などの特権アビリティを起動可能。
                  </p>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl space-y-1.5">
                  <span className="text-cyan-400 font-bold text-xs uppercase font-display block">2. 大ダメージ・カットイン</span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    相手に 6点以上のマイナスを与える、またはトラップを踏ませたとき、電脳視界を揺るがす「ド派手カットイン」が炸裂！
                  </p>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl space-y-1.5">
                  <span className="text-fuchsia-400 font-bold text-xs uppercase font-display block">3. サイバースキン・アート</span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    全てのカードの背面や随所に、高精細な「電脳牛の幾何学パターン（スキンスレッド）」がエングレービング。
                  </p>
                </div>
              </div>

              {/* Large, hyper-stylish action button */}
              <div className="pt-6 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    audio.playWarningSiren();
                    setGameState((prev) => ({ ...prev, currentPhase: 'CHAR_SELECT' }));
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-zinc-950 py-4 px-8 rounded-xl font-black tracking-[0.2em] text-sm shadow-[0_6px_24px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer uppercase flex items-center justify-center gap-2 font-serif"
                >
                  <Swords className="w-5 h-5 animate-pulse" />
                  INITIALIZE SYSTEM // 電脳ゲーム起動
                </button>
              </div>

              {/* Test link */}
              <div className="text-center">
                <button
                  onClick={triggerDemoCutin}
                  className="text-[9px] text-zinc-650 hover:text-zinc-500 underline cursor-pointer font-mono"
                >
                  [ CUT-IN CINEMA DEMO // カットインデモ起動テスト ]
                </button>
              </div>
            </div>
          )}

          {/* CHARACTER SELECTOR / LOBBY SCREEN */}
          {gameState.currentPhase === 'CHAR_SELECT' && (
            <div id="character-select-lobby" className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-10 text-center space-y-8 relative overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-delicate-glow">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-700" />
              
              <div className="max-w-2xl mx-auto space-y-3">
                <span className="text-[9px] bg-amber-955/60 text-amber-550 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold tracking-widest uppercase">
                  READY FOR DECK IMMERSION // ロビー
                </span>
                <h2 className="text-3xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-zinc-100 to-zinc-400 uppercase tracking-wide">
                  得意な電脳プログラムを選択
                </h2>
                <p className="text-xs text-zinc-400 leading-normal max-w-lg mx-auto font-sans">
                  あなたは特殊スキルを使用可能なハッカーです。あなたの得意なハックアーキタイプ（初期ロード能力）を選択してデュアルを開始してください。
                </p>
              </div>

              {/* Archetype display selector cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {SKILL_LIST.slice(0, 3).map((sk) => (
                  <div
                    key={sk.id}
                    className="bg-zinc-950/40 border border-zinc-800 hover:border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative"
                  >
                    <div>
                      <span className="text-[9px] bg-zinc-900 text-amber-500 border border-zinc-850 px-2 py-0.5 rounded uppercase font-bold tracking-wider mb-2 inline-block font-mono">
                        ARCHETYPE
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors font-serif">
                        {sk.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed font-sans">
                        {sk.description}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleStartGame(sk.id)}
                      className="mt-6 w-full bg-amber-955/30 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-500 text-xs py-2 rounded-lg font-bold transition-all cursor-pointer font-sans"
                    >
                      この能力として出撃
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800/80 max-w-sm mx-auto flex items-center justify-center gap-3">
                <button
                  onClick={() => handleStartGame('VALUE_OFFSET')}
                  className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 text-zinc-950 py-3 px-6 rounded-xl font-black tracking-widest text-sm shadow-[0_4px_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer uppercase flex items-center justify-center gap-2 font-serif"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  クイックマッチ開始
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setGameState((prev) => ({ ...prev, currentPhase: 'SETUP' }))}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer font-mono"
                >
                  [ RETURN TO TITLE // タイトル画面に戻る ]
                </button>
              </div>
            </div>
          )}

          {/* Active board game elements */}
          {gameState.currentPhase !== 'SETUP' && gameState.currentPhase !== 'CHAR_SELECT' && (
            <div className="space-y-6">
              
              {/* Row Lines Board state visualization */}
              <div
                id="main-game-board"
                className="bg-zinc-950/40 border border-zinc-800/70 rounded-3xl p-4 md:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.65)] backdrop-blur-md relative overflow-hidden"
              >
                {/* Sector header watermark */}
                <div className="absolute top-3 right-6 flex items-center gap-1 opacity-20 pointer-events-none text-[9px] font-mono">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>CYBER_BOARD_COORDINATE // CENTRAL MATRIX</span>
                </div>

                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800/80">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-serif">
                    ボード中央グリッド (4ライン)
                  </span>
                  
                  {/* Info tracker slots */}
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/30 border border-amber-800/60 px-2.5 py-0.5 rounded-full leading-none font-mono">
                    ROUND: {gameState.round} / 10
                  </span>
                </div>

                {/* 4 horizontal rows of board placement slots */}
                <div className="space-y-4">
                  {gameState.rows.map((row, idx) => {
                    const isFull = row.cards.length >= 5;
                    const isRowTargetForChoice = gameState.currentPhase === 'ROW_CHOICE' && gameState.pendingRowPlayerId === 'player';

                    return (
                      <div
                        id={`board-row-${row.id}`}
                        key={row.id}
                        className={`group rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 transition-all duration-300 relative ${
                          isRowTargetForChoice
                            ? 'bg-amber-950/20 border border-amber-500/85 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:bg-amber-950/35 cursor-pointer scale-[1.01]'
                            : isFull
                            ? 'bg-gradient-to-r from-rose-950/15 via-zinc-900/60 to-zinc-950 border border-rose-900/30 shadow-[0_0_12px_rgba(153,27,27,0.2)]'
                            : 'bg-zinc-900/30 border border-zinc-900/80 hover:bg-zinc-900/50'
                        }`}
                        onClick={() => {
                          if (isRowTargetForChoice) {
                            handleSelectRowReset(idx);
                          }
                        }}
                      >
                        {/* Bullet trap indicators overlay */}
                        {row.hasTrap && (
                          <div className="absolute top-1.5 right-4 bg-amber-500/20 border border-amber-500/30 rounded px-1.5 py-0.5 text-[8px] text-amber-400 uppercase tracking-wider animate-pulse flex items-center gap-1 z-10 font-mono">
                            ★ TRAP PLANTED ({row.trapPlacedBy === 'player' ? 'Player' : 'CPU'})
                          </div>
                        )}

                        {/* Row Identifier index */}
                        <div className="flex items-center gap-2.5 min-w-[70px]">
                          <span className={`text-xs font-bold font-mono py-1 px-2.5 rounded-lg border leading-none ${
                            isFull
                              ? 'bg-rose-950/40 text-rose-400 border-rose-900/50'
                              : 'bg-zinc-950 text-amber-500 border-zinc-850'
                          }`}>
                            L-{row.id}
                          </span>

                          {/* Quick details summation */}
                          <div className="flex flex-col text-[10px] leading-none">
                            <span className="text-zinc-650 uppercase font-mono">Bulls:</span>
                            <span className="font-bold text-zinc-350 mt-1 font-mono">
                              {row.cards.reduce((sum, c) => sum + c.penalty, 0)}
                            </span>
                          </div>
                        </div>

                        {/* Cards Slots display (1 to 5 potential) */}
                        <div className="flex items-center gap-2.5 overflow-x-auto flex-1 py-1.5 no-scrollbar">
                          {row.cards.map((card, cardIndex) => (
                            <GameCard
                              key={cardIndex}
                              card={card}
                              size="sm"
                              isRevealed={true}
                            />
                          ))}

                          {/* Empty visual slots placeholders to warn about size limits (6th nimt rule) */}
                          {Array.from({ length: 5 - row.cards.length }).map((_, emptyIndex) => (
                            <div
                              key={emptyIndex}
                              className={`w-16 h-24 rounded-lg border border-dashed flex items-center justify-center select-none text-[9px] font-mono ${
                                isFull
                                  ? 'border-rose-950/20'
                                  : emptyIndex === 4 - row.cards.length
                                  ? 'border-amber-500/20 text-amber-500/20 font-bold bg-amber-500/5 hover:border-amber-500/30'
                                  : 'border-zinc-850 text-zinc-700/30 bg-zinc-950/10'
                                }`}
                            >
                              {emptyIndex === 4 - row.cards.length ? 'HAZARD' : `COL.${row.cards.length + emptyIndex + 1}`}
                            </div>
                          ))}
                        </div>

                        {/* Manual Intercept trigger for row selector choice */}
                        {isRowTargetForChoice && (
                          <button
                            onClick={() => handleSelectRowReset(idx)}
                            className="bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-mono font-bold py-1.5 px-3 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.3)] leading-none cursor-pointer"
                          >
                            SELECT DUMP
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Overwrite instruction warning */}
                {gameState.currentPhase === 'ROW_CHOICE' && gameState.pendingRowPlayerId === 'player' && (
                  <div className="mt-4 bg-amber-950/10 border border-amber-500/25 rounded-xl p-3.5 text-center animate-pulse">
                    <span className="text-[11px] text-amber-400 font-bold tracking-wider uppercase flex items-center justify-center gap-2 font-serif">
                      ⚠️ OVERDUMP ACTION REQUIRED // 列選択フラグ ⚠️
                    </span>
                    <p className="text-[10px] text-zinc-450 mt-1 font-sans">
                      あなたの提出カードがどの列の最後尾値よりも小さいか、Row Pirateスキルを使用しました。引き取る列をクリックしてください。
                    </p>
                  </div>
                )}
              </div>

              {/* Reveal Board state layout */}
              {(gameState.currentPhase === 'REVEALING' || gameState.currentPhase === 'PLACING') && (
                <div
                  id="revealed-mat"
                  className="bg-zinc-950/40 border border-zinc-800/70 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute bottom-[-10px] left-0 right-0 h-40 bg-gradient-to-t from-amber-955/5 to-transparent pointer-events-none" />

                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 pb-2 border-b border-zinc-800/80 font-serif">
                    デュアル公開マット (PLACING)
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-center items-stretch">
                    {gameState.players.map((p) => {
                      const isNextToPlace =
                        gameState.placingQueue[gameState.activePlacingIndex]?.playerId === p.id;

                      return (
                        <div
                          key={p.id}
                          className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                            isNextToPlace
                              ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.02]'
                              : 'bg-zinc-900/25 border-zinc-900/80'
                          }`}
                        >
                          <div className="text-center w-full mb-3">
                            <span className="text-[8px] text-zinc-650 font-bold block font-mono">OPERATOR</span>
                            <span className="text-[11px] font-bold text-zinc-300 truncate block font-display">{p.name}</span>
                          </div>

                          {/* Reveal actual card */}
                          {p.selectedCard ? (
                            <div className="relative">
                              <GameCard
                                card={p.selectedCard}
                                isRevealed={true}
                                size="md"
                                selected={isNextToPlace}
                                offsetIndicator={p.activeSkill === 'VALUE_OFFSET' ? p.offsetValue : undefined}
                              />
                              {p.activeSkill && (
                                <div className="absolute -bottom-2 inset-x-0 mx-auto text-center z-10 font-mono">
                                  <span className="bg-amber-600 border border-amber-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                                    {p.activeSkill}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-24 h-36 rounded-lg border border-dashed border-zinc-850 flex items-center justify-center text-[10px] text-zinc-655 font-mono">
                              No Card
                            </div>
                          )}

                          <div className="mt-3.5 w-full text-center font-mono font-bold">
                            {isNextToPlace ? (
                              <span className="text-[9px] text-amber-550 font-bold animate-pulse uppercase tracking-[0.1em] border border-amber-500/20 px-2 py-0.5 rounded block">
                                Placing Next
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-550 block uppercase">
                                Processed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-850">
                    <div className="text-left">
                      <span className="text-[10px] text-zinc-500 block uppercase">PROCESSOR COMMANDS // 進行指令</span>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        手牌の小さい順から自動でソートされました。順番にメイングリッドへロードします。
                      </p>
                    </div>

                    <button
                      id="next-placement-step-btn"
                      onClick={handleNextPlacingStep}
                      className="bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider"
                    >
                      <Swords className="w-4 h-4 fill-white" />
                      {gameState.activePlacingIndex >= gameState.placingQueue.length ? 'ターン終了へ' : '次のカードを配置'}
                    </button>
                  </div>
                </div>
              )}

              {/* Player hand console (Bottom HUD) */}
              {humanPlayer && gameState.currentPhase === 'PLAY_CARD' && (
                <div className="space-y-4">
                  
                  {/* Skill selection subsystem */}
                  <SpecialSkillSelector
                    player={humanPlayer}
                    onSelectSkill={(skId) => setSelectedSkill(skId)}
                    onSetOffset={(val) => setSkillOffsetValue(val)}
                    offsetValue={skillOffsetValue}
                  />

                  {/* Ultimate cockpit user HUD */}
                  <div
                    id="user-hand-dashboard"
                    className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/10 via-transparent to-transparent pointer-events-none" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] text-fuchsia-400 font-extrabold uppercase tracking-widest block leading-none">
                          HACK CONSOLE // コックピット手牌
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">
                          あなたの手札 （10枚スタート）
                        </h3>
                      </div>

                      {/* Launch Trigger action with glowing confirmation */}
                      <div className="flex items-center gap-3">
                        {selectedHandCard && (
                          <div className="text-right hidden md:block">
                            <span className="text-[9px] text-zinc-500 block">SELECTED VALUE:</span>
                            <span className="text-sm font-black text-cyan-400 font-mono">
                              SYS.{selectedHandCard.value} 
                              {selectedSkill === 'VALUE_OFFSET' && skillOffsetValue !== 0 && (
                                <span className={skillOffsetValue > 0 ? 'text-orange-400' : 'text-emerald-400'}>
                                  {' '}(→{selectedHandCard.value + skillOffsetValue})
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        <button
                          id="confirm-play-card-btn"
                          disabled={!selectedHandCard}
                          onClick={handleCommitCard}
                          className={`py-2 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 transform cursor-pointer flex items-center gap-2 ${
                            selectedHandCard
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)] active:scale-95'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                          }`}
                        >
                          カードを装填・提出
                        </button>
                      </div>
                    </div>

                    {/* Array of active hand cards */}
                    <div className="flex flex-wrap gap-2.5 justify-center py-2 bg-zinc-950/30 rounded-xl p-3 border border-zinc-850/50">
                      {humanPlayer.hand.map((card, idx) => {
                        const isChosen = selectedHandCard?.value === card.value;
                        return (
                          <GameCard
                            key={idx}
                            card={card}
                            selected={isChosen}
                            isRevealed={true}
                            size="md"
                            onClick={() => setSelectedHandCard(card)}
                            offsetIndicator={isChosen && selectedSkill === 'VALUE_OFFSET' ? skillOffsetValue : undefined}
                          />
                        );
                      })}

                      {humanPlayer.hand.length === 0 && (
                        <div className="py-6 text-center text-zinc-600">
                          すべての手札を使用しました。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Game Over Screen representation */}
              {gameState.currentPhase === 'GAME_OVER' && (
                <div id="game-over-summary" className="bg-zinc-900 border-2 border-fuchsia-500/40 rounded-3xl p-6 md:p-10 text-center space-y-6 relative overflow-hidden shadow-[0_0_35px_rgba(219,39,119,0.15)]">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-fuchsia-500 to-rose-500" />
                  
                  <div className="max-w-md mx-auto space-y-2">
                    <span className="text-[10px] bg-red-950 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-bold tracking-widest uppercase">
                      CONNECTION_SHUTDOWN // 試合終了
                    </span>
                    <h2 className="text-3xl font-black text-white">
                      ファイナルハック・サマリー
                    </h2>
                    <p className="text-xs text-zinc-400">
                      生存エネルギー（HP）が尽きるか、10ラウンドが完遂しました。
                    </p>
                  </div>

                  {/* Leaderboard and winner declaration */}
                  <div className="bg-zinc-950/80 max-w-xl mx-auto rounded-2xl border border-zinc-800 p-4 space-y-2.5">
                    {[...gameState.players]
                      .sort((a, b) => b.score - a.score)
                      .map((p, idx) => {
                        const isWinner = idx === 0;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                              isWinner
                                ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                                : 'bg-zinc-900/50 border-zinc-850'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isWinner ? 'bg-cyan-400 text-black' : 'bg-zinc-850 text-zinc-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <div className="text-left">
                                <span className="font-bold block text-sm">{p.name} {p.isHuman && ' (あなた)'}</span>
                                <span className="text-[10px] text-zinc-500 uppercase">HP survival: {p.score}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-extrabold ${isWinner ? 'text-cyan-400' : 'text-zinc-300'}`}>
                                {p.score} HP
                              </span>
                              <span className="text-[10px] text-zinc-500 block leading-none mt-1">
                                (合計ペナルティ: {p.penaltyPoints}点)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="pt-4">
                    <button
                      id="restart-game-btn-over"
                      onClick={() => handleStartGame()}
                      className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black py-3 px-8 rounded-xl font-black tracking-widest text-sm shadow-[0_4px_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      新しいデュエルを開始する
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Columns (4 grid slots): Leaderboard ranks & Log monitors */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Operator Rankings leaderboard card */}
          {gameState.currentPhase !== 'SETUP' && gameState.currentPhase !== 'CHAR_SELECT' && (
            <div
              id="leaderboard-panel"
              className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 md:p-5 shadow-lg relative overflow-hidden"
            >
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 pb-2 border-b border-zinc-800">
                生存モニター (SCOREBOARDS)
              </h3>

              <div className="space-y-3">
                {gameState.players.map((p, idx) => {
                  const healthPercent = Math.max(0, Math.min(100, (p.score / 66) * 100));
                  let barColor = 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]';
                  if (healthPercent < 40) {
                    barColor = 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse';
                  } else if (healthPercent < 70) {
                    barColor = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
                  }

                  return (
                    <div key={p.id} className="bg-zinc-950/80 border border-zinc-850/80 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-sm bg-gradient-to-tr ${p.avatarColor}`} />
                          <span className="text-xs font-bold text-white uppercase font-mono">
                            {p.name} {p.isHuman && ' (YOU)'}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-semibold text-zinc-300 font-mono">
                            {p.score} HP
                          </span>
                        </div>
                      </div>

                      {/* HP Bar */}
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden relative border border-zinc-900">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${healthPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-2 text-[9px] text-zinc-500 leading-none">
                        <span>ENERGY: {p.energy} EP</span>
                        <span>PENALTY: {p.penaltyPoints} Pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Game Logs Monitor Console */}
          <div
            id="logs-monitor-card"
            className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 md:p-5 shadow-lg relative flex flex-col h-[350px] overflow-hidden"
          >
            {/* Blinking green online signal */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-60">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span className="text-[9px] text-green-400 font-bold font-mono">LOGS_REACTIVE</span>
            </div>

            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 pb-2 border-b border-zinc-800">
              ログモニター (GAME LOGS)
            </h3>

            {/* Scrollable logs content */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px] leading-relaxed text-zinc-400 no-scrollbar select-text">
              {gameState.logs.slice().reverse().map((log, index) => {
                let textCol = 'text-zinc-400';
                if (log.includes('列崩壊') || log.includes('Anomaly') || log.includes('ペナルティ')) {
                  textCol = 'text-rose-400 font-bold';
                } else if (log.includes('ハブック') || log.includes('スキル') || log.includes('ハック:')) {
                  textCol = 'text-fuchsia-400 font-bold';
                } else if (log.includes('盾発動') || log.includes('リンク接続')) {
                  textCol = 'text-cyan-400 font-bold';
                } else if (log.includes('ROUND')) {
                  textCol = 'text-yellow-300 font-extrabold border-b border-zinc-800/60 pb-1 mt-1 block';
                }

                return (
                  <div key={index} className={`py-0.5 border-b border-zinc-850 pb-1 ${textCol}`}>
                    {log}
                  </div>
                );
              })}

              {gameState.logs.length === 0 && (
                <div className="text-zinc-600 italic py-4 text-center">
                  ログはありません。ゲームを開始してください。
                </div>
              )}
            </div>
          </div>

          {/* Holographic Cow Mascot display in the right column */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">
              HOLOGRAPHIC MASCOT // 電脳シンボル
            </span>
            <div className="w-24 h-24">
              <CyberBullArt glow={true} className="border-cyan-500/30" />
            </div>
            <span className="text-[10px] text-cyan-400 font-bold tracking-wider mt-3">
              CYBER_COW_CORE.DLL
            </span>
          </div>

        </div>

      </main>

      {/* Cinematic Full Screen Cut-In Display Portal */}
      {gameState.cutInInfo && (
        <CutInEffect
          active={gameState.cutInInfo.active}
          triggerPlayerName={gameState.cutInInfo.triggerPlayerName}
          targetPlayerName={gameState.cutInInfo.targetPlayerName}
          penaltyPoints={gameState.cutInInfo.penaltyPoints}
          skillUsed={gameState.cutInInfo.skillUsed}
          onComplete={() => {
            setGameState((prev) => ({
              ...prev,
              cutInInfo: null,
            }));
          }}
        />
      )}

      {/* Footer system details */}
      <footer className="max-w-7xl mx-auto mt-12 border-t border-zinc-850 pt-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-zinc-600 gap-2">
        <span>© 2026 CYBER_NIMTO_NEXUS. ALL RIGHTS RESERVED. FOR PERSONAL SIMULATION PURPOSES ONLY.</span>
        <span className="font-mono uppercase">SECURITY_LEVEL: DEEP_MATRIX</span>
      </footer>

    </div>
  );
}
