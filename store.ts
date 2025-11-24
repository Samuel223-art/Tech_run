/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { GameStatus, LEVEL_TARGETS, RUN_SPEED_BASE } from './types';

interface GameState {
  status: GameStatus;
  previousStatus: GameStatus | null;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  level: number;
  visualLevel: number;
  laneCount: number;
  gemsCollected: number;
  distance: number;
  highScore: number;
  
  // Inventory / Abilities
  hasDoubleJump: boolean;
  hasInvincibilityAbility: boolean;
  isInvincible: boolean;
  isScoreMultiplierActive: boolean;
  scoreMultiplier: number;

  // Actions
  showMenu: () => void;
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  collectPowerUp: (type: 'INVINCIBILITY' | 'SCORE_MULTIPLIER') => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  
  // Shop / Abilities
  buyItem: (type: 'DOUBLE_JUMP' | 'MAX_LIFE' | 'HEAL' | 'IMMORTAL', cost: number) => boolean;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateInvincibilityAbility: () => void;
}

const MAX_LEVEL = 4;

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.SPLASH,
  previousStatus: null,
  score: 0,
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  level: 1,
  visualLevel: 1,
  laneCount: 3,
  gemsCollected: 0,
  distance: 0,
  highScore: parseInt(localStorage.getItem('geminiRunnerHighScore') || '0'),
  
  hasDoubleJump: false,
  hasInvincibilityAbility: false,
  isInvincible: false,
  isScoreMultiplierActive: false,
  scoreMultiplier: 1,

  showMenu: () => set(state => ({ status: GameStatus.MENU, previousStatus: state.status })),

  startGame: () => set({ 
    status: GameStatus.PLAYING, 
    previousStatus: GameStatus.MENU,
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    visualLevel: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    hasInvincibilityAbility: false,
    isInvincible: false
  }),

  restartGame: () => set(state => ({ 
    status: GameStatus.PLAYING,
    previousStatus: state.status, 
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    visualLevel: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    hasInvincibilityAbility: false,
    isInvincible: false
  })),

  takeDamage: () => {
    const { lives, isInvincible } = get();
    if (isInvincible) return;

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      set(state => ({ lives: 0, status: GameStatus.GAME_OVER, previousStatus: state.status, speed: 0 }));
    }
  },

  addScore: (amount) => set((state) => ({ score: state.score + (amount * state.scoreMultiplier) })),
  
  collectGem: (value) => {
    const { scoreMultiplier } = get();
    set((state) => ({ 
      score: state.score + (value * scoreMultiplier), 
      gemsCollected: state.gemsCollected + 1 
    }));
  },

  setDistance: (dist) => {
    set({ distance: dist });
    const { score, highScore } = get();
    if (score > highScore) {
      set({ highScore: score });
      localStorage.setItem('geminiRunnerHighScore', score.toString());
    }
  },

  collectLetter: (index) => {
    const { collectedLetters, level, speed } = get();
    
    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      
      let newSpeed = speed;
      if (level === 1) {
          const speedIncrease = RUN_SPEED_BASE * 0.10;
          // Cap speed at 200% of base speed in level 1
          newSpeed = Math.min(speed + speedIncrease, RUN_SPEED_BASE * 2);
      }
      // No speed increase for letters in levels 2 & 3

      set({ 
        collectedLetters: newLetters,
        speed: newSpeed,
      });

      const currentTarget = LEVEL_TARGETS[level - 1];
      if (newLetters.length === currentTarget.length) {
        if (level < MAX_LEVEL) {
            get().advanceLevel();
        } else {
            set(state => ({
                status: GameStatus.VICTORY,
                previousStatus: state.status,
                score: get().score + 5000
            }));
        }
      }
    }
  },
  
  collectPowerUp: (type) => {
    if (type === 'INVINCIBILITY') {
        set({ isInvincible: true });
        setTimeout(() => set({ isInvincible: false }), 15000); // 15 seconds
    } else if (type === 'SCORE_MULTIPLIER') {
        set({ isScoreMultiplierActive: true, scoreMultiplier: 2 });
        setTimeout(() => set({ isScoreMultiplierActive: false, scoreMultiplier: 1 }), 15000); // 15 seconds
    }
  },

  advanceLevel: () => {
      const { level } = get();
      const nextLevel = level + 1;
      
      let newSpeed;
      if (nextLevel === 2) {
          newSpeed = RUN_SPEED_BASE * 1.5; // 150%
      } else if (nextLevel === 3) {
          newSpeed = RUN_SPEED_BASE * 2.0; // 200%
      } else if (nextLevel === 4) {
          newSpeed = RUN_SPEED_BASE * 2.5; // 250%
      } else {
          // Fallback for potential future levels
          newSpeed = get().speed + RUN_SPEED_BASE * 0.40;
      }

      set(state => ({
          level: nextLevel,
          status: GameStatus.PLAYING,
          previousStatus: state.status,
          speed: newSpeed,
          collectedLetters: []
      }));
  },

  openShop: () => set(state => ({ status: GameStatus.SHOP, previousStatus: state.status })),
  
  closeShop: () => set((state) => {
    const nextStatus = state.previousStatus === GameStatus.PAUSED ? GameStatus.PAUSED : GameStatus.PLAYING;
    // If we are closing the shop after a level-up, sync the visual theme now.
    if (state.level > state.visualLevel) {
        return { 
            status: nextStatus, 
            previousStatus: GameStatus.SHOP,
            visualLevel: state.level 
        };
    }
    return { status: nextStatus, previousStatus: GameStatus.SHOP };
  }),

  buyItem: (type, cost) => {
      const { score, maxLives, lives } = get();
      
      if (score >= cost) {
          set({ score: score - cost });
          
          switch (type) {
              case 'DOUBLE_JUMP':
                  set({ hasDoubleJump: true });
                  break;
              case 'MAX_LIFE':
                  set({ maxLives: maxLives + 1, lives: lives + 1 });
                  break;
              case 'HEAL':
                  set({ lives: Math.min(lives + 1, maxLives) });
                  break;
              case 'IMMORTAL':
                  set({ hasInvincibilityAbility: true });
                  break;
          }
          return true;
      }
      return false;
  },

  activateInvincibilityAbility: () => {
      const { hasInvincibilityAbility, isInvincible } = get();
      if (hasInvincibilityAbility && !isInvincible) {
          set({ isInvincible: true });
          setTimeout(() => set({ isInvincible: false }), 15000);
      }
  },

  setStatus: (status) => set((state) => ({ status, previousStatus: state.status })),
}));