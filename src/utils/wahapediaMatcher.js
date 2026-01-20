/**
 * Wahapedia Matcher - Merge imported army list with Wahapedia unit/weapon data
 * 
 * Exact matching only - no fuzzy stuff. Either it matches or user deals with it.
 */

const DEBUG = true; // Set to false to disable logging

function log(...args) {
  if (DEBUG) console.log('[WahapediaMatcher]', ...args);
}

/**
 * Normalize text for matching
 * Strips special characters, lowercases, removes extra spaces
 * Also removes trailing 's' for plural handling
 */
export function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[''`\-]/g, '')          // Remove apostrophes/hyphens
    .replace(/[^a-z0-9\s]/g, '')      // Remove special chars
    .replace(/\s+/g, ' ')             // Collapse spaces
    .trim();
}

/**
 * Normalize for weapon matching - more aggressive
 * Handles plurals and common suffixes
 */
export function normalizeWeapon(text) {
  if (!text) return '';
  let n = normalize(text);
  // Remove trailing 's' for plural handling (sluggas -> slugga)
  if (n.endsWith('s') && n.length > 3) {
    n = n.slice(0, -1);
  }
  return n;
}

/**
 * Parse weapon keywords into ability flags for damage calculator
 */
export function parseWeaponKeywords(keywordStr) {
  if (!keywordStr) return {};
  const kw = keywordStr.toLowerCase();
  const abilities = {};
  
  // Hit modifiers
  if (kw.includes('torrent')) abilities.torrent = true;
  if (kw.includes('heavy')) abilities.heavy = true;
  
  // Wound modifiers
  if (kw.includes('lance')) abilities.lance = true;
  if (kw.includes('twin-linked')) abilities.twinLinked = true;
  
  // Critical abilities
  if (kw.includes('lethal hits')) abilities.lethalHits = true;
  if (kw.includes('devastating wounds')) abilities.devastatingWounds = true;
  
  // Sustained Hits X
  const sustainedMatch = kw.match(/sustained hits\s*(\d+)?/);
  if (sustainedMatch) {
    abilities.sustainedHits = parseInt(sustainedMatch[1]) || 1;
  }
  
  // Anti-X Y+
  const antiMatch = kw.match(/anti-(\w+)\s*(\d+)\+/);
  if (antiMatch) {
    abilities.antiKeyword = {
      keyword: antiMatch[1].toUpperCase(),
      value: parseInt(antiMatch[2])
    };
  }
  
  // Melta X
  const meltaMatch = kw.match(/melta\s*(\d+)?/);
  if (meltaMatch) {
    abilities.melta = parseInt(meltaMatch[1]) || 2;
  }
  
  // Rapid Fire X
  const rapidMatch = kw.match(/rapid fire\s*(\d+)?/);
  if (rapidMatch) {
    abilities.rapidFire = parseInt(rapidMatch[1]) || 1;
  }
  
  // Other
  if (kw.includes('ignores cover')) abilities.ignoresCover = true;
  if (kw.includes('blast')) abilities.blast = true;
  
  return abilities;
}

/**
 * Parse BS/WS string to number (e.g., "3+" -> 3)
 */
function parseSkill(value) {
  if (!value) return 4;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) : 4;
}

/**
 * Parse AP string to number (e.g., "-2" -> 2, "0" -> 0)
 */
function parseAP(value) {
  if (!value || value === '-' || value === '0') return 0;
  const match = String(value).match(/-?(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Find a unit in Wahapedia data by name (exact match after normalization)
 */
export function findUnit(unitName, wahapediaUnits) {
  const normalizedName = normalize(unitName);
  log(`Finding unit: "${unitName}" -> normalized: "${normalizedName}"`);
  
  const match = wahapediaUnits.find(u => normalize(u.name) === normalizedName);
  
  if (match) {
    log(`  ✓ Found unit: "${match.name}" (id: ${match.id})`);
  } else {
    log(`  ✗ Unit not found. Similar names:`);
    // Log some close matches for debugging
    const similar = wahapediaUnits
      .filter(u => normalize(u.name).includes(normalizedName) || normalizedName.includes(normalize(u.name)))
      .slice(0, 5);
    similar.forEach(u => log(`    - "${u.name}"`));
  }
  
  return match || null;
}

/**
 * Find a weapon within a unit's weapon list
 * Tries multiple matching strategies:
 * 1. Exact match after normalization
 * 2. Plural handling (sluggas -> slugga)
 * 3. Prefix match (army list "Gork's Klaw" matches wahapedia "Gork's Klaw - strike")
 */
export function findWeapon(weaponName, wahaUnit) {
  if (!wahaUnit?.weapons) {
    log(`  No weapons data for unit`);
    return null;
  }
  
  const allWeapons = [
    ...(wahaUnit.weapons.ranged || []),
    ...(wahaUnit.weapons.melee || [])
  ];
  
  const normalizedName = normalize(weaponName);
  const normalizedNameNoPlural = normalizeWeapon(weaponName);
  
  log(`  Finding weapon: "${weaponName}" -> normalized: "${normalizedName}" / no-plural: "${normalizedNameNoPlural}"`);
  log(`  Available weapons:`, allWeapons.map(w => `"${w.name}" -> "${normalize(w.name)}"`));
  
  // Strategy 1: Exact match
  let match = allWeapons.find(w => normalize(w.name) === normalizedName);
  if (match) {
    log(`    ✓ Exact match: "${match.name}"`);
    return match;
  }
  
  // Strategy 2: Plural handling (twin sluggas -> twin slugga)
  match = allWeapons.find(w => normalizeWeapon(w.name) === normalizedNameNoPlural);
  if (match) {
    log(`    ✓ Plural match: "${match.name}"`);
    return match;
  }
  
  // Strategy 3: Army list name is prefix of wahapedia name
  // e.g., "Gork's Klaw" matches "Gork's Klaw - strike"
  match = allWeapons.find(w => normalize(w.name).startsWith(normalizedName));
  if (match) {
    log(`    ✓ Prefix match: "${weaponName}" -> "${match.name}"`);
    return match;
  }
  
  // Strategy 4: Wahapedia name is prefix of army list name
  match = allWeapons.find(w => normalizedName.startsWith(normalize(w.name)));
  if (match) {
    log(`    ✓ Reverse prefix match: "${weaponName}" -> "${match.name}"`);
    return match;
  }
  
  log(`    ✗ No match found for "${weaponName}"`);
  return null;
}

/**
 * Convert Wahapedia weapon format to damage calculator format
 */
export function convertWeaponStats(wahaWeapon, count = 1) {
  const isMelee = wahaWeapon.ws && !wahaWeapon.bs;
  
  return {
    name: wahaWeapon.name,
    count: count,
    attacks: wahaWeapon.a || '1',
    bs: parseSkill(isMelee ? wahaWeapon.ws : wahaWeapon.bs),
    strength: parseInt(wahaWeapon.s) || 4,
    ap: parseAP(wahaWeapon.ap),
    damage: wahaWeapon.d || '1',
    keywords: wahaWeapon.keywords || '',
    type: isMelee ? 'melee' : 'ranged',
    // Parse keywords into ability flags
    ...parseWeaponKeywords(wahaWeapon.keywords),
    _matched: true,
  };
}

/**
 * Merge a parsed army list with Wahapedia data
 * Returns army with stats filled in and match status flags
 */
export function mergeArmyWithWahapedia(parsedArmy, wahapediaUnits) {
  if (!parsedArmy?.units || !wahapediaUnits) {
    log('No army or wahapedia data provided');
    return { ...parsedArmy, _matchStats: { units: 0, matched: 0, weapons: 0, weaponsMatched: 0 } };
  }
  
  log('='.repeat(60));
  log(`Starting merge for army: "${parsedArmy.armyName || 'Unknown'}"`);
  log(`Units to match: ${parsedArmy.units.length}`);
  log(`Wahapedia units available: ${wahapediaUnits.length}`);
  log('='.repeat(60));
  
  let totalUnits = 0;
  let matchedUnits = 0;
  let totalWeapons = 0;
  let matchedWeapons = 0;
  const unmatchedItems = [];
  
  const mergedUnits = parsedArmy.units.map(unit => {
    totalUnits++;
    
    // Find unit in Wahapedia
    const wahaUnit = findUnit(unit.name, wahapediaUnits);
    
    if (!wahaUnit) {
      unmatchedItems.push({ type: 'unit', name: unit.name });
      return {
        ...unit,
        _matched: false,
        _matchReason: 'unit_not_found',
      };
    }
    
    matchedUnits++;
    
    // Merge unit stats
    const mergedUnit = {
      ...unit,
      // Defensive stats from Wahapedia
      toughness: wahaUnit.t,
      save: wahaUnit.sv,
      wounds: wahaUnit.w,
      invuln: wahaUnit.inv || 7,
      fnp: wahaUnit.fnp || 7,
      damageReduction: wahaUnit.damageReduction || 0,
      damageCap: wahaUnit.damageCap || 0,
      // Keep reference to full data
      _wahaId: wahaUnit.id,
      _matched: true,
    };
    
    // Match weapons for each model
    const mergedModels = unit.models.map(model => {
      const mergedWeapons = model.weapons.map(weapon => {
        // Count by quantity (e.g., "3x Choppa" = 3 weapons)
        const weaponCount = weapon.count || 1;
        totalWeapons += weaponCount;
        
        const wahaWeapon = findWeapon(weapon.name, wahaUnit);
        
        if (!wahaWeapon) {
          unmatchedItems.push({ type: 'weapon', name: weapon.name, unit: unit.name, count: weaponCount });
          return {
            ...weapon,
            _matched: false,
          };
        }
        
        matchedWeapons += weaponCount;
        return convertWeaponStats(wahaWeapon, weapon.count);
      });
      
      return {
        ...model,
        weapons: mergedWeapons,
      };
    });
    
    mergedUnit.models = mergedModels;
    
    // Count unmatched weapons for this unit (by quantity)
    const unmatchedWeaponCount = mergedModels.reduce((sum, m) => 
      sum + m.weapons.filter(w => !w._matched).reduce((wSum, w) => wSum + (w.count || 1), 0), 0
    );
    mergedUnit._unmatchedWeapons = unmatchedWeaponCount;
    
    return mergedUnit;
  });
  
  log('='.repeat(60));
  log('MERGE COMPLETE');
  log(`Units: ${matchedUnits}/${totalUnits} matched`);
  log(`Weapons: ${matchedWeapons}/${totalWeapons} matched`);
  if (unmatchedItems.length > 0) {
    log('Unmatched items:');
    unmatchedItems.forEach(item => {
      log(`  - [${item.type}] "${item.name}"${item.unit ? ` (in ${item.unit})` : ''}`);
    });
  }
  log('='.repeat(60));
  
  return {
    ...parsedArmy,
    units: mergedUnits,
    _matchStats: {
      units: totalUnits,
      unitsMatched: matchedUnits,
      weapons: totalWeapons,
      weaponsMatched: matchedWeapons,
      unmatchedItems,
      hasIssues: matchedUnits < totalUnits || matchedWeapons < totalWeapons,
    },
  };
}

/**
 * Get a summary of match issues for display
 */
export function getMatchSummary(mergedArmy) {
  if (!mergedArmy?._matchStats) {
    return { hasIssues: false, summary: '', details: [] };
  }
  
  const stats = mergedArmy._matchStats;
  const issues = [];
  
  if (stats.unitsMatched < stats.units) {
    const missing = stats.units - stats.unitsMatched;
    issues.push(`${missing} unit${missing > 1 ? 's' : ''} not found`);
  }
  
  if (stats.weaponsMatched < stats.weapons) {
    const missing = stats.weapons - stats.weaponsMatched;
    issues.push(`${missing} weapon${missing > 1 ? 's' : ''} not found`);
  }
  
  return {
    hasIssues: stats.hasIssues,
    summary: issues.join(', '),
    details: stats.unmatchedItems || [],
    stats,
  };
}

export default mergeArmyWithWahapedia;