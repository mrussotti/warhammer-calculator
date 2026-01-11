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
export const INVULN_RANGE = [3, 4, 5, 6, 7]; // 7 = none
export const FNP_RANGE = [4, 5, 6, 7]; // 7 = none

// ============ WEAPON ABILITIES - COMPLETE LIST ============

export const WEAPON_ABILITIES = {
  // === HIT MODIFIERS ===
  torrent: {
    name: 'Torrent',
    description: 'Automatically hits',
    type: 'toggle',
    category: 'hit',
  },
  heavy: {
    name: 'Heavy',
    description: '+1 to hit if stationary',
    type: 'toggle',
    category: 'hit',
  },
  hitMod: {
    name: 'Hit Modifier',
    description: '+/- to hit rolls',
    type: 'number',
    default: 0,
    min: -2,
    max: 2,
    category: 'hit',
  },
  rerollHits: {
    name: 'Reroll Hits',
    description: 'Reroll hit rolls',
    type: 'select',
    options: [
      { value: 'none', label: 'None' },
      { value: 'ones', label: '1s' },
      { value: 'all', label: 'All' },
    ],
    category: 'hit',
  },
  critHitOn: {
    name: 'Crit Hits On',
    description: 'Critical hits trigger on X+',
    type: 'select',
    options: [
      { value: 6, label: '6s' },
      { value: 5, label: '5+' },
      { value: 4, label: '4+' },
    ],
    category: 'hit',
  },
  
  // === WOUND MODIFIERS ===
  lance: {
    name: 'Lance',
    description: '+1 to wound on charge',
    type: 'toggle',
    category: 'wound',
  },
  woundMod: {
    name: 'Wound Modifier',
    description: '+/- to wound rolls',
    type: 'number',
    default: 0,
    min: -2,
    max: 2,
    category: 'wound',
  },
  twinLinked: {
    name: 'Twin-Linked',
    description: 'Reroll all wound rolls',
    type: 'toggle',
    category: 'wound',
  },
  rerollWounds: {
    name: 'Reroll Wounds',
    description: 'Reroll wound rolls',
    type: 'select',
    options: [
      { value: 'none', label: 'None' },
      { value: 'ones', label: '1s' },
      { value: 'all', label: 'All' },
    ],
    category: 'wound',
  },
  critWoundOn: {
    name: 'Crit Wounds On',
    description: 'Critical wounds trigger on X+',
    type: 'select',
    options: [
      { value: 6, label: '6s' },
      { value: 5, label: '5+' },
      { value: 4, label: '4+' },
    ],
    category: 'wound',
  },
  
  // === CRITICAL ABILITIES ===
  sustainedHits: {
    name: 'Sustained Hits',
    description: 'Critical hits generate extra hits',
    type: 'number',
    default: 0,
    max: 3,
    category: 'crit',
  },
  lethalHits: {
    name: 'Lethal Hits',
    description: 'Critical hits auto-wound',
    type: 'toggle',
    category: 'crit',
  },
  devastatingWounds: {
    name: 'Devastating Wounds',
    description: 'Critical wounds bypass saves',
    type: 'toggle',
    category: 'crit',
  },
  antiKeyword: {
    name: 'Anti-X',
    description: 'Critical wounds vs keyword on X+',
    type: 'antiKeyword',
    category: 'crit',
  },
  
  // === RANGE/OTHER ===
  melta: {
    name: 'Melta',
    description: '+X damage at half range',
    type: 'number',
    default: 0,
    max: 4,
    category: 'range',
  },
  rapidFire: {
    name: 'Rapid Fire',
    description: '+X attacks at half range',
    type: 'number',
    default: 0,
    max: 4,
    category: 'range',
  },
  ignoresCover: {
    name: 'Ignores Cover',
    description: 'Target gets no cover bonus',
    type: 'toggle',
    category: 'other',
  },
  blast: {
    name: 'Blast',
    description: '+1 attack per 5 models',
    type: 'toggle',
    category: 'other',
  },
};

// ============ UNIT KEYWORDS ============

export const UNIT_KEYWORDS = [
  'INFANTRY',
  'VEHICLE',
  'MONSTER',
  'PSYKER',
  'FLY',
  'TITANIC',
  'DAEMON',
  'CHAOS',
];

// ============ DEFENSIVE ABILITIES - COMPLETE LIST ============

