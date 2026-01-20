/**
 * Army List Parser for Warhammer App text export format
 * 
 * Parses the text format exported from the official Warhammer app
 * into a structured data format for analysis.
 */

/**
 * Parse a full army list text export
 * @param {string} text - Raw text from Warhammer app export
 * @returns {object} Parsed army list data
 */
export function parseArmyList(text) {
  if (!text || typeof text !== 'string') {
    return { error: 'No text provided', units: [] };
  }

  const lines = text.split('\n').map(l => l.trimEnd());
  
  // Parse header info
  const header = parseHeader(lines);
  
  // Parse units
  const units = parseUnits(lines);
  
  // Calculate totals
  const totalParsedPoints = units.reduce((sum, u) => sum + (u.points || 0), 0);
  const totalModels = units.reduce((sum, u) => {
    return sum + u.models.reduce((mSum, m) => mSum + m.count, 0);
  }, 0);
  
  return {
    ...header,
    units,
    totalParsedPoints,
    totalModels,
    rawText: text,
  };
}

/**
 * Parse header information (army name, faction, detachment, etc.)
 */
function parseHeader(lines) {
  const header = {
    armyName: '',
    faction: '',
    detachment: '',
    gameSize: '',
    declaredPoints: 0,
  };
  
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    
    // Army name line (starts with asterisks)
    if (line.startsWith('*')) {
      const nameMatch = line.match(/\*[\s\*]*(.+?)\s*\((\d[\d,]*)\s*Points?\)/i);
      if (nameMatch) {
        header.armyName = nameMatch[1].trim();
        header.declaredPoints = parseInt(nameMatch[2].replace(/,/g, ''));
      }
    }
    
    // Game size line
    else if (line.match(/Strike Force|Incursion|Combat Patrol|Onslaught/i)) {
      const sizeMatch = line.match(/(.+?)\s*\((\d[\d,]*)\s*Points?\)/i);
      if (sizeMatch) {
        header.gameSize = sizeMatch[1].trim();
      } else {
        header.gameSize = line;
      }
    }
    
    // Section headers indicate we're past the header
    else if (isSection(line)) {
      break;
    }
    
    // Faction is usually the line after asterisks, before detachment
    else if (line && !header.faction && !line.includes('Points')) {
      header.faction = line;
    }
    
    // Detachment is after faction, before game size
    else if (line && header.faction && !header.detachment && !line.includes('Points')) {
      header.detachment = line;
    }
  }
  
  return header;
}

/**
 * Check if a line is a section header
 */
function isSection(line) {
  const sections = [
    'CHARACTERS',
    'BATTLELINE', 
    'DEDICATED TRANSPORTS',
    'OTHER DATASHEETS',
    'ALLIED UNITS',
    'FORTIFICATIONS',
  ];
  return sections.includes(line.trim().toUpperCase());
}

// Bullet point characters the Warhammer App uses
const BULLET = '•';      // U+2022 (primary bullet)
const SUB_BULLET = '◦';  // U+25E6 (sub-bullet for weapons)

/**
 * Parse all units from the army list
 * 
 * Two-pass approach to correctly detect single vs multi-model units:
 * - Multi-model units: • lines followed by ◦ lines (• = models, ◦ = weapons)
 * - Single-model units: • lines with NO ◦ lines (• = weapons, unit = 1 model)
 */
function parseUnits(lines) {
  const units = [];
  let currentSection = 'OTHER';
  let foundFirstSection = false;
  
  // First pass: collect all unit blocks with their lines
  const unitBlocks = [];
  let currentBlock = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and export footer
    if (!trimmed || trimmed.startsWith('Exported with')) continue;
    
    // Skip header lines (start with asterisks)
    if (trimmed.startsWith('*')) continue;
    
    // Skip game size line
    if (trimmed.match(/^(Strike Force|Incursion|Combat Patrol|Onslaught)\s*\(/i)) continue;
    
    // Section headers
    if (isSection(trimmed)) {
      currentSection = normalizeSectionName(trimmed);
      foundFirstSection = true;
      continue;
    }
    
    // Skip any lines before first section
    if (!foundFirstSection) continue;
    
    // Unit line: "Unit Name (XX Points)"
    // Must not start with bullet points
    if (!trimmed.startsWith(BULLET) && !trimmed.startsWith(SUB_BULLET)) {
      const unitMatch = trimmed.match(/^(.+?)\s*\((\d+)\s*Points?\)$/i);
      if (unitMatch) {
        // Save previous block
        if (currentBlock) {
          unitBlocks.push(currentBlock);
        }
        
        currentBlock = {
          name: unitMatch[1].trim(),
          points: parseInt(unitMatch[2]),
          section: currentSection,
          bulletLines: [],  // • lines
          hasSubBullets: false, // track if any ◦ lines exist
        };
        continue;
      }
    }
    
    // Collect • lines for current unit
    if (currentBlock && trimmed.startsWith(BULLET)) {
      currentBlock.bulletLines.push({ text: trimmed, subBullets: [] });
    }
    
    // Collect ◦ lines - attach to most recent • line
    if (currentBlock && trimmed.startsWith(SUB_BULLET)) {
      currentBlock.hasSubBullets = true;
      if (currentBlock.bulletLines.length > 0) {
        currentBlock.bulletLines[currentBlock.bulletLines.length - 1].subBullets.push(trimmed);
      }
    }
  }
  
  // Don't forget last block
  if (currentBlock) {
    unitBlocks.push(currentBlock);
  }
  
  // Second pass: parse each unit block based on whether it has ◦ lines
  for (const block of unitBlocks) {
    const unit = parseUnitBlock(block);
    units.push(unit);
  }
  
  return units;
}

