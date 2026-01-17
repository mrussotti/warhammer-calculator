#!/usr/bin/env node
/**
 * Wahapedia Data Pipeline for Warhammer 40K 10th Edition
 * 
 * USAGE:
 *   node fetchWahapediaData.js
 * 
 * OUTPUT:
 *   public/data/units.json         - Full unit data with weapons
 *   public/data/searchIndex.json   - Lightweight search index
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wahapedia.ru/wh40k10ed';
const OUTPUT_DIR = './public/data';

const CSV_FILES = [
  'Factions.csv',
  'Datasheets.csv',
  'Datasheets_models.csv',
  'Datasheets_wargear.csv',   // This has weapon stats directly!
  'Datasheets_abilities.csv',
];

//=============================================================================
// HTTP FETCH
//=============================================================================
async function fetchCSV(filename) {
  const url = `${BASE_URL}/${filename}`;
  console.log(`   Fetching ${filename}...`);
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Warhammer40K-DamageCalculator/1.0' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status}`);
  }
  
  return await response.text();
}

//=============================================================================
// CSV PARSER (Wahapedia uses pipe delimiter)
//=============================================================================
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split('|')
    .map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split('|');
      const row = {};
      headers.forEach((h, i) => {
        if (h) row[h] = (values[i] || '').trim();
      });
      return row;
    });
}

//=============================================================================
// HTML UTILITIES
//=============================================================================
function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

//=============================================================================
// WEAPON PARSING - Direct from Datasheets_wargear columns
//=============================================================================
function parseWeapon(wargearRow) {
  const type = (wargearRow.type || '').toLowerCase();
  const isMelee = type.includes('melee');
  
  // Extract keywords from the type field (e.g., "Ranged, Heavy, Melta 2")
  let keywords = '';
  if (wargearRow.type) {
    // Remove "Ranged" or "Melee" prefix, keep the rest as keywords
    keywords = wargearRow.type
      .replace(/^(Ranged|Melee)\s*,?\s*/i, '')
      .trim();
  }
  
  return {
    name: stripHTML(wargearRow.name) || 'Unknown Weapon',
    range: wargearRow.range || (isMelee ? 'Melee' : ''),
    a: wargearRow.a || '1',
    bs: isMelee ? '' : (wargearRow.bs_ws || ''),
    ws: isMelee ? (wargearRow.bs_ws || '') : '',
    s: wargearRow.s || '4',
    ap: wargearRow.ap || '0',
    d: wargearRow.d || '1',
    keywords: keywords,
  };
}

//=============================================================================
// DEFENSIVE ABILITIES PARSER
//=============================================================================
function parseDefensiveAbilities(abilities) {
  let fnp = null;
  let damageReduction = null;
  let damageCap = null;
  
  for (const ability of abilities) {
    const desc = (ability.description || '').toLowerCase();
    const name = (ability.name || '').toLowerCase();
    
    // Feel No Pain
    let match = desc.match(/feel\s*no\s*pain\s*(\d)\+/i) ||
                desc.match(/(\d)\+[^.]*feel\s*no\s*pain/i);
    if (match && !fnp) fnp = parseInt(match[1]);
    
    if ((name.includes('feel no pain') || name.match(/fnp/i)) && !fnp) {
      match = (ability.name || '').match(/(\d)\+/);
      if (match) fnp = parseInt(match[1]);
    }
    
    // Damage reduction
    if ((desc.includes('halve') || desc.includes('half')) && desc.includes('damage')) {
      damageReduction = -1;
    }
    
    match = desc.match(/reduce[sd]?\s*(?:the\s*)?damage[^.]*by\s*(\d+)/i);
    if (match && damageReduction === null) damageReduction = parseInt(match[1]);
    
    // Damage cap
    match = desc.match(/cannot\s*(?:ever\s*)?lose\s*more\s*than\s*(\d+)\s*wounds?/i) ||
            desc.match(/maximum\s*of\s*(\d+)\s*wounds?\s*(?:can\s*be\s*)?lost/i);
    if (match && !damageCap) damageCap = parseInt(match[1]);
  }
  
  return { fnp, damageReduction, damageCap };
}

