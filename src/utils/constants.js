// ============ VISUAL CONSTANTS ============

export const PROFILE_COLORS = [
  { bg: '#f97316', light: '#fb923c' }, // Orange
  { bg: '#3b82f6', light: '#60a5fa' }, // Blue
  { bg: '#10b981', light: '#34d399' }, // Green
  { bg: '#8b5cf6', light: '#a78bfa' }, // Purple
  { bg: '#ec4899', light: '#f472b6' }, // Pink
  { bg: '#eab308', light: '#facc15' }, // Yellow
];

// ============ STAT RANGES ============

export const TOUGHNESS_RANGE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const SAVE_RANGE = [2, 3, 4, 5, 6, 7]; // 7 = no save
export const BS_WS_RANGE = [2, 3, 4, 5, 6];

// ============ TARGET PRESETS ============

export const TARGET_PRESETS = [
  { name: 'Guardsmen', t: 3, sv: 5, w: 1, m: 10 },
  { name: 'Intercessors', t: 4, sv: 3, w: 2, m: 5 },
  { name: 'Terminators', t: 5, sv: 2, w: 3, m: 5 },
  { name: 'Gravis', t: 6, sv: 3, w: 3, m: 3 },
  { name: 'Ork Boyz', t: 5, sv: 6, w: 1, m: 10 },
  { name: 'Custodes', t: 6, sv: 2, w: 3, m: 5 },
  { name: 'Rhino', t: 9, sv: 3, w: 10, m: 1 },
  { name: 'Leman Russ', t: 11, sv: 2, w: 13, m: 1 },
  { name: 'Knight', t: 12, sv: 3, w: 22, m: 1 },
];

// ============ DAMAGE PRESETS ============

export const DAMAGE_PRESETS = ['1', '2', '3', 'D3', 'D6', 'D6+1'];

// ============ DEFAULT VALUES ============

export const DEFAULT_PROFILE = {
  name: 'Bolt Rifles',
  attacks: 10,
  bs: 3,
  strength: 4,
  ap: 1,
  damage: '1'
};

export const DEFAULT_TARGET = {
  toughness: 4,
  save: 3,
  wounds: 2,
  models: 5,
  name: 'Intercessors'
};
