// ============ CORE PROBABILITY FUNCTIONS ============

/**
 * Calculate wound roll probability based on Strength vs Toughness
 */
export function getWoundProb(strength, toughness) {
  if (strength >= toughness * 2) return 5/6;
  if (strength > toughness) return 4/6;
  if (strength === toughness) return 3/6;
  if (strength * 2 <= toughness) return 1/6;
  return 2/6;
}

/**
 * Get the wound roll needed as a string (e.g., "3+")
 */
export function getWoundRollNeeded(strength, toughness) {
  if (strength >= toughness * 2) return '2+';
  if (strength > toughness) return '3+';
  if (strength === toughness) return '4+';
  if (strength * 2 <= toughness) return '6+';
  return '5+';
}

/**
 * Calculate probability of failing a save after AP is applied
 */
export function getFailSaveProb(save, ap) {
  const modifiedSave = save + ap;
  if (modifiedSave > 6) return 1;
  return (modifiedSave - 1) / 6;
}

// ============ DAMAGE PARSING ============

/**
 * Parse damage string (e.g., "D6", "2", "D3+1", "2D6") into stats
 */
export function parseDamage(damageStr) {
  const str = damageStr.trim().toUpperCase();
  
  // Fixed damage (e.g., "2")
  if (/^\d+$/.test(str)) {
    const val = parseInt(str);
    return { mean: val, variance: 0, min: val, max: val };
  }
  
  // Simple dice
  if (str === 'D3') return { mean: 2, variance: 2/3, min: 1, max: 3 };
  if (str === 'D6') return { mean: 3.5, variance: 35/12, min: 1, max: 6 };
  
  // Dice with modifier (e.g., "D3+1")
  const d3Match = str.match(/^D3\+(\d+)$/);
  if (d3Match) {
    const bonus = parseInt(d3Match[1]);
    return { mean: 2 + bonus, variance: 2/3, min: 1 + bonus, max: 3 + bonus };
  }
  
  const d6Match = str.match(/^D6\+(\d+)$/);
  if (d6Match) {
    const bonus = parseInt(d6Match[1]);
    return { mean: 3.5 + bonus, variance: 35/12, min: 1 + bonus, max: 6 + bonus };
  }
  
  // Multiple dice (e.g., "2D6")
  const multiMatch = str.match(/^(\d+)D(\d+)$/);
  if (multiMatch) {
    const numDice = parseInt(multiMatch[1]);
    const dieSize = parseInt(multiMatch[2]);
    return { 
      mean: numDice * (dieSize + 1) / 2, 
      variance: numDice * (dieSize * dieSize - 1) / 12,
      min: numDice,
      max: numDice * dieSize
    };
  }
  
  // Default fallback
  return { mean: 1, variance: 0, min: 1, max: 1 };
}

// ============ OVERKILL CALCULATIONS ============

/**
 * Calculate efficiency factor accounting for overkill damage waste
 */
export function calculateOverkillFactor(damageStats, woundsPerModel) {
  const { mean, min, max } = damageStats;
  
  // Fixed damage
  if (min === max) {
    if (mean >= woundsPerModel) {
      return woundsPerModel / mean;
    }
    const hitsToKill = Math.ceil(woundsPerModel / mean);
    const totalDamageDealt = hitsToKill * mean;
    return woundsPerModel / totalDamageDealt;
  }
  
  // Variable damage
  if (mean >= woundsPerModel) {
    const expectedWaste = Math.max(0, (mean - woundsPerModel) * 0.5);
    return woundsPerModel / (woundsPerModel + expectedWaste);
  }
  
  const avgHitsToKill = woundsPerModel / mean;
  const fractionalPart = avgHitsToKill - Math.floor(avgHitsToKill);
  const expectedOverkill = fractionalPart * mean * 0.5;
  return woundsPerModel / (woundsPerModel + expectedOverkill);
}

// ============ MAIN DAMAGE CALCULATIONS ============

/**
 * Calculate expected damage for a single weapon profile against a target
 */
export function calculateDamage(profile, toughness, save, woundsPerModel = null) {
  const hitProb = (7 - profile.bs) / 6;
  const woundProb = getWoundProb(profile.strength, toughness);
  const failSaveProb = getFailSaveProb(save, profile.ap);
  const damage = parseDamage(profile.damage);
  
  const pSuccess = hitProb * woundProb * failSaveProb;
  const expectedWounds = profile.attacks * pSuccess;
  const expectedDamage = expectedWounds * damage.mean;
  
  // Variance calculation using law of total variance
  const varN = profile.attacks * pSuccess * (1 - pSuccess);
  const variance = expectedWounds * damage.variance + varN * damage.mean * damage.mean;
  
  let expectedKills = null;
  let overkillEfficiency = null;
  
  if (woundsPerModel) {
    overkillEfficiency = calculateOverkillFactor(damage, woundsPerModel);
    const effectiveDamage = expectedDamage * overkillEfficiency;
    expectedKills = effectiveDamage / woundsPerModel;
  }
  
  return {
    expected: expectedDamage,
    variance,
    stdDev: Math.sqrt(variance),
    woundProb,
    failSaveProb,
    pSuccess,
    expectedWounds,
    attacks: profile.attacks,
    expectedHits: profile.attacks * hitProb,
    expectedWoundsFromHits: profile.attacks * hitProb * woundProb,
    expectedUnsaved: profile.attacks * hitProb * woundProb * failSaveProb,
    hitProb,
    expectedKills,
    overkillEfficiency,
    damagePerWound: damage.mean,
  };
}

/**
 * Calculate combined damage from multiple weapon profiles
 */
export function calculateCombinedDamage(profiles, toughness, save, woundsPerModel = null, modelCount = null) {
  const results = profiles.map(p => ({
    profile: p,
    result: calculateDamage(p, toughness, save, woundsPerModel)
  }));
  
  const totalExpected = results.reduce((sum, r) => sum + r.result.expected, 0);
  const totalVariance = results.reduce((sum, r) => sum + r.result.variance, 0);
  
  let totalKills = null;
  let actualKills = null;
  let overkillWaste = null;
  
  if (woundsPerModel && modelCount) {
    totalKills = results.reduce((sum, r) => sum + (r.result.expectedKills || 0), 0);
    actualKills = Math.min(totalKills, modelCount);
    overkillWaste = totalKills > modelCount ? (totalKills - modelCount) * woundsPerModel : 0;
  }
  
  return {
    total: {
      expected: totalExpected,
      variance: totalVariance,
      stdDev: Math.sqrt(totalVariance),
      expectedKills: actualKills,
      maxKills: modelCount,
      overkillWaste,
      woundsPerModel,
    },
    breakdown: results,
  };
}

// ============ VISUALIZATION HELPERS ============

/**
 * Generate heatmap color based on value intensity
 */
export function getHeatmapColor(value, max) {
  if (max === 0) return 'rgb(240, 240, 240)';
  const ratio = Math.min(value / max, 1);
  const r = Math.round(60 + ratio * 195);
  const g = Math.round(20 + ratio * 180);
  const b = Math.round(80 - ratio * 60);
  return `rgb(${r}, ${g}, ${b})`;
}
