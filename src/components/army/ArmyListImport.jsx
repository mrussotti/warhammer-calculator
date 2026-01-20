import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { parseArmyList, getArmyStats, validateArmyList } from '../../utils/armyListParser';
import { mergeArmyWithWahapedia, getMatchSummary } from '../../utils/wahapediaMatcher';

/**
 * ArmyListImport - Paste and parse Warhammer app army lists
 * 
 * Now with Wahapedia data matching:
 * 1. User pastes army list text
 * 2. Text is parsed automatically
 * 3. Parsed data is matched against Wahapedia database
 * 4. Shows what matched and what didn't
 * 5. Merged data (with full weapon stats) passed to parent
 */
function ArmyListImport({ onImport }) {
  const [rawText, setRawText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [wahapediaUnits, setWahapediaUnits] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Track what we've already sent to parent to prevent infinite loops
  const lastImportedRef = useRef(null);
  
  // Load Wahapedia data on mount
  useEffect(() => {
    async function loadWahapediaData() {
      try {
        const res = await fetch('/data/units.json');
        if (res.ok) {
          const units = await res.json();
          setWahapediaUnits(units);
        }
      } catch (err) {
        console.error('Failed to load Wahapedia data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadWahapediaData();
  }, []);
  
  // Parse the army list whenever text changes
  const parsedArmy = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseArmyList(rawText);
  }, [rawText]);
  
  // Merge with Wahapedia data
  const mergedArmy = useMemo(() => {
    if (!parsedArmy || !wahapediaUnits) return parsedArmy;
    return mergeArmyWithWahapedia(parsedArmy, wahapediaUnits);
  }, [parsedArmy, wahapediaUnits]);
  
  // Get match summary for warnings
  const matchSummary = useMemo(() => {
    return getMatchSummary(mergedArmy);
  }, [mergedArmy]);
  
  // Get stats and validation
  const stats = useMemo(() => {
    if (!mergedArmy) return null;
    return getArmyStats(mergedArmy);
  }, [mergedArmy]);
  
  const issues = useMemo(() => {
    if (!mergedArmy) return [];
    return validateArmyList(mergedArmy);
  }, [mergedArmy]);
  
  const hasValidParse = mergedArmy && mergedArmy.units.length > 0;
  
  // Notify parent when army changes - using rawText as stable trigger
  // This prevents infinite loops by only firing when rawText actually changes
  useEffect(() => {
    // Only notify if we have a valid parse AND it's different from last time
    const armyId = hasValidParse ? `${rawText.length}-${mergedArmy?.units?.length}` : null;
    
    if (armyId !== lastImportedRef.current) {
      lastImportedRef.current = armyId;
      
      if (hasValidParse && onImport) {
        onImport(mergedArmy);
      } else if (!hasValidParse && onImport) {
        onImport(null);
      }
    }
  }, [rawText, hasValidParse, mergedArmy, onImport]);
  
  // Auto-collapse when we have a valid parse (separate from import notification)
  useEffect(() => {
    if (hasValidParse) {
      const timer = setTimeout(() => setIsExpanded(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(true);
    }
  }, [hasValidParse]);
  
  const handleClear = () => {
    setRawText('');
    setIsExpanded(true);
  };
  
  const sectionLabels = {
    characters: 'Characters',
    battleline: 'Battleline',
    transports: 'Dedicated Transports',
    other: 'Other Datasheets',
    allied: 'Allied Units',
    fortifications: 'Fortifications',
  };
  
  const sectionOrder = ['characters', 'battleline', 'transports', 'other', 'allied', 'fortifications'];

  return (
    <div className="space-y-4">
      {/* Import Input Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Clickable Header - always visible */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              hasValidParse 
                ? matchSummary.hasIssues 
                  ? 'bg-yellow-500/20' 
                  : 'bg-green-500/20'
                : 'bg-blue-500/20'
            }`}>
              {hasValidParse ? (
                matchSummary.hasIssues ? (
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {hasValidParse ? `${mergedArmy.armyName || 'Army'} Loaded` : 'Import Army List'}
                {hasValidParse && matchSummary.hasIssues && (
                  <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-medium rounded">
                    Incomplete
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500">
                {hasValidParse 
                  ? matchSummary.hasIssues
                    ? `${matchSummary.summary} · Click to review`
                    : `${mergedArmy.units.length} units · All data matched`
                  : isLoadingData 
                    ? 'Loading weapon database...'
                    : 'Paste from Warhammer app'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasValidParse && !isExpanded && (
              <span 
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
              >
                Clear
              </span>
            )}
            <svg 
              className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {/* Expandable Input Area */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
            <div className="pt-3">
              <label className="block text-xs text-zinc-500 mb-2">
                Paste your army list from the Warhammer app
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`* * * * * My Army (2000 Points)
Faction Name
Detachment Name
Strike Force (2,000 Points)

CHARACTERS
Warboss (75 Points)
 • 1x Big choppa
 • 1x Kombi-weapon
...`}
                className="w-full h-40 px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            
            {/* Status footer */}
            {rawText && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <button
                  onClick={handleClear}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear text
                </button>
                {hasValidParse ? (
                  <span className={`text-xs flex items-center gap-1.5 ${matchSummary.hasIssues ? 'text-yellow-400' : 'text-green-400'}`}>
                    {matchSummary.hasIssues ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {matchSummary.stats.unitsMatched}/{matchSummary.stats.units} units · {matchSummary.stats.weaponsMatched}/{matchSummary.stats.weapons} weapons matched
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {mergedArmy.units.length} units · {stats?.totalWeapons} weapons · All matched
                      </>
                    )}
                  </span>
                ) : rawText.length > 10 ? (
                  <span className="text-xs text-yellow-400">
                    Parsing... (paste more text or check format)
                  </span>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Match Issues Warning Banner */}
      {hasValidParse && matchSummary.hasIssues && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-yellow-400">Some data couldn't be matched</h4>
              <p className="text-xs text-zinc-400 mt-1">
                {matchSummary.summary}. Unmatched items won't have stats for damage analysis.
              </p>
              {matchSummary.details.length > 0 && matchSummary.details.length <= 10 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {matchSummary.details.map((item, idx) => (
                    <span 
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        item.type === 'unit' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {item.type === 'unit' ? '✗ ' : '? '}
                      {item.name}
                      {item.unit && <span className="text-zinc-500"> ({item.unit})</span>}
                    </span>
                  ))}
                </div>
              )}
              {matchSummary.details.length > 10 && (
                <p className="text-xs text-zinc-500 mt-2">
                  And {matchSummary.details.length - 10} more items...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Parsed Army Display */}
      {hasValidParse && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Header with army info */}
          <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-blue-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {mergedArmy.armyName || 'Unnamed Army'}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {mergedArmy.faction && (
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
                      {mergedArmy.faction}
                    </span>
                  )}
                  {mergedArmy.detachment && (
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                      {mergedArmy.detachment}
                    </span>
                  )}
                  {mergedArmy.gameSize && (
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-500">
                      {mergedArmy.gameSize}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400 font-mono">
                  {mergedArmy.totalParsedPoints}
                </div>
                <div className="text-xs text-zinc-500">points</div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-zinc-800 bg-zinc-950/50">
              <div className="text-center">
                <div className="text-xl font-bold text-white font-mono">{stats.totalUnits}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Units</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white font-mono">{stats.totalModels}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Models</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold font-mono ${matchSummary.hasIssues ? 'text-yellow-400' : 'text-white'}`}>
                  {matchSummary.stats?.weaponsMatched || 0}/{stats.totalWeapons}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Weapons</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white font-mono">
                  {stats.totalModels > 0 ? Math.round(stats.totalPoints / stats.totalModels) : 0}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pts/Model</div>
              </div>
            </div>
          )}
          
          {/* Validation Issues */}
          {issues.length > 0 && (
            <div className="px-4 py-2 border-b border-zinc-800 bg-yellow-500/5">
              {issues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs flex items-center gap-2 py-1 ${
                    issue.type === 'error' ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  <span>{issue.type === 'error' ? '✕' : '⚠'}</span>
                  {issue.message}
                </div>
              ))}
            </div>
          )}
          
          {/* Units by Section */}
          <div className="divide-y divide-zinc-800">
            {sectionOrder.map(section => {
              const sectionUnits = mergedArmy.units.filter(u => u.section === section);
              if (sectionUnits.length === 0) return null;
              
              const sectionPoints = sectionUnits.reduce((sum, u) => sum + u.points, 0);
              const sectionMatched = sectionUnits.filter(u => u._matched).length;
              
              return (
                <div key={section}>
                  {/* Section Header */}
                  <div className="px-4 py-2 bg-zinc-800/30 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      {sectionLabels[section] || section}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {sectionMatched < sectionUnits.length && (
                        <span className="text-yellow-400 mr-2">
                          {sectionMatched}/{sectionUnits.length} matched ·
                        </span>
                      )}
                      {sectionPoints} pts
                    </span>
                  </div>
                  
                  {/* Units in Section */}
                  <div className="divide-y divide-zinc-800/50">
                    {sectionUnits.map((unit, idx) => (
                      <UnitPreviewCard key={`${unit.name}-${idx}`} unit={unit} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Top Weapons */}
          {stats && stats.topWeapons && stats.topWeapons.length > 0 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Most Common Weapons
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.topWeapons.slice(0, 8).map((weapon, idx) => (
                  <span 
                    key={weapon.name}
                    className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
                  >
                    {weapon.name} <span className="text-zinc-500">×{weapon.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Empty state when text entered but no units found */}
      {rawText && mergedArmy && mergedArmy.units.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-white mb-1">Couldn't parse army list</h4>
          <p className="text-xs text-zinc-500">
            Make sure you're pasting the full text export from the Warhammer app
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact unit preview card with match status
 */
function UnitPreviewCard({ unit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Count actual models
  const totalModels = unit.models.reduce((sum, m) => sum + m.count, 0);
  
  // Count weapons and matched weapons
  const weaponStats = unit.models.reduce((acc, m) => {
    m.weapons.forEach(w => {
      acc.total += w.count;
      if (w._matched) acc.matched += w.count;
    });
    return acc;
  }, { total: 0, matched: 0 });
  
  const allWeaponsMatched = weaponStats.matched === weaponStats.total;
  const unitMatched = unit._matched;
  
  return (
    <div className="px-4 py-2">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg 
            className={`w-3 h-3 text-zinc-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          {/* Match status indicator */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            !unitMatched ? 'bg-red-500' :
            !allWeaponsMatched ? 'bg-yellow-500' :
            'bg-green-500'
          }`} />
          
          <span className={`text-sm group-hover:text-blue-400 transition-colors truncate ${
            unitMatched ? 'text-white' : 'text-red-400'
          }`}>
            {unit.name}
          </span>
          
          {unit.enhancements && unit.enhancements.length > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-500/20 rounded text-[10px] text-purple-400 flex-shrink-0">
              {unit.enhancements[0]}
            </span>
          )}
          
          {/* Warning badge for unmatched */}
          {!unitMatched && (
            <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-[10px] text-red-400 flex-shrink-0">
              Not found
            </span>
          )}
          {unitMatched && !allWeaponsMatched && (
            <span className="px-1.5 py-0.5 bg-yellow-500/20 rounded text-[10px] text-yellow-400 flex-shrink-0">
              {weaponStats.matched}/{weaponStats.total} weapons
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {unitMatched && unit.toughness && (
            <span className="text-xs text-zinc-600 font-mono">
              T{unit.toughness} {unit.save}+ {unit.wounds}W
            </span>
          )}
          <span className="text-xs text-zinc-400 font-mono w-12 text-right">
            {unit.points} pts
          </span>
        </div>
      </button>
      
      {isExpanded && unit.models.length > 0 && (
        <div className="mt-2 ml-6 space-y-2 animate-fade-in">
          {unit.models.map((model, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-zinc-500 font-mono">{model.count}×</span>
                <span>{model.name}</span>
              </div>
              {model.weapons.length > 0 && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {model.weapons.map((weapon, wIdx) => (
                    <div key={wIdx} className="flex items-center gap-2">
                      {/* Weapon match indicator */}
                      <span className={`w-1.5 h-1.5 rounded-full ${weapon._matched ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className={weapon._matched ? 'text-zinc-400' : 'text-yellow-400'}>
                        {weapon.count > 1 && <span className="font-mono">{weapon.count}× </span>}
                        {weapon.name}
                      </span>
                      {/* Show stats if matched */}
                      {weapon._matched && (
                        <span className="text-zinc-600 font-mono text-[10px]">
                          A{weapon.attacks} {weapon.type === 'melee' ? 'WS' : 'BS'}{weapon.bs}+ S{weapon.strength} AP-{weapon.ap} D{weapon.damage}
                        </span>
                      )}
                      {!weapon._matched && (
                        <span className="text-yellow-500/50 text-[10px]">no data</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArmyListImport;