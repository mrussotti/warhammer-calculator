// ============ HELPER FUNCTIONS ============

/**
 * Ensure a value is a valid number, return default if not
 */
function safeNum(val, defaultVal = 0) {
  if (val === null || val === undefined) return defaultVal;
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? defaultVal : n;
}

// ============ CORE PROBABILITY FUNCTIONS ============

/**
 * Calculate base wound roll needed based on Strength vs Toughness
 * Returns the die roll needed (2-6)
 */
export function getWoundRollNeeded(strength, toughness) {
  const s = safeNum(strength, 4);
  const t = safeNum(toughness, 4);
  if (s >= t * 2) return 2;
  if (s > t) return 3;
  if (s === t) return 4;
  if (s * 2 <= t) return 6;
  return 5;
}

/**
 * Calculate wound probability with modifiers
 */
export function getWoundProb(strength, toughness, modifiers = {}) {
  const {
    woundMod = 0,           // +1/-1 to wound
    transhumanlike = false, // Can't wound on better than 4+ when S > T
  } = modifiers;
  
  const s = safeNum(strength, 4);
  const t = safeNum(toughness, 4);
  const wMod = safeNum(woundMod, 0);
  
  let needed = getWoundRollNeeded(s, t);
  
  // Transhuman: if S > T, can't wound better than 4+
  if (transhumanlike && s > t) {
    needed = Math.max(needed, 4);
  }
  
  // Apply wound modifier (negative mod = harder to wound)
  needed = needed - wMod;
  
  // Clamp to valid range (2+ to 6+, always fail on 1)
  needed = Math.max(2, Math.min(6, needed));
  
  return (7 - needed) / 6;
}

/**
 * Get wound roll as display string
 */
export function getWoundRollDisplay(strength, toughness, modifiers = {}) {
  const {
    woundMod = 0,
    transhumanlike = false,
  } = modifiers;
  
  let needed = getWoundRollNeeded(strength, toughness);
  
  if (transhumanlike && strength > toughness) {
    needed = Math.max(needed, 4);
  }
  
  needed = needed - woundMod;
  needed = Math.max(2, Math.min(6, needed));
  
  return `${needed}+`;
}

/**
 * Calculate probability of failing a save
 */
export function getFailSaveProb(save, ap, target = {}) {
  const { 
    invuln = 7, 
    hasCover = false, 
    ignoresCover = false,
    apReduction = 0,  // Reduce AP by X
  } = target;
  
  const sv = safeNum(save, 4);
  const apVal = safeNum(ap, 0);
  const inv = safeNum(invuln, 7);
  const apRed = safeNum(apReduction, 0);
  
  // Reduce AP effectiveness
  const effectiveAP = Math.max(0, apVal - apRed);
  
  // Apply AP to armor save
  let modifiedArmorSave = sv + effectiveAP;
  
  // Apply cover bonus (+1 to save) if applicable
  // Cover doesn't apply if: ignores cover, or save is 3+ or better with AP 0
  const coverApplies = hasCover && !ignoresCover && !(sv <= 3 && effectiveAP === 0);
  if (coverApplies) {
    modifiedArmorSave = modifiedArmorSave - 1;
  }
  
  // Use better of armor or invuln (invuln ignores AP)
  const effectiveSave = Math.min(modifiedArmorSave, inv);
  
  // Can't save better than 2+
  const finalSave = Math.max(2, effectiveSave);
  
  if (finalSave > 6) return 1;
  return (finalSave - 1) / 6;
}

// ============ DICE PARSING ============

/**
 * Parse dice notation string (e.g., "D6", "2", "D3+1", "2D6", "2D6+3") into stats
 * Used for both attacks and damage values
 * 
 * Supported formats:
 * - Fixed: "1", "2", "10"
 * - Single die: "D3", "D6"
 * - Die + bonus: "D3+1", "D6+2"
 * - Multiple dice: "2D3", "2D6", "3D6"
 * - Multiple dice + bonus: "2D6+1", "3D3+2"
 */
export function parseDice(diceStr, defaultVal = 1) {
  if (diceStr === null || diceStr === undefined) {
    return { mean: defaultVal, variance: 0, min: defaultVal, max: defaultVal };
  }
  
  const str = String(diceStr).trim().toUpperCase();
  
  // Empty string
  if (str === '') {
    return { mean: defaultVal, variance: 0, min: defaultVal, max: defaultVal };
  }
  
  // Fixed number: "1", "2", "10"
  if (/^\d+$/.test(str)) {
    const val = parseInt(str);
    return { mean: val, variance: 0, min: val, max: val };
  }
  
  // Single D3 or D6
  if (str === 'D3') return { mean: 2, variance: 2/3, min: 1, max: 3 };
  if (str === 'D6') return { mean: 3.5, variance: 35/12, min: 1, max: 6 };
  
  // D3+X or D6+X (single die plus bonus)
  const singleDieMatch = str.match(/^D(\d+)\+(\d+)$/);
  if (singleDieMatch) {
    const dieSize = parseInt(singleDieMatch[1]);
    const bonus = parseInt(singleDieMatch[2]);
    const dieMean = (dieSize + 1) / 2;
    const dieVariance = (dieSize * dieSize - 1) / 12;
    return { 
      mean: dieMean + bonus, 
      variance: dieVariance, 
      min: 1 + bonus, 
      max: dieSize + bonus 
    };
  }
  
  // XDY+Z (multiple dice plus optional bonus)
  const multiDiceMatch = str.match(/^(\d+)D(\d+)(?:\+(\d+))?$/);
  if (multiDiceMatch) {
    const numDice = parseInt(multiDiceMatch[1]);
    const dieSize = parseInt(multiDiceMatch[2]);
    const bonus = multiDiceMatch[3] ? parseInt(multiDiceMatch[3]) : 0;
    const dieMean = (dieSize + 1) / 2;
    const dieVariance = (dieSize * dieSize - 1) / 12;
    return { 
      mean: numDice * dieMean + bonus, 
      variance: numDice * dieVariance,
      min: numDice + bonus,
      max: numDice * dieSize + bonus
    };
  }
  
  // Fallback - try to parse as number, otherwise return default
  const parsed = parseFloat(str);
  if (!isNaN(parsed)) {
    return { mean: parsed, variance: 0, min: parsed, max: parsed };
  }
  
  return { mean: defaultVal, variance: 0, min: defaultVal, max: defaultVal };
}

/**
 * Parse damage string - wrapper around parseDice for backwards compatibility
 */
export function parseDamage(damageStr) {
  return parseDice(damageStr, 1);
}

/**
 * Parse attacks string - wrapper around parseDice
 */
export function parseAttacks(attacksStr) {
  return parseDice(attacksStr, 1);
}

// ============ REROLL HELPERS ============

/**
 * Calculate probability after rerolls
 * @param {number} baseProb - Base probability of success
 * @param {string} rerollType - 'none', 'ones', 'all', 'fails'
 */
function applyReroll(baseProb, rerollType) {
  switch (rerollType) {
    case 'ones':
      // Reroll 1s: add (1/6) * baseProb
      return baseProb + (1/6) * baseProb;
    case 'all':
    case 'fails':
      // Reroll all failures: P + (1-P) * P
      return baseProb + (1 - baseProb) * baseProb;
    default:
      return baseProb;
  }
}

/**
 * Calculate expected crits after rerolls
 * @param {number} attacks - Number of attacks
 * @param {number} critThreshold - Roll needed for crit (usually 6, sometimes 5)
 * @param {string} rerollType - 'none', 'ones', 'all'
 */
function calculateCritsWithReroll(attacks, critThreshold, rerollType) {
  const baseCritProb = (7 - critThreshold) / 6;
  
  switch (rerollType) {
    case 'ones':
      // Rerolling 1s gives another chance at crits
      return attacks * (baseCritProb + (1/6) * baseCritProb);
    case 'all':
    case 'fails':
      // Rerolling all misses - need to calculate based on hit threshold
      // For simplicity, assume we get extra crit chances on rerolled dice
      // This is an approximation
      return attacks * baseCritProb * 1.5; // Rough estimate
    default:
      return attacks * baseCritProb;
  }
}

// ============ OVERKILL CALCULATIONS ============

export function calculateOverkillFactor(damageStats, woundsPerModel) {
  const { mean, min, max } = damageStats;
  
  if (min === max) {
    if (mean >= woundsPerModel) {
      return woundsPerModel / mean;
    }
    const hitsToKill = Math.ceil(woundsPerModel / mean);
    const totalDamageDealt = hitsToKill * mean;
    return woundsPerModel / totalDamageDealt;
  }
  
  if (mean >= woundsPerModel) {
    const expectedWaste = Math.max(0, (mean - woundsPerModel) * 0.5);
    return woundsPerModel / (woundsPerModel + expectedWaste);
  }
  
  const avgHitsToKill = woundsPerModel / mean;
  const fractionalPart = avgHitsToKill - Math.floor(avgHitsToKill);
  const expectedOverkill = fractionalPart * mean * 0.5;
  return woundsPerModel / (woundsPerModel + expectedOverkill);
}

// ============ MAIN DAMAGE CALCULATION ============

/**
 * Calculate expected damage for a weapon profile against a target
 * Supports ALL 10th edition modifiers
 */