export const DEFENSIVE_ABILITIES = {
  // === SAVES ===
  invuln: {
    name: 'Invulnerable Save',
    description: 'Alternative save ignoring AP',
    type: 'select',
    options: [
      { value: 7, label: 'None' },
      { value: 6, label: '6++' },
      { value: 5, label: '5++' },
      { value: 4, label: '4++' },
      { value: 3, label: '3++' },
    ],
    category: 'save',
  },
  fnp: {
    name: 'Feel No Pain',
    description: 'Ignore wounds on X+',
    type: 'select',
    options: [
      { value: 7, label: 'None' },
      { value: 6, label: '6+++' },
      { value: 5, label: '5+++' },
      { value: 4, label: '4+++' },
    ],
    category: 'save',
  },
  hasCover: {
    name: 'In Cover',
    description: '+1 to save vs ranged',
    type: 'toggle',
    category: 'save',
  },
  apReduction: {
    name: 'Reduce AP',
    description: 'Reduce incoming AP by X',
    type: 'number',
    default: 0,
    max: 2,
    category: 'save',
  },
  
  // === WOUND PROTECTION ===
  minusToWound: {
    name: '-1 to Wound',
    description: 'Attackers get -1 to wound',
    type: 'number',
    default: 0,
    max: 2,
    category: 'wound',
  },
  transhumanlike: {
    name: 'Transhuman',
    description: "Can't wound better than 4+ when S>T",
    type: 'toggle',
    category: 'wound',
  },
  
  // === DAMAGE REDUCTION ===
  damageReduction: {
    name: 'Damage Reduction',
    description: 'Reduce damage by X (min 1)',
    type: 'number',
    default: 0,
    max: 3,
    category: 'damage',
  },
  damageCap: {
    name: 'Damage Cap',
    description: 'Max damage per attack',
    type: 'select',
    options: [
      { value: 0, label: 'None' },
      { value: 3, label: 'Max 3' },
      { value: 4, label: 'Max 4' },
      { value: 6, label: 'Max 6' },
    ],
    category: 'damage',
  },
  
  // === HIT PROTECTION ===
  stealth: {
    name: 'Stealth',
    description: '-1 to hit from ranged',
    type: 'toggle',
    category: 'hit',
  },
};

// ============ TARGET PRESETS ============

export const TARGET_PRESETS = [
  // Infantry
  { name: 'Guardsmen', t: 3, sv: 5, w: 1, m: 10, keywords: ['INFANTRY'] },
  { name: 'Intercessors', t: 4, sv: 3, w: 2, m: 5, keywords: ['INFANTRY'] },
  { name: 'Terminators', t: 5, sv: 2, w: 3, m: 5, invuln: 4, keywords: ['INFANTRY'] },
  { name: 'Gravis', t: 6, sv: 3, w: 3, m: 3, keywords: ['INFANTRY'] },
  { name: 'Custodian Guard', t: 6, sv: 2, w: 3, m: 5, invuln: 4, fnp: 6, keywords: ['INFANTRY'] },
  { name: 'Plague Marines', t: 6, sv: 3, w: 2, m: 5, keywords: ['INFANTRY', 'CHAOS'] }, // Note: FNP/minusToWound are detachment abilities
  
  // Special Infantry
  { name: 'Bullgryn', t: 6, sv: 3, w: 3, m: 3, invuln: 4, fnp: 6, damageReduction: 1, keywords: ['INFANTRY'] }, // 4++ Brute Shield, 6+++ FNP, Wall of Muscle -1D
  { name: 'Crisis Suits', t: 5, sv: 3, w: 4, m: 3, keywords: ['INFANTRY'] },
  
  // Monsters
  { name: 'Carnifex', t: 9, sv: 2, w: 8, m: 1, keywords: ['MONSTER'] },
  { name: 'Hive Tyrant', t: 10, sv: 2, w: 10, m: 1, invuln: 4, keywords: ['MONSTER', 'PSYKER'] },
  { name: 'C\'tan Shard', t: 11, sv: 3, w: 16, m: 1, invuln: 4, fnp: 5, damageReduction: 1, keywords: ['MONSTER'] }, // 4++, 5+++ FNP, Necrodermis -1D
  
  // Vehicles
  { name: 'Rhino', t: 9, sv: 3, w: 10, m: 1, keywords: ['VEHICLE'] },
  { name: 'Leman Russ', t: 11, sv: 2, w: 13, m: 1, keywords: ['VEHICLE'] },
  { name: 'Land Raider', t: 12, sv: 2, w: 16, m: 1, keywords: ['VEHICLE'] },
  { name: 'Knight', t: 11, sv: 3, w: 26, m: 1, invuln: 5, keywords: ['VEHICLE', 'TITANIC'] }, // Questoris-class
  { name: 'Baneblade', t: 13, sv: 2, w: 24, m: 1, keywords: ['VEHICLE', 'TITANIC'] },
];

