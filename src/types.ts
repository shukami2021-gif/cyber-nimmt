/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Card {
  value: number; // 1 to 104
  penalty: number; // Number of bull heads (1, 2, 3, 5, or 7)
}

export type SkillType = 'ROW_PIRATE' | 'EMP_SHIELD' | 'VALUE_OFFSET' | 'NEXUS_LINK' | 'BULL_TRAP';

export interface Skill {
  id: SkillType;
  name: string;
  jpName: string;
  description: string;
  cost: number;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: Card[];
  score: number; // Total points (we count down from 66 or start from 0 and cumulative minus - standard is accumulated negative points)
  penaltyPoints: number; // Cumulative negative points this game
  energy: number; // Hack points / energy (charges each round)
  activeSkill: SkillType | null;
  offsetValue?: number; // Used for VALUE_OFFSET skill (-5 to +5)
  selectedCard: Card | null;
  avatarColor: string;
  archetype: Skill;
}

export interface GameRow {
  id: number;
  cards: Card[];
  hasTrap: boolean;
  trapPlacedBy?: string;
}

export interface PlayAction {
  playerId: string;
  playerName: string;
  card: Card;
  originalCard: Card;
  activeSkill: SkillType | null;
  offsetUsed?: number;
}

export interface TurnReport {
  cardPlacements: Array<{
    playerId: string;
    playerName: string;
    originalCard: Card;
    actualCard: Card;
    rowId: number;
    cardsTaken: Card[];
    shielded: boolean;
    linkedTo?: {
      targetId: string;
      targetName: string;
      pointsShare: number;
    };
    is6thCard: boolean;
    isTooSmall: boolean;
    pointsGiven: number;
    isTrapTriggered: boolean;
  }>;
}

export interface GameState {
  round: number; // current hand round (1 to 10)
  gameEnded: boolean;
  currentPhase: 'SETUP' | 'CHAR_SELECT' | 'PLAY_CARD' | 'REVEALING' | 'PLACING' | 'ROW_CHOICE' | 'ROUND_OVER' | 'GAME_OVER';
  rows: GameRow[];
  players: Player[];
  deck: Card[];
  activePlacingIndex: number; // which player's card is currently being placed
  placingQueue: PlayAction[]; // queue of selected cards to place, sorted in ascending order
  pendingRowPlayerId: string | null; // who is currently choosing a row (due to too small card)
  logs: string[];
  cutInInfo: {
    active: boolean;
    triggerPlayerName: string;
    targetPlayerName: string;
    penaltyPoints: number;
    skillUsed: string | null;
  } | null;
}