/**
 * Parse a single unit block
 * Key insight: if there are ◦ lines, then • = models. If no ◦ lines, then • = weapons.
 */
function parseUnitBlock(block) {
  const unit = {
    name: block.name,
    points: block.points,
    section: block.section,
    models: [],
    enhancements: [],
  };
  
  // Regex patterns for parsing
  const enhancementRegex = new RegExp(`^${BULLET}\\s*Enhancements?:\\s*(.+)$`, 'i');
  const countedItemRegex = new RegExp(`^[${BULLET}${SUB_BULLET}]\\s*(\\d+)x\\s+(.+)$`);
  
  if (block.hasSubBullets) {
    // MULTI-MODEL FORMAT: • = models, ◦ = their weapons
    for (const bulletEntry of block.bulletLines) {
      const line = bulletEntry.text;
      
      // Check for enhancement
      const enhMatch = line.match(enhancementRegex);
      if (enhMatch) {
        unit.enhancements.push(enhMatch[1].trim());
        continue;
      }
      
      // Parse model line
      const modelMatch = line.match(countedItemRegex);
      if (modelMatch) {
        const model = {
          name: modelMatch[2].trim(),
          count: parseInt(modelMatch[1]),
          weapons: [],
        };
        
        // Parse weapons from sub-bullets
        for (const subLine of bulletEntry.subBullets) {
          const weaponMatch = subLine.match(countedItemRegex);
          if (weaponMatch) {
            model.weapons.push({
              name: weaponMatch[2].trim(),
              count: parseInt(weaponMatch[1]),
            });
          }
        }
        
        unit.models.push(model);
      }
    }
  } else {
    // SINGLE-MODEL FORMAT: • = weapons, unit itself is 1 model
    const weapons = [];
    
    for (const bulletEntry of block.bulletLines) {
      const line = bulletEntry.text;
      
      // Check for enhancement
      const enhMatch = line.match(enhancementRegex);
      if (enhMatch) {
        unit.enhancements.push(enhMatch[1].trim());
        continue;
      }
      
      // Parse weapon line
      const weaponMatch = line.match(countedItemRegex);
      if (weaponMatch) {
        weapons.push({
          name: weaponMatch[2].trim(),
          count: parseInt(weaponMatch[1]),
        });
      }
    }
    
    // Create a single model for this unit with all its weapons
    if (weapons.length > 0) {
      unit.models.push({
        name: block.name, // The unit name IS the model (e.g., "Beastboss")
        count: 1,
        weapons: weapons,
      });
    }
  }
  
  return unit;
}

/**
 * Normalize section names to consistent format
 */
function normalizeSectionName(section) {
  const map = {
    'CHARACTERS': 'characters',
    'BATTLELINE': 'battleline',
    'DEDICATED TRANSPORTS': 'transports',
    'OTHER DATASHEETS': 'other',
    'ALLIED UNITS': 'allied',
    'FORTIFICATIONS': 'fortifications',
  };
  return map[section.toUpperCase()] || 'other';
}

/**
 * Get summary statistics for an army list
 */
export function getArmyStats(armyList) {
  if (!armyList || !armyList.units) {
    return null;
  }
  
  const stats = {
    totalUnits: armyList.units.length,
    totalModels: 0,
    totalPoints: armyList.totalParsedPoints || 0,
    totalWeapons: 0,
    bySection: {},
    weaponCounts: {},
  };
  
  for (const unit of armyList.units) {
    // Count by section
    if (!stats.bySection[unit.section]) {
      stats.bySection[unit.section] = { units: 0, points: 0, models: 0 };
    }
    stats.bySection[unit.section].units++;
    stats.bySection[unit.section].points += unit.points || 0;
    
    // Count models and weapons
    for (const model of unit.models) {
      stats.totalModels += model.count;
      stats.bySection[unit.section].models += model.count;
      
      for (const weapon of model.weapons) {
        stats.totalWeapons += weapon.count;
        
        // Track weapon frequency
        const weaponKey = weapon.name.toLowerCase();
        if (!stats.weaponCounts[weaponKey]) {
          stats.weaponCounts[weaponKey] = { name: weapon.name, count: 0 };
        }
        stats.weaponCounts[weaponKey].count += weapon.count;
      }
    }
  }
  
  // Sort weapons by count
  stats.topWeapons = Object.values(stats.weaponCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return stats;
}

/**
 * Validate a parsed army list
 */
export function validateArmyList(armyList) {
  const issues = [];
  
  if (!armyList.faction) {
    issues.push({ type: 'warning', message: 'Could not detect faction' });
  }
  
  if (armyList.units.length === 0) {
    issues.push({ type: 'error', message: 'No units found in army list' });
  }
  
  // Check for units with no models
  for (const unit of armyList.units) {
    if (unit.models.length === 0) {
      issues.push({ 
        type: 'warning', 
        message: `Unit "${unit.name}" has no models parsed` 
      });
    }
  }
  
  // Check points mismatch
  if (armyList.declaredPoints && armyList.totalParsedPoints) {
    const diff = Math.abs(armyList.declaredPoints - armyList.totalParsedPoints);
    if (diff > 5) {
      issues.push({
        type: 'warning',
        message: `Points mismatch: declared ${armyList.declaredPoints}, parsed ${armyList.totalParsedPoints}`,
      });
    }
  }
  
  return issues;
}

export default parseArmyList;