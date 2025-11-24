/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export enum GameStatus {
  SPLASH = 'SPLASH',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  GEM = 'GEM',
  LETTER = 'LETTER',
  SHOP_PORTAL = 'SHOP_PORTAL',
  ALIEN = 'ALIEN',
  MISSILE = 'MISSILE',
  POWERUP_INVINCIBILITY = 'POWERUP_INVINCIBILITY',
  POWERUP_SCORE_MULTIPLIER = 'POWERUP_SCORE_MULTIPLIER',
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters (G, E, M...)
  color?: string;
  targetIndex?: number; // Index in the GEMINI target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Aliens
  powerUpType?: 'INVINCIBILITY' | 'SCORE_MULTIPLIER';
  isSnowball?: boolean; // For wide obstacles
  rotation?: [number, number, number]; // For objects like fallen pawns
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 22.5;
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// Google-ish Neon Colors: Blue, Red, Yellow, Blue, Green, Red
export const LEVEL_TARGETS = [
    ['B', 'E', 'A', 'C', 'H'],
    ['H', 'O', 'T', 'L', 'A', 'V', 'A'],
    ['F', 'R', 'O', 'S', 'T', 'B', 'I', 'T', 'E'],
    ['D', 'E', 'E', 'P', 'D', 'I', 'V', 'E'],
];

// Level 2: Hot Lava (Fiery colors)
const HOTLAVA_COLORS = [
    '#ff4500', // OrangeRed
    '#ff8c00', // DarkOrange
    '#ffd700', // Gold
    '#ff6347', // Tomato
    '#dc143c', // Crimson
    '#ffea00', // Yellow
    '#ff7f50', // Coral
];

// Level 3: Snow (Icy/cool colors)
const SNOW_COLORS = [
    '#e0f2fe', // sky-100
    '#a5f3fc', // cyan-200
    '#67e8f9', // cyan-300
    '#22d3ee', // cyan-400
    '#06b6d4', // cyan-500
    '#0891b2', // cyan-600
    '#0e7490', // cyan-700
    '#155e75', // cyan-800
    '#ffffff', // white
    '#e0e7ff', // indigo-100
    '#c7d2fe', // indigo-200
];

// Level 4: Underwater (Deep sea colors)
const UNDERWATER_COLORS = [
    '#00ffff', // cyan
    '#7fffd4', // aquamarine
    '#40e0d0', // turquoise
    '#afeeee', // paleturquoise
    '#00ced1', // darkturquoise
    '#5f9ea0', // cadetblue
    '#20b2aa', // lightseagreen
    '#66cdaa', // mediumaquamarine
];

// Level 1: Beach (Coastal colors)
const BEACH_COLORS = [
    '#00bfff', // DeepSkyBlue
    '#ffff00', // Yellow
    '#f0e68c', // Khaki
    '#add8e6', // LightBlue
    '#87ceeb', // SkyBlue
];

export const LEVEL_COLORS = [
    BEACH_COLORS,
    HOTLAVA_COLORS,
    SNOW_COLORS,
    UNDERWATER_COLORS,
];

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
    oneTime?: boolean; // If true, remove from pool after buying
}