// ============ WEAPON PRESETS ============

export const WEAPON_PRESETS = [
  { 
    name: 'Bolt Rifle', 
    attacks: 2, modelCount: 1, bs: 3, strength: 4, ap: 1, damage: '1',
    heavy: true,
  },
  { 
    name: 'Heavy Bolter', 
    attacks: 3, modelCount: 1, bs: 3, strength: 5, ap: 1, damage: '2',
    heavy: true, sustainedHits: 1,
  },
  { 
    name: 'Lascannon', 
    attacks: 1, modelCount: 1, bs: 3, strength: 12, ap: 3, damage: 'D6+1',
    heavy: true,
  },
  { 
    name: 'Multi-melta', 
    attacks: 2, modelCount: 1, bs: 3, strength: 9, ap: 4, damage: 'D6',
    heavy: true, melta: 2,
  },
  { 
    name: 'Grav-cannon', 
    attacks: 3, modelCount: 1, bs: 3, strength: 6, ap: 1, damage: 'D3',
    antiKeyword: { keyword: 'VEHICLE', value: 2 },
  },
  { 
    name: 'Flamer', 
    attacks: 'D6', modelCount: 1, bs: 3, strength: 4, ap: 0, damage: '1',
    torrent: true, ignoresCover: true,
  },
  { 
    name: 'Thunder Hammer', 
    attacks: 3, modelCount: 1, bs: 4, strength: 8, ap: 2, damage: '2',
    devastatingWounds: true,
  },
  { 
    name: 'Lightning Claws', 
    attacks: 5, modelCount: 1, bs: 3, strength: 4, ap: 2, damage: '1',
    twinLinked: true,
  },
];

// ============ DAMAGE PRESETS ============

export const DAMAGE_PRESETS = ['1', '2', '3', 'D3', 'D6', 'D6+1', 'D6+2', '2D6'];

// ============ ATTACK PRESETS ============

export const ATTACK_PRESETS = ['1', '2', '3', '4', '5', 'D3', 'D6', 'D6+1', '2D6'];

// ============ DEFAULT VALUES ============

export const DEFAULT_PROFILE = {
  name: 'Bolt Rifles',
  attacks: 2,
  modelCount: 5,
  bs: 3,
  strength: 4,
  ap: 1,
  damage: '1',
  
  // Hit modifiers
  torrent: false,
  heavy: false,
  hitMod: 0,
  rerollHits: 'none',
  critHitOn: 6,
  
  // Wound modifiers
  lance: false,
  woundMod: 0,
  twinLinked: false,
  rerollWounds: 'none',
  critWoundOn: 6,
  
  // Critical abilities
  sustainedHits: 0,
  lethalHits: false,
  devastatingWounds: false,
  antiKeyword: null,
  
  // Range/other
  melta: 0,
  rapidFire: 0,
  ignoresCover: false,
  blast: false,
};

export const DEFAULT_TARGET = {
  toughness: 4,
  save: 3,
  wounds: 2,
  models: 5,
  name: 'Intercessors',
  
  // Saves
  invuln: 7,
  fnp: 7,
  hasCover: false,
  apReduction: 0,
  
  // Wound protection
  minusToWound: 0,
  transhumanlike: false,
  
  // Damage reduction
  damageReduction: 0,
  damageCap: 0,
  
  // Hit protection
  stealth: false,
  
  // Other
  keywords: ['INFANTRY'],
  halfRange: false,
  stationary: true,
  charged: false,
};

// ============ SITUATIONAL MODIFIERS ============

export const SITUATIONAL_MODIFIERS = {
  attacker: [
    { key: 'stationary', label: 'Remained Stationary', description: 'For Heavy weapons' },
    { key: 'charged', label: 'Charged This Turn', description: 'For Lance weapons' },
  ],
  target: [
    { key: 'halfRange', label: 'Within Half Range', description: 'For Rapid Fire & Melta' },
    { key: 'hasCover', label: 'In Cover', description: '+1 to save' },
  ],
};

// ============ ABILITY CATEGORIES (for UI organization) ============

export const ABILITY_CATEGORIES = {
  hit: { name: 'Hit Modifiers', color: 'blue' },
  wound: { name: 'Wound Modifiers', color: 'green' },
  crit: { name: 'Critical Abilities', color: 'purple' },
  range: { name: 'Range Effects', color: 'orange' },
  other: { name: 'Other', color: 'gray' },
};