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
  isSnowball?: boolean; // For wide obstacles in Level 3
  isRollingLog?: boolean; // For wide obstacles in Level 4
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
    ['W', 'I', 'L', 'D', 'W', 'O', 'O', 'D'],
];

// Level 1: Beach (Coastal colors)
const BEACH_COLORS = [
    '#00bfff', // DeepSkyBlue
    '#ffff00', // Yellow
    '#f0e68c', // Khaki
    '#add8e6', // LightBlue
    '#87ceeb', // SkyBlue
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

// Level 3: Snowy Wonderland (Icy colors)
const ICY_COLORS = [
    '#ffffff', // White
    '#afeeee', // PaleTurquoise
    '#b0e0e6', // PowderBlue
    '#add8e6', // LightBlue
    '#87cefa', // LightSkyBlue
    '#00bfff', // DeepSkyBlue
    '#1e90ff', // DodgerBlue
    '#6495ed', // CornflowerBlue
    '#f0f8ff', // AliceBlue
];

// Level 4: Wildwood (Earthy colors)
const FOREST_COLORS = [
    '#556b2f', // DarkOliveGreen
    '#6b8e23', // OliveDrab
    '#8fbc8f', // DarkSeaGreen
    '#228b22', // ForestGreen
    '#d2b48c', // Tan
    '#cd853f', // Peru
    '#a0522d', // Sienna
    '#8b4513', // SaddleBrown
];

export const LEVEL_COLORS = [
    BEACH_COLORS,
    HOTLAVA_COLORS,
    ICY_COLORS,
    FOREST_COLORS,
];

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
    oneTime?: boolean; // If true, remove from pool after buying
}