//=============================================================================
// MAIN PIPELINE
//=============================================================================
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Wahapedia Data Pipeline - Warhammer 40K 10th Ed       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Phase 1: Download CSVs
  console.log('📥 Phase 1: Downloading CSVs...\n');
  
  const data = {};
  for (const file of CSV_FILES) {
    try {
      const text = await fetchCSV(file);
      const key = file.replace('.csv', '').toLowerCase();
      data[key] = parseCSV(text);
      console.log(`      ✓ ${file}: ${data[key].length} rows`);
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.log(`      ✗ ${file}: ${err.message}`);
    }
  }

  // Phase 2: Build indexes
  console.log('\n🔗 Phase 2: Building indexes...\n');
  
  const factions = new Map();
  for (const f of data.factions || []) {
    factions.set(f.id, { id: f.id, name: f.name });
  }
  
  const models = new Map();
  for (const m of data.datasheets_models || []) {
    if (!models.has(m.datasheet_id)) models.set(m.datasheet_id, []);
    models.get(m.datasheet_id).push(m);
  }
  
  const abilities = new Map();
  for (const a of data.datasheets_abilities || []) {
    if (!abilities.has(a.datasheet_id)) abilities.set(a.datasheet_id, []);
    abilities.get(a.datasheet_id).push(a);
  }
  
  // Weapons are directly in datasheets_wargear with full stats!
  const weapons = new Map();
  for (const w of data.datasheets_wargear || []) {
    if (!weapons.has(w.datasheet_id)) weapons.set(w.datasheet_id, []);
    weapons.get(w.datasheet_id).push(w);
  }

  console.log(`   Factions: ${factions.size}`);
  console.log(`   Datasheets: ${data.datasheets?.length || 0}`);
  console.log(`   Model profiles: ${data.datasheets_models?.length || 0}`);
  console.log(`   Weapons: ${data.datasheets_wargear?.length || 0}`);
  console.log(`   Units with weapons: ${weapons.size}`);

  // Debug: Show sample weapon row
  if (data.datasheets_wargear?.length > 0) {
    const sample = data.datasheets_wargear.find(w => w.a && w.s && w.d);
    if (sample) {
      console.log('\n   Sample weapon from CSV:');
      console.log(`     Name: ${sample.name}`);
      console.log(`     Type: ${sample.type}`);
      console.log(`     Stats: A:${sample.a} BS/WS:${sample.bs_ws} S:${sample.s} AP:${sample.ap} D:${sample.d}`);
    }
  }

  // Phase 3: Process datasheets
  console.log('\n⚙️  Phase 3: Processing units...\n');
  
  const units = [];
  let totalWeapons = 0;
  
  for (const ds of data.datasheets || []) {
    if (ds.legend === 'true' || ds.virtual === 'true') continue;
    
    const faction = factions.get(ds.faction_id);
    if (!faction) continue;
    
    const modelProfiles = models.get(ds.id) || [];
    if (modelProfiles.length === 0) continue;
    
    // Get abilities
    const unitAbilities = abilities.get(ds.id) || [];
    const cleanAbilities = unitAbilities
      .filter(a => a.name && a.type !== 'Core')
      .map(a => ({ name: a.name, description: stripHTML(a.description) }));
    
    const defenses = parseDefensiveAbilities(unitAbilities);
    
    // Get invuln
    let invuln = null;
    for (const m of modelProfiles) {
      const inv = parseInt(m.inv_sv);
      if (!isNaN(inv) && inv > 0 && inv < 7) {
        if (invuln === null || inv < invuln) invuln = inv;
      }
    }
    
    // Get weapons - now directly from datasheets_wargear
    const unitWeapons = weapons.get(ds.id) || [];
    const rangedWeapons = [];
    const meleeWeapons = [];
    const seenWeapons = new Set();
    
    for (const wg of unitWeapons) {
      const weaponName = stripHTML(wg.name);
      if (!weaponName || seenWeapons.has(weaponName)) continue;
      seenWeapons.add(weaponName);
      
      const weapon = parseWeapon(wg);
      const type = (wg.type || '').toLowerCase();
      
      if (type.includes('melee')) {
        meleeWeapons.push(weapon);
      } else if (type.includes('ranged') || wg.range) {
        rangedWeapons.push(weapon);
      }
      
      totalWeapons++;
    }
    
    // Build model profiles
    const profiles = modelProfiles.map(m => ({
      name: m.name || ds.name,
      m: m.m || '',
      t: parseInt(m.t) || 0,
      sv: parseInt((m.sv || '').replace('+', '')) || 0,
      w: parseInt(m.w) || 0,
      ld: parseInt((m.ld || '').replace('+', '')) || 0,
      oc: parseInt(m.oc) || 0,
      inv: parseInt(m.inv_sv) || null,
    }));
    
    const primary = profiles.reduce(
      (best, p) => (!best || p.w > best.w) ? p : best,
      profiles[0]
    );
    
    units.push({
      id: ds.id,
      name: ds.name,
      faction: faction.name,
      factionId: ds.faction_id.toUpperCase(),
      role: ds.role || '',
      m: primary.m,
      t: primary.t,
      sv: primary.sv,
      w: primary.w,
      ld: primary.ld,
      oc: primary.oc,
      inv: invuln,
      fnp: defenses.fnp,
      damageReduction: defenses.damageReduction,
      damageCap: defenses.damageCap,
      profiles,
      weapons: { ranged: rangedWeapons, melee: meleeWeapons },
      abilities: cleanAbilities,
      keywords: [],
    });
  }

  const unitsWithWeapons = units.filter(u => u.weapons.ranged.length > 0 || u.weapons.melee.length > 0).length;
  
  console.log(`   Processed: ${units.length} units`);
  console.log(`   Units with weapons: ${unitsWithWeapons}`);
  console.log(`   Total weapons parsed: ${totalWeapons}`);

  // Phase 4: Write output
  console.log('\n💾 Phase 4: Writing output...\n');
  
  const searchIndex = units.map(u => ({
    id: u.id,
    name: u.name,
    faction: u.faction,
    factionId: u.factionId,
    role: u.role,
    t: u.t,
    sv: u.sv,
    w: u.w,
    inv: u.inv,
    fnp: u.fnp,
    damageReduction: u.damageReduction,
    damageCap: u.damageCap,
    keywords: u.keywords,
  }));
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'units.json'), JSON.stringify(units, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'searchIndex.json'), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'searchIndex.min.json'), JSON.stringify(searchIndex));
  
  const unitsSize = (fs.statSync(path.join(OUTPUT_DIR, 'units.json')).size / 1024 / 1024).toFixed(2);
  console.log(`   units.json: ${units.length} units (${unitsSize} MB)`);
  console.log(`   searchIndex.json: ${searchIndex.length} entries`);

  // Show sample units with weapons
  console.log('\n📋 Sample units with weapons:\n');
  
  const samples = units
    .filter(u => u.weapons.ranged.length > 0 || u.weapons.melee.length > 0)
    .slice(0, 5);
  
  for (const u of samples) {
    console.log(`   ${u.name} (${u.faction})`);
    if (u.weapons.ranged.length > 0) {
      for (const w of u.weapons.ranged.slice(0, 3)) {
        console.log(`     📍 ${w.name}: A:${w.a} BS:${w.bs} S:${w.s} AP:${w.ap} D:${w.d} ${w.keywords ? `[${w.keywords}]` : ''}`);
      }
      if (u.weapons.ranged.length > 3) console.log(`     ... and ${u.weapons.ranged.length - 3} more ranged`);
    }
    if (u.weapons.melee.length > 0) {
      for (const w of u.weapons.melee.slice(0, 2)) {
        console.log(`     ⚔️  ${w.name}: A:${w.a} WS:${w.ws} S:${w.s} AP:${w.ap} D:${w.d} ${w.keywords ? `[${w.keywords}]` : ''}`);
      }
      if (u.weapons.melee.length > 2) console.log(`     ... and ${u.weapons.melee.length - 2} more melee`);
    }
    console.log('');
  }

  console.log('✅ Done!\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});