export function calculateDamage(profile, target) {
  // ===== WEAPON PROFILE =====
  const {
    attacks: rawAttacks,
    modelCount: rawModelCount,
    bs: rawBs,
    strength: rawStrength,
    ap: rawAp,
    damage,
    
    // Hit modifiers
    torrent = false,          // Auto-hit
    heavy = false,            // +1 to hit if stationary
    hitMod = 0,               // General +/- to hit
    rerollHits = 'none',      // 'none', 'ones', 'all'
    critHitOn = 6,            // Critical hits on X+ (usually 6, sometimes 5)
    
    // Wound modifiers
    lance = false,            // +1 to wound on charge
    woundMod = 0,             // General +/- to wound
    rerollWounds = 'none',    // 'none', 'ones', 'all' (Twin-Linked = 'all')
    twinLinked = false,       // Shorthand for rerollWounds: 'all'
    critWoundOn = 6,          // Critical wounds on X+ (usually 6)
    
    // Critical abilities
    sustainedHits = 0,        // Extra hits on crit
    lethalHits = false,       // Crits auto-wound
    devastatingWounds = false,// Crit wounds bypass saves
    
    // Anti-X
    antiKeyword = null,       // { keyword: 'VEHICLE', value: 4 }
    
    // Range/situational
    melta = 0,                // +X damage at half range
    rapidFire = 0,            // +X attacks at half range
    ignoresCover = false,
    blast = false,            // +1 attack per 5 models (for future)
  } = profile || {};
  
  // Sanitize weapon stats - attacks can now be dice notation (e.g., "D6", "2D6")
  const attacksStats = parseAttacks(rawAttacks);
  const attacksPerModel = attacksStats.mean;
  const attacksVariancePerModel = attacksStats.variance;
  const attackerModelCount = safeNum(rawModelCount, 1);
  const attacks = attacksPerModel * attackerModelCount;
  const attacksVariance = attacksVariancePerModel * attackerModelCount;
  const bs = safeNum(rawBs, 4);
  const strength = safeNum(rawStrength, 4);
  const ap = safeNum(rawAp, 0);
  
  // ===== TARGET PROFILE =====
  const {
    toughness: rawToughness,
    save: rawSave,
    invuln = 7,
    fnp = 7,
    wounds: woundsPerModel = null,
    models: rawTargetModelCount = null,
    hasCover = false,
    stealth = false,
    keywords = [],
    
    // Defensive modifiers
    minusToWound = 0,         // -1 to wound against this target
    transhumanlike = false,   // Can't wound better than 4+ when S > T
    damageReduction = 0,      // Reduce damage by X (min 1)
    damageCap = 0,            // Max damage per attack (0 = no cap)
    apReduction = 0,          // Reduce AP by X
    
    // Situational
    stationary = false,
    charged = false,
    halfRange = false,
  } = target || {};
  
  // Sanitize target stats
  const toughness = safeNum(rawToughness, 4);
  const save = safeNum(rawSave, 4);
  const targetModelCount = (rawTargetModelCount !== null && rawTargetModelCount !== undefined)
    ? safeNum(rawTargetModelCount, 1)
    : null;
  
  // ===== STEP 0: Apply situational modifiers =====
  let effectiveAttacks = attacks;
  if (halfRange && rapidFire > 0) {
    // Rapid Fire X adds X attacks per model at half range
    effectiveAttacks += rapidFire * attackerModelCount;
  }
  if (blast) {
    // Blast: +1 attack per 5 models in the target unit, per model firing the weapon
    const blastModels = targetModelCount ?? 1;
    if (blastModels > 5) {
      effectiveAttacks += Math.floor(blastModels / 5) * attackerModelCount;
    }
  }
  
  let damageStats = parseDamage(damage);
  if (halfRange && melta > 0) {
    damageStats = {
      ...damageStats,
      mean: damageStats.mean + melta,
      min: damageStats.min + melta,
      max: damageStats.max + melta,
    };
  }
  
  // Apply damage reduction
  if (damageReduction > 0) {
    damageStats = {
      ...damageStats,
      mean: Math.max(1, damageStats.mean - damageReduction),
      min: Math.max(1, damageStats.min - damageReduction),
      max: Math.max(1, damageStats.max - damageReduction),
    };
  }
  
  // Apply damage cap
  if (damageCap > 0) {
    damageStats = {
      ...damageStats,
      mean: Math.min(damageCap, damageStats.mean),
      min: Math.min(damageCap, damageStats.min),
      max: Math.min(damageCap, damageStats.max),
      variance: damageStats.max > damageCap ? 0 : damageStats.variance,
    };
  }
  
  // ===== STEP 1: Calculate Hits =====
  let hitProb;
  let effectiveCritHitOn = critHitOn;
  
  if (torrent) {
    hitProb = 1;
    effectiveCritHitOn = 7; // No crits on auto-hit
  } else {
    let effectiveBS = bs;
    
    // Heavy: +1 to hit if stationary
    if (heavy && stationary) {
      effectiveBS = Math.max(2, effectiveBS - 1);
    }
    
    // Apply hit modifier
    effectiveBS = effectiveBS - hitMod;
    
    // Stealth: -1 to hit
    if (stealth) {
      effectiveBS = effectiveBS + 1;
    }
    
    // Clamp BS
    effectiveBS = Math.max(2, Math.min(6, effectiveBS));
    
    hitProb = (7 - effectiveBS) / 6;
    
    // Apply hit rerolls
    hitProb = applyReroll(hitProb, rerollHits);
  }
  
  // Calculate crits
  const critHitProb = effectiveCritHitOn <= 6 ? (7 - effectiveCritHitOn) / 6 : 0;
  let expectedCritHits = effectiveAttacks * critHitProb;
  if (rerollHits !== 'none' && !torrent) {
    expectedCritHits = calculateCritsWithReroll(effectiveAttacks, effectiveCritHitOn, rerollHits);
  }
  
  // Total hits
  const expectedHits = effectiveAttacks * hitProb;
  const sustainedBonus = expectedCritHits * sustainedHits;
  const totalHits = expectedHits + sustainedBonus;
  
  // ===== STEP 2: Calculate Wounds =====
  
  // Determine effective reroll type for wounds
  const effectiveRerollWounds = twinLinked ? 'all' : rerollWounds;
  
  // Calculate wound modifiers
  let totalWoundMod = woundMod;
  if (lance && charged) {
    totalWoundMod += 1;
  }
  // Target's defensive wound modifier
  totalWoundMod -= minusToWound;
  
  // Base wound probability
  const baseWoundProb = getWoundProb(strength, toughness, {
    woundMod: totalWoundMod,
    transhumanlike,
  });
  
  // Apply wound rerolls
  const woundProb = applyReroll(baseWoundProb, effectiveRerollWounds);
  
  // Critical wound threshold
  let effectiveCritWoundOn = critWoundOn;
  
  // Anti-X: Critical wounds on X+ vs matching keyword
  if (antiKeyword && keywords.includes(antiKeyword.keyword)) {
    effectiveCritWoundOn = Math.min(effectiveCritWoundOn, antiKeyword.value);
  }
  
  const critWoundProb = Math.min((7 - effectiveCritWoundOn) / 6, woundProb);
  
  // Lethal Hits: Crit hits auto-wound
  let autoWounds = 0;
  let hitsToRoll = totalHits;
  
  if (lethalHits) {
    autoWounds = expectedCritHits;
    hitsToRoll = totalHits - expectedCritHits;
  }
  
  // Wounds from rolling
  const rolledWounds = hitsToRoll * woundProb;
  const totalWounds = autoWounds + rolledWounds;
  
  // Critical wounds (for Devastating Wounds)
  const critWounds = hitsToRoll * critWoundProb;
  const normalWounds = autoWounds + (rolledWounds - critWounds);
  
  // ===== STEP 3: Calculate Damage After Saves =====
  
  const failSaveProb = getFailSaveProb(save, ap, { 
    invuln, 
    hasCover, 
    ignoresCover,
    apReduction,
  });
  
  // FNP
  const fnpIgnoreProb = fnp <= 6 ? (7 - fnp) / 6 : 0;
  const fnpPassProb = 1 - fnpIgnoreProb;
  
  let totalDamage;
  let devastatingDamage = 0;
  let normalDamage;
  let unsavedWounds;
  
  if (devastatingWounds && critWounds > 0) {
    // Devastating Wounds: Critical wounds bypass saves (but not FNP)
    devastatingDamage = critWounds * damageStats.mean * fnpPassProb;
    
    // Normal wounds: go through saves, then FNP
    const normalUnsaved = normalWounds * failSaveProb;
    normalDamage = normalUnsaved * damageStats.mean * fnpPassProb;
    
    totalDamage = devastatingDamage + normalDamage;
    unsavedWounds = critWounds * fnpPassProb + normalUnsaved * fnpPassProb;
  } else {
    // Standard: All wounds go through saves, then FNP
    unsavedWounds = totalWounds * failSaveProb * fnpPassProb;
    totalDamage = unsavedWounds * damageStats.mean;
    normalDamage = totalDamage;
  }
  
  // ===== STEP 4: Calculate Kills =====
  
  let expectedKills = null;
  let overkillEfficiency = null;
  
  if (woundsPerModel) {
    overkillEfficiency = calculateOverkillFactor(damageStats, woundsPerModel);
    const effectiveDamage = totalDamage * overkillEfficiency;
    expectedKills = effectiveDamage / woundsPerModel;
    
    if (targetModelCount) {
      expectedKills = Math.min(expectedKills, targetModelCount);
    }
  }
  
  // ===== STEP 5: Calculate Variance =====
  
  const pSuccess = hitProb * woundProb * failSaveProb * fnpPassProb;
  // Variance from binomial process (which attacks succeed)
  const varN = effectiveAttacks * pSuccess * (1 - pSuccess);
  // Variance from damage per wound
  const varFromDamage = unsavedWounds * damageStats.variance;
  // Variance from expected damage per success
  const varFromSuccesses = varN * damageStats.mean * damageStats.mean;
  // Variance from variable attacks (if attacks are dice-based)
  const varFromAttacks = attacksVariance * pSuccess * pSuccess * damageStats.mean * damageStats.mean;
  
  const variance = varFromDamage + varFromSuccesses + varFromAttacks;
  
  // Ensure no NaN values leak out
  return {
    // Core results
    expected: safeNum(totalDamage),
    variance: safeNum(variance),
    stdDev: safeNum(Math.sqrt(variance)),
    expectedKills: expectedKills !== null ? safeNum(expectedKills) : null,
    overkillEfficiency: overkillEfficiency !== null ? safeNum(overkillEfficiency) : null,
    
    // Pipeline breakdown
    attacks: safeNum(effectiveAttacks),
    expectedHits: safeNum(totalHits),
    expectedCritHits: safeNum(expectedCritHits),
    sustainedBonus: safeNum(sustainedBonus),
    expectedWoundsFromHits: safeNum(totalWounds),
    autoWounds: safeNum(autoWounds),
    critWounds: safeNum(critWounds),
    expectedUnsaved: safeNum(unsavedWounds),
    devastatingDamage: safeNum(devastatingDamage),
    normalDamage: safeNum(normalDamage),
    
    // Probabilities
    hitProb: safeNum(hitProb),
    woundProb: safeNum(woundProb),
    failSaveProb: safeNum(failSaveProb),
    fnpPassProb: safeNum(fnpPassProb),
    pSuccess: safeNum(pSuccess),
    
    // Damage stats
    damagePerWound: safeNum(damageStats.mean),
    damageStats,
  };
}

/**
 * Calculate combined damage from multiple weapon profiles
 */
export function calculateCombinedDamage(profiles, target) {
  const { wounds: woundsPerModel, models: modelCount } = target || {};
  
  // Handle empty profiles array
  if (!profiles || profiles.length === 0) {
    return {
      total: {
        expected: 0,
        variance: 0,
        stdDev: 0,
        expectedKills: 0,
        maxKills: safeNum(modelCount),
        overkillWaste: 0,
        woundsPerModel: safeNum(woundsPerModel),
      },
      breakdown: [],
    };
  }
  
  const results = profiles.map(p => ({
    profile: p,
    result: calculateDamage(p, target)
  }));
  
  const totalExpected = results.reduce((sum, r) => sum + safeNum(r.result.expected), 0);
  const totalVariance = results.reduce((sum, r) => sum + safeNum(r.result.variance), 0);
  
  let totalKills = null;
  let actualKills = null;
  let overkillWaste = null;
  
  if (woundsPerModel && modelCount) {
    totalKills = results.reduce((sum, r) => sum + safeNum(r.result.expectedKills), 0);
    actualKills = Math.min(totalKills, modelCount);
    overkillWaste = totalKills > modelCount ? (totalKills - modelCount) * woundsPerModel : 0;
  }
  
  return {
    total: {
      expected: safeNum(totalExpected),
      variance: safeNum(totalVariance),
      stdDev: safeNum(Math.sqrt(totalVariance)),
      expectedKills: actualKills !== null ? safeNum(actualKills) : null,
      maxKills: modelCount,
      overkillWaste: overkillWaste !== null ? safeNum(overkillWaste) : null,
      woundsPerModel,
    },
    breakdown: results,
  };
}

// ============ VISUALIZATION HELPERS ============

export function getHeatmapColor(value, max) {
  if (max === 0) return 'rgb(240, 240, 240)';
  const ratio = Math.min(value / max, 1);
  const r = Math.round(60 + ratio * 195);
  const g = Math.round(20 + ratio * 180);
  const b = Math.round(80 - ratio * 60);
  return `rgb(${r}, ${g}, ${b})`